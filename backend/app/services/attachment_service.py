import os
import re
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import Attachment, Transaction, generate_uuid, now_utc_iso
from app.schemas.attachment import AttachmentResponse, AttachmentStatsResponse

# Diretório base de armazenamento local
BASE_ATTACHMENT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "attachments")
)

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 # 15 MB

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "image/heic": ".heic",
    "image/heif": ".heif",
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".heic", ".heif"}

def format_bytes(size_bytes: int) -> str:
    """Formata bytes para exibição humana (KB, MB, etc)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def sanitize_filename(name: str) -> str:
    """Sanitiza o nome do arquivo para segurança no sistema de arquivos."""
    clean = re.sub(r'[^a-zA-Z0-9_\.\-]', '_', name)
    return clean[:100]

def enrich_attachment_schema(att: Attachment) -> AttachmentResponse:
    """Enriquece o schema de resposta com URLs úteis e tamanho formatado."""
    resp = AttachmentResponse.model_validate(att)
    resp.download_url = f"/api/v1/attachments/{att.id}/download"
    resp.file_url = f"/api/v1/attachments/{att.id}/file"
    resp.formatted_size = format_bytes(att.file_size_bytes)
    return resp

async def save_uploaded_attachment(
    db: AsyncSession,
    upload_file: UploadFile,
    profile: str,
    transaction_id: Optional[str] = None
) -> Attachment:
    """
    Valida e salva o arquivo fisicamente no disco local de forma assíncrona,
    persistindo os metadados na tabela attachments do SQLite.
    """
    if profile not in ("PESSOAL", "EMPRESA"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Perfil inválido. Deve ser 'PESSOAL' ou 'EMPRESA'."
        )

    orig_name = upload_file.filename or "comprovante.jpg"
    _, ext = os.path.splitext(orig_name.lower())
    
    mime = upload_file.content_type or "application/octet-stream"
    if ext not in ALLOWED_EXTENSIONS and mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de arquivo não suportado ({ext}). Envie imagens (JPG, PNG, WEBP) ou PDFs."
        )

    # Lê o conteúdo do arquivo em chunks para validar tamanho
    contents = await upload_file.read()
    file_size = len(contents)

    if file_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo enviado está vazio."
        )

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"O arquivo excede o limite máximo permitido de {format_bytes(MAX_FILE_SIZE_BYTES)}."
        )

    # Valida se a transação existe (se fornecida)
    if transaction_id:
        trans = await db.get(Transaction, transaction_id)
        if not trans:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lançamento com ID {transaction_id} não foi encontrado."
            )
        if trans.profile != profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O perfil do anexo não coincide com o perfil do lançamento."
            )

    attachment_id = generate_uuid()
    clean_name = sanitize_filename(orig_name)
    now = datetime.now(timezone.utc)
    year_str = now.strftime("%Y")
    month_str = now.strftime("%m")

    # Diretório estruturado: data/attachments/{profile}/{YYYY}/{MM}/
    folder_path = os.path.join(BASE_ATTACHMENT_DIR, profile.lower(), year_str, month_str)
    os.makedirs(folder_path, exist_ok=True)

    disk_filename = f"{attachment_id}_{clean_name}"
    abs_file_path = os.path.join(folder_path, disk_filename)

    # Salva arquivo no disco local
    with open(abs_file_path, "wb") as f:
        f.write(contents)

    # Caminho relativo para portabilidade
    rel_file_path = os.path.relpath(abs_file_path, BASE_ATTACHMENT_DIR)

    attachment = Attachment(
        id=attachment_id,
        profile=profile,
        transaction_id=transaction_id,
        file_name=orig_name,
        file_path=rel_file_path,
        file_size_bytes=file_size,
        mime_type=mime,
        sync_status="PENDENTE",
        created_at=now.isoformat()
    )

    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    return attachment

def get_absolute_file_path(attachment: Attachment) -> str:
    """Retorna o caminho absoluto do arquivo no disco."""
    if os.path.isabs(attachment.file_path):
        return attachment.file_path
    return os.path.join(BASE_ATTACHMENT_DIR, attachment.file_path)

async def delete_attachment(db: AsyncSession, attachment_id: str) -> bool:
    """Remove o anexo do banco e apaga o arquivo físico do disco."""
    att = await db.get(Attachment, attachment_id)
    if not att:
        return False

    abs_path = get_absolute_file_path(att)
    if os.path.exists(abs_path):
        try:
            os.remove(abs_path)
        except Exception as e:
            print(f"Aviso ao remover arquivo local {abs_path}: {e}")

    await db.delete(att)
    await db.commit()
    return True

async def get_storage_stats(db: AsyncSession, profile: Optional[str] = None) -> AttachmentStatsResponse:
    """Calcula estatísticas de armazenamento e status de sincronização."""
    query = select(
        func.count(Attachment.id),
        func.coalesce(func.sum(Attachment.file_size_bytes), 0)
    )
    if profile:
        query = query.where(Attachment.profile == profile)

    total_count, total_size = (await db.execute(query)).one()

    # Contagem por status de sincronização
    status_query = select(Attachment.sync_status, func.count(Attachment.id))
    if profile:
        status_query = status_query.where(Attachment.profile == profile)
    status_query = status_query.group_by(Attachment.sync_status)
    
    status_counts = dict((await db.execute(status_query)).all())

    synced_count = status_counts.get("SINCRONIZADO", 0)
    pending_count = status_counts.get("PENDENTE", 0)
    error_count = status_counts.get("ERRO", 0)

    return AttachmentStatsResponse(
        total_count=total_count or 0,
        total_size_bytes=int(total_size or 0),
        formatted_total_size=format_bytes(int(total_size or 0)),
        synced_count=synced_count,
        pending_count=pending_count,
        error_count=error_count,
    )
