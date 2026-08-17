import os
from datetime import datetime, timezone
from typing import Optional, Tuple, List, Dict, Any
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Attachment, SystemConfig, now_utc_iso
from app.services.google_sheets_service import get_service_account_info, get_config_value, set_config_value
from app.services.attachment_service import get_absolute_file_path
from app.schemas.attachment import DriveSyncTriggerResponse

DRIVE_SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
]

ROOT_FOLDER_NAME = "Wallet - Comprovantes"

async def get_drive_service(db: AsyncSession):
    """Inicializa o cliente autenticado da Google Drive API v3."""
    info, source = await get_service_account_info(db)
    if not info:
        raise FileNotFoundError(
            "Credenciais do Google Service Account não encontradas. Configure as credenciais na aba Sincronização."
        )
    
    creds = service_account.Credentials.from_service_account_info(info, scopes=DRIVE_SCOPES)
    return build("drive", "v3", credentials=creds)

def find_or_create_subfolder(service, folder_name: str, parent_id: Optional[str] = None) -> str:
    """Busca ou cria uma pasta no Google Drive."""
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    if parent_id:
        query += f" and '{parent_id}' in parents"

    results = service.files().list(
        q=query,
        spaces='drive',
        fields='files(id, name)'
    ).execute()
    
    files = results.get('files', [])
    if files:
        return files[0]['id']

    # Se não existir, cria a pasta
    file_metadata = {
        'name': folder_name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    if parent_id:
        file_metadata['parents'] = [parent_id]

    folder = service.files().create(body=file_metadata, fields='id').execute()
    return folder.get('id')

async def get_or_create_drive_profile_folder(service, db: AsyncSession, profile: str) -> Tuple[str, str]:
    """
    Retorna (profile_folder_id, root_folder_id).
    Se o usuário configurou um ID de pasta customizado em SystemConfig, utiliza como raiz.
    """
    custom_root_id = await get_config_value(db, "google_drive_folder_id")
    
    if custom_root_id and custom_root_id.strip():
        root_folder_id = custom_root_id.strip()
    else:
        root_folder_id = find_or_create_subfolder(service, ROOT_FOLDER_NAME)
        # Salva o ID da pasta raiz para consultas rápidas
        await set_config_value(db, "google_drive_root_folder_id", root_folder_id)

    # Cria subpasta para isolamento de perfil (PESSOAL / EMPRESA)
    subfolder_name = "PESSOAL" if profile == "PESSOAL" else "EMPRESA"
    profile_folder_id = find_or_create_subfolder(service, subfolder_name, parent_id=root_folder_id)

    return profile_folder_id, root_folder_id

def format_drive_error(e: Exception) -> str:
    err_str = str(e)
    if "Google Drive API has not been used in project" in err_str or "accessNotConfigured" in err_str or "has not been used in project" in err_str:
        import re
        match = re.search(r"https://console\.developers\.google\.com/apis/api/drive\.googleapis\.com/overview\?project=\d+", err_str)
        link = match.group(0) if match else "https://console.cloud.google.com/apis/library/drive.googleapis.com"
        return f"A Google Drive API não está ativada no seu projeto do Google Cloud. Ative acessando: {link}"
    elif "storage quota" in err_str.lower():
        return "Espaço de armazenamento esgotado na conta Google Drive."
    elif "insufficient permissions" in err_str.lower() or "403" in err_str:
        return f"Permissão negada no Google Drive: {err_str}"
    return f"Erro no backup para Google Drive: {err_str}"

async def upload_attachment_to_drive(db: AsyncSession, attachment_id: str) -> Optional[Attachment]:
    """Realiza o backup de um anexo individual para o Google Drive."""
    att = await db.get(Attachment, attachment_id)
    if not att:
        return None

    abs_path = get_absolute_file_path(att)
    if not os.path.exists(abs_path):
        att.sync_status = "ERRO"
        att.sync_error = f"Arquivo não encontrado no disco local: {abs_path}"
        await db.commit()
        return att

    try:
        service = await get_drive_service(db)
        profile_folder_id, _ = await get_or_create_drive_profile_folder(service, db, att.profile)

        # Prepara metadados do arquivo
        file_metadata = {
            'name': att.file_name,
            'parents': [profile_folder_id],
            'description': f"Wallet - Comprovante financeiro ({att.profile})"
        }

        media = MediaFileUpload(
            abs_path,
            mimetype=att.mime_type or "application/octet-stream",
            resumable=True
        )

        drive_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink, webContentLink'
        ).execute()

        att.drive_file_id = drive_file.get('id')
        att.drive_web_view_link = drive_file.get('webViewLink')
        att.drive_folder_id = profile_folder_id
        att.sync_status = "SINCRONIZADO"
        att.sync_error = None
        att.synced_at = now_utc_iso()

        await db.commit()
        await db.refresh(att)
        return att

    except Exception as e:
        att.sync_status = "ERRO"
        att.sync_error = format_drive_error(e)
        await db.commit()
        print(f"Erro no backup do anexo {att.id} para Google Drive: {att.sync_error}")
        return att

async def sync_all_pending_attachments(db: AsyncSession) -> DriveSyncTriggerResponse:
    """Executa o backup em lote de todos os anexos com status PENDENTE ou ERRO."""
    pending = (await db.execute(
        select(Attachment).where(Attachment.sync_status.in_(["PENDENTE", "ERRO"]))
    )).scalars().all()

    if not pending:
        return DriveSyncTriggerResponse(
            success=True,
            message="Todos os comprovantes já estão sincronizados com o Google Drive.",
            total_processed=0,
            synced_count=0,
            failed_count=0
        )

    synced_count = 0
    failed_count = 0
    errors: List[str] = []

    for att in pending:
        res = await upload_attachment_to_drive(db, att.id)
        if res and res.sync_status == "SINCRONIZADO":
            synced_count += 1
        else:
            failed_count += 1
            if res and res.sync_error:
                errors.append(f"{att.file_name}: {res.sync_error}")

    success = failed_count == 0
    if success:
        msg = f"Sincronização concluída com sucesso: {synced_count} comprovante(s) salvos no Google Drive."
    elif synced_count > 0:
        msg = f"Sincronização parcial: {synced_count} enviado(s), {failed_count} falharam. {errors[0] if errors else ''}"
    else:
        msg = f"Falha na sincronização do Google Drive ({failed_count} falharam). {errors[0] if errors else ''}"

    return DriveSyncTriggerResponse(
        success=success,
        message=msg,
        total_processed=len(pending),
        synced_count=synced_count,
        failed_count=failed_count,
        errors=errors
    )

async def delete_attachment_from_drive(db: AsyncSession, drive_file_id: Optional[str]):
    """Remove o arquivo do Google Drive se existir."""
    if not drive_file_id:
        return
    try:
        service = await get_drive_service(db)
        service.files().delete(fileId=drive_file_id).execute()
    except Exception as e:
        print(f"Aviso ao remover arquivo {drive_file_id} do Google Drive: {e}")
