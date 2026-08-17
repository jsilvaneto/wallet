import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models import User, SyncLog
from app.schemas.sync import (
    SyncConfigResponse,
    SyncConfigUpdate,
    SyncTestResponse,
    SyncTriggerRequest,
    SyncResultResponse,
    SyncLogResponse,
    SyncStatusResponse,
)
from app.services.google_sheets_service import (
    get_config_value,
    set_config_value,
    get_effective_spreadsheet_id,
    get_service_account_info,
    get_sheets_service,
    ensure_all_sheets_exist,
    test_connection,
    process_mobile_queue,
    export_sqlite_to_sheets,
    record_sync_log,
    check_sync_pending_status,
)
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/sync", tags=["Sincronização Nuvem"])

@router.get("/status", response_model=SyncStatusResponse)
async def get_sync_pending_status(
    check_remote: bool = Query(True, description="Consultar Google Sheets para verificar a Fila_Mobile"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Retorna o status em tempo real de alterações pendentes para enviar e receber."""
    return await check_sync_pending_status(db, check_remote=check_remote)

@router.get("/config", response_model=SyncConfigResponse)
async def get_sync_configuration(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    spreadsheet_id = await get_effective_spreadsheet_id(db)
    info, source = await get_service_account_info(db)
    
    has_credentials = info is not None
    service_account_email = info.get("client_email") if info else None
    spreadsheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit" if spreadsheet_id else None

    # Busca o último log
    last_log_query = select(SyncLog).order_by(SyncLog.created_at.desc()).limit(1)
    last_log_res = await db.execute(last_log_query)
    last_log = last_log_res.scalar_one_or_none()

    return SyncConfigResponse(
        spreadsheet_id=spreadsheet_id,
        spreadsheet_url=spreadsheet_url,
        has_credentials=has_credentials,
        service_account_email=service_account_email,
        last_sync_at=last_log.created_at if last_log else None,
        last_sync_status=last_log.status if last_log else None,
        last_action=last_log.action if last_log else None,
    )

@router.post("/config", response_model=SyncConfigResponse)
async def update_sync_configuration(
    payload: SyncConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    if payload.spreadsheet_id is not None:
        clean_id = payload.spreadsheet_id.strip()
        # Se o usuário colou a URL inteira da planilha, extrai apenas o ID
        if "docs.google.com/spreadsheets/d/" in clean_id:
            try:
                parts = clean_id.split("/d/")[1]
                clean_id = parts.split("/")[0]
            except Exception:
                pass
        await set_config_value(db, "google_spreadsheet_id", clean_id)

    if payload.credentials_json is not None:
        raw_json = payload.credentials_json.strip()
        if raw_json:
            try:
                parsed = json.loads(raw_json)
                if not isinstance(parsed, dict) or "client_email" not in parsed or "private_key" not in parsed:
                    raise ValueError("JSON não parece ser uma credencial de Service Account válida do Google Cloud.")
                await set_config_value(db, "google_credentials_json", raw_json)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Formato JSON de credenciais inválido: {str(e)}"
                )
        else:
            await set_config_value(db, "google_credentials_json", None)

    return await get_sync_configuration(db, _)

@router.post("/test", response_model=SyncTestResponse)
async def test_sync_connection(
    payload: Optional[SyncTriggerRequest] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    spreadsheet_id = payload.spreadsheet_id if payload and payload.spreadsheet_id else None
    try:
        res = await test_connection(db, spreadsheet_id)
        return SyncTestResponse(**res)
    except Exception as e:
        error_msg = str(e)
        await record_sync_log(
            db,
            action="TEST",
            status="ERRO",
            message=f"Falha ao conectar com o Google Sheets: {error_msg}",
            details=f"Erro detalhado: {error_msg}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Falha na conexão: {error_msg}"
        )

@router.post("/export", response_model=SyncResultResponse)
async def export_data_to_sheets(
    payload: Optional[SyncTriggerRequest] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    target_id = await get_effective_spreadsheet_id(db, payload.spreadsheet_id if payload else None)
    if not target_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID da Planilha não configurado. Defina o ID na aba Sincronização Nuvem."
        )

    try:
        service = await get_sheets_service(db)
        ensure_all_sheets_exist(service, target_id)

        exported_count, entity_counts = await export_sqlite_to_sheets(db, service, target_id)

        details_payload = {
            "entity_counts": entity_counts,
            "spreadsheet_id": target_id
        }

        msg = (
            f"Exportação completa realizada: {exported_count} registros enviados "
            f"({entity_counts.get('transacoes', 0)} transações, {entity_counts.get('categorias', 0)} categorias, "
            f"{entity_counts.get('itens', 0)} itens, {entity_counts.get('contas', 0)} contas, "
            f"{entity_counts.get('contatos', 0)} contatos, {entity_counts.get('dividas', 0)} dívidas, "
            f"{entity_counts.get('orcamentos', 0)} orçamentos)."
        )

        await record_sync_log(
            db,
            action="EXPORT",
            status="SUCESSO",
            message=msg,
            exported=exported_count,
            details=json.dumps(details_payload, ensure_ascii=False)
        )

        return SyncResultResponse(
            success=True,
            message=msg,
            exported_to_mirror=exported_count,
            entity_counts=entity_counts
        )
    except Exception as e:
        error_msg = str(e)
        await record_sync_log(
            db,
            action="EXPORT",
            status="ERRO",
            message=f"Falha ao exportar dados para a planilha: {error_msg}",
            details=error_msg
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao exportar dados: {error_msg}"
        )

@router.post("/import", response_model=SyncResultResponse)
async def import_data_from_queue(
    payload: Optional[SyncTriggerRequest] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    target_id = await get_effective_spreadsheet_id(db, payload.spreadsheet_id if payload else None)
    if not target_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID da Planilha não configurado. Defina o ID na aba Sincronização Nuvem."
        )

    try:
        service = await get_sheets_service(db)
        ensure_all_sheets_exist(service, target_id)

        imported_count, errors = await process_mobile_queue(db, service, target_id)

        log_status = "SUCESSO" if not errors else "ERRO" if imported_count == 0 else "SUCESSO"
        msg = f"Importação da Fila concluída: {imported_count} itens recebidos e gravados no SQLite."
        if errors:
            msg += f" {len(errors)} avisos/erros encontrados."

        await record_sync_log(
            db,
            action="IMPORT",
            status=log_status,
            message=msg,
            imported=imported_count,
            details="\n".join(errors) if errors else None
        )

        return SyncResultResponse(
            success=True,
            message=msg,
            imported_from_queue=imported_count,
            errors=errors
        )
    except Exception as e:
        error_msg = str(e)
        await record_sync_log(
            db,
            action="IMPORT",
            status="ERRO",
            message=f"Falha ao importar dados da fila: {error_msg}",
            details=error_msg
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao importar dados: {error_msg}"
        )

@router.post("/full", response_model=SyncResultResponse)
async def trigger_full_sync(
    payload: Optional[SyncTriggerRequest] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    target_id = await get_effective_spreadsheet_id(db, payload.spreadsheet_id if payload else None)
    if not target_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID da Planilha não configurado. Defina o ID na aba Sincronização Nuvem."
        )

    try:
        service = await get_sheets_service(db)
        ensure_all_sheets_exist(service, target_id)

        # 1. Ingestão da Fila Mobile
        imported_count, errors = await process_mobile_queue(db, service, target_id)

        # 2. Exportação Consolidada de todas as entidades do SQLite -> Planilha
        exported_count, entity_counts = await export_sqlite_to_sheets(db, service, target_id)

        details_payload = {
            "imported_from_queue": imported_count,
            "entity_counts": entity_counts,
            "errors": errors
        }

        msg = (
            f"Sincronização completa realizada: {imported_count} recebidos da fila, {exported_count} enviados "
            f"({entity_counts.get('transacoes', 0)} transações, {entity_counts.get('categorias', 0)} categorias, "
            f"{entity_counts.get('itens', 0)} itens, {entity_counts.get('contas', 0)} contas, "
            f"{entity_counts.get('contatos', 0)} contatos, {entity_counts.get('dividas', 0)} dívidas, "
            f"{entity_counts.get('orcamentos', 0)} orçamentos)."
        )

        await record_sync_log(
            db,
            action="FULL",
            status="SUCESSO",
            message=msg,
            imported=imported_count,
            exported=exported_count,
            details=json.dumps(details_payload, ensure_ascii=False)
        )

        return SyncResultResponse(
            success=True,
            message=msg,
            imported_from_queue=imported_count,
            exported_to_mirror=exported_count,
            entity_counts=entity_counts,
            errors=errors
        )
    except Exception as e:
        error_msg = str(e)
        await record_sync_log(
            db,
            action="FULL",
            status="ERRO",
            message=f"Falha na sincronização completa: {error_msg}",
            details=error_msg
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na sincronização completa: {error_msg}"
        )

@router.get("/logs", response_model=List[SyncLogResponse])
async def list_sync_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(SyncLog).order_by(SyncLog.created_at.desc()).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()

@router.delete("/logs", status_code=status.HTTP_204_NO_CONTENT)
async def clear_sync_logs(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    await db.execute(delete(SyncLog))
    await db.commit()
