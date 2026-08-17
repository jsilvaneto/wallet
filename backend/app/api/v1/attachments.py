import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, AsyncSessionLocal
from app.models import User, Attachment, Transaction
from app.api.v1.deps import get_current_user
from app.schemas.attachment import (
    AttachmentResponse,
    AttachmentStatsResponse,
    DriveSyncTriggerResponse,
    ProfileType,
    SyncStatusType
)
from app.services.attachment_service import (
    save_uploaded_attachment,
    get_absolute_file_path,
    delete_attachment,
    get_storage_stats,
    enrich_attachment_schema
)
from app.services.google_drive_service import (
    upload_attachment_to_drive,
    sync_all_pending_attachments,
    delete_attachment_from_drive
)
from app.services.google_sheets_service import get_service_account_info, get_config_value

router = APIRouter(prefix="/attachments", tags=["Anexos e Comprovantes"])

async def background_drive_upload(attachment_id: str):
    """Worker em background para realizar o upload assíncrono ao Google Drive."""
    try:
        async with AsyncSessionLocal() as session:
            await upload_attachment_to_drive(session, attachment_id)
    except Exception as e:
        print(f"Erro no worker de backup do Google Drive para {attachment_id}: {e}")

async def background_drive_delete(drive_file_id: Optional[str]):
    """Worker em background para remover arquivo do Google Drive."""
    if not drive_file_id:
        return
    try:
        async with AsyncSessionLocal() as session:
            await delete_attachment_from_drive(session, drive_file_id)
    except Exception as e:
        print(f"Erro no worker de remoção do Google Drive para {drive_file_id}: {e}")

@router.post("/upload", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    profile: ProfileType = Form(...),
    transaction_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """
    Realiza o upload imediato e seguro do comprovante para o disco local (< 50ms)
    e agenda em segundo plano o backup assíncrono para o Google Drive.
    """
    attachment = await save_uploaded_attachment(
        db=db,
        upload_file=file,
        profile=profile,
        transaction_id=transaction_id
    )

    # Agenda o backup em background para não travar a resposta HTTP
    background_tasks.add_task(background_drive_upload, attachment.id)

    return enrich_attachment_schema(attachment)

@router.get("", response_model=List[AttachmentResponse])
async def list_attachments(
    profile: Optional[ProfileType] = Query(None, description="Filtrar por PESSOAL ou EMPRESA"),
    transaction_id: Optional[str] = Query(None, description="Filtrar por lançamento"),
    sync_status: Optional[SyncStatusType] = Query(None, description="Filtrar por status de sincronização"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Lista todos os anexos cadastrados com opções de filtro e URLs formatadas."""
    query = select(Attachment)
    if profile:
        query = query.where(Attachment.profile == profile)
    if transaction_id:
        query = query.where(Attachment.transaction_id == transaction_id)
    if sync_status:
        query = query.where(Attachment.sync_status == sync_status)

    query = query.order_by(Attachment.created_at.desc())
    attachments = (await db.execute(query)).scalars().all()

    return [enrich_attachment_schema(att) for att in attachments]

@router.get("/stats", response_model=AttachmentStatsResponse)
async def get_attachment_statistics(
    profile: Optional[ProfileType] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Retorna métricas de armazenamento local e status do Google Drive."""
    stats = await get_storage_stats(db, profile)

    # Checa status de conexão com Google Drive
    info, _ = await get_service_account_info(db)
    stats.drive_connected = info is not None
    stats.drive_folder_name = await get_config_value(db, "google_drive_folder_id") or "Wallet - Comprovantes"

    return stats

@router.get("/{attachment_id}", response_model=AttachmentResponse)
async def get_attachment(
    attachment_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Busca os metadados de um anexo específico."""
    att = await db.get(Attachment, attachment_id)
    if not att:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprovante não encontrado."
        )
    return enrich_attachment_schema(att)

@router.get("/{attachment_id}/file")
async def preview_attachment_file(
    attachment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Serve o arquivo binário localmente com headers inline para exibição direta no navegador
    (fotos, recibos e PDFs).
    """
    att = await db.get(Attachment, attachment_id)
    if not att:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprovante não encontrado."
        )

    abs_path = get_absolute_file_path(att)
    if not os.path.exists(abs_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo físico não encontrado no disco."
        )

    return FileResponse(
        path=abs_path,
        media_type=att.mime_type,
        headers={
            "Content-Disposition": f'inline; filename="{att.file_name}"',
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.get("/{attachment_id}/download")
async def download_attachment_file(
    attachment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Força o download direto do arquivo com o nome original."""
    att = await db.get(Attachment, attachment_id)
    if not att:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprovante não encontrado."
        )

    abs_path = get_absolute_file_path(att)
    if not os.path.exists(abs_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo físico não encontrado no disco."
        )

    return FileResponse(
        path=abs_path,
        media_type=att.mime_type,
        filename=att.file_name
    )

@router.delete("/{attachment_id}")
async def remove_attachment(
    attachment_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Exclui o anexo do banco, apaga o arquivo do disco local e agenda remoção no Google Drive."""
    att = await db.get(Attachment, attachment_id)
    if not att:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprovante não encontrado."
        )

    drive_file_id = att.drive_file_id
    success = await delete_attachment(db, attachment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao remover comprovante."
        )

    if drive_file_id:
        background_tasks.add_task(background_drive_delete, drive_file_id)

    return {"success": True, "message": "Comprovante removido com sucesso."}

@router.post("/sync-drive", response_model=DriveSyncTriggerResponse)
async def trigger_drive_sync(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Dispara a sincronização/backup de todos os comprovantes pendentes para o Google Drive."""
    return await sync_all_pending_attachments(db)
