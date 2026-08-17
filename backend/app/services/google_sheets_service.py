import os
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import aliased

from app.core.config import settings
from app.models import (
    Transaction, Category, Item, Contact, Account, 
    Debt, Budget, SystemConfig, SyncLog, Attachment
)
from app.schemas.sync import SyncStatusResponse, SyncPendingDetails

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# Definição dos Cabeçalhos das 8 Abas da Planilha
HEADER_TRANSACOES = [
    "ID", "Perfil", "Tipo", "Descricao", "Valor_R$", "Valor_Centavos", "Categoria", 
    "Categoria_ID", "Item", "Item_ID", "Contato", "Contato_ID", "Conta", "Conta_ID", 
    "Divida_ID", "Vencimento", "Pagamento", "Status", "Sync_Status", "Notas", "Criado_Em", "Atualizado_Em"
]

HEADER_CATEGORIAS = [
    "ID", "Perfil", "Tipo", "Nome", "Natureza", "Criado_Em"
]

HEADER_ITENS = [
    "ID", "Perfil", "Categoria_ID", "Categoria_Nome", "Nome", 
    "Valor_Padrao_R$", "Valor_Padrao_Centavos", "Criado_Em"
]

HEADER_CONTAS = [
    "ID", "Perfil", "Nome", "Tipo", "Criado_Em"
]

HEADER_CONTATOS = [
    "ID", "Perfil", "Nome", "Tipo", "Documento_CPF_CNPJ", "Notas", "Criado_Em"
]

HEADER_DIVIDAS = [
    "ID", "Perfil", "Titulo", "Valor_Total_R$", "Valor_Total_Centavos", "Valor_Restante_R$", 
    "Valor_Restante_Centavos", "Credor_Contato", "Contato_ID", "Vencimento_Final", "Status", "Criado_Em"
]

HEADER_ORCAMENTOS = [
    "ID", "Perfil", "Categoria_ID", "Categoria_Nome", "Mes", "Ano", "Limite_R$", "Limite_Centavos", "Criado_Em"
]

HEADER_FILA_MOBILE = [
    "ID_Temporario", "Perfil", "Tipo", "Descricao", "Valor_Centavos", "Categoria_Nome", 
    "Item_Nome", "Contato_Nome", "Conta_Nome", "Data_Vencimento", "Data_Pagamento", "Status", "Notas", "Status_Fila", "Criado_Em"
]

ALL_SHEETS_HEADERS: Dict[str, List[str]] = {
    "Transacoes": HEADER_TRANSACOES,
    "Categorias": HEADER_CATEGORIAS,
    "Itens": HEADER_ITENS,
    "Contas": HEADER_CONTAS,
    "Contatos": HEADER_CONTATOS,
    "Dividas": HEADER_DIVIDAS,
    "Orcamentos": HEADER_ORCAMENTOS,
    "Fila_Mobile": HEADER_FILA_MOBILE,
}

async def get_config_value(db: AsyncSession, key: str) -> Optional[str]:
    """Busca uma configuração do sistema no banco de dados."""
    res = await db.get(SystemConfig, key)
    if res and res.value:
        return res.value
    return None

async def set_config_value(db: AsyncSession, key: str, value: Optional[str]):
    """Define ou atualiza uma configuração do sistema no banco de dados."""
    config = await db.get(SystemConfig, key)
    if config:
        config.value = value
        config.updated_at = datetime.now(timezone.utc).isoformat()
    else:
        config = SystemConfig(key=key, value=value)
        db.add(config)
    await db.commit()

async def get_effective_spreadsheet_id(db: AsyncSession, override_id: Optional[str] = None) -> Optional[str]:
    """Retorna o ID da planilha configurado (via override, banco ou .env)."""
    if override_id and override_id.strip():
        return override_id.strip()
    
    db_id = await get_config_value(db, "google_spreadsheet_id")
    if db_id and db_id.strip():
        return db_id.strip()
        
    if settings.GOOGLE_SPREADSHEET_ID and settings.GOOGLE_SPREADSHEET_ID.strip() and settings.GOOGLE_SPREADSHEET_ID != "COLE_O_ID_DA_SUA_PLANILHA_AQUI":
        return settings.GOOGLE_SPREADSHEET_ID.strip()
        
    return None

async def get_service_account_info(db: AsyncSession) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Retorna o dicionário de credenciais da conta de serviço e a fonte ('database' ou 'file')."""
    # 1. Verifica no banco de dados
    db_creds_json = await get_config_value(db, "google_credentials_json")
    if db_creds_json and db_creds_json.strip():
        try:
            info = json.loads(db_creds_json)
            return info, "database"
        except Exception:
            pass

    # 2. Verifica no arquivo local
    if os.path.exists(settings.GOOGLE_SERVICE_ACCOUNT_FILE):
        try:
            with open(settings.GOOGLE_SERVICE_ACCOUNT_FILE, "r", encoding="utf-8") as f:
                info = json.load(f)
                return info, "file"
        except Exception:
            pass

    return None, None

async def get_sheets_service(db: AsyncSession):
    """Inicializa o cliente autenticado da Google Sheets API buscando credenciais no banco ou arquivo."""
    info, source = await get_service_account_info(db)
    if not info:
        raise FileNotFoundError(
            "Credenciais do Google Service Account não foram encontradas. Faça o upload ou cole o JSON de credenciais na aba Sincronização Nuvem."
        )
    
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds)

async def record_sync_log(
    db: AsyncSession,
    action: str,
    status: str,
    message: str,
    imported: int = 0,
    exported: int = 0,
    details: Optional[str] = None
) -> SyncLog:
    """Registra uma operação de sincronização no banco de dados."""
    log = SyncLog(
        action=action,
        status=status,
        items_imported=imported,
        items_exported=exported,
        message=message,
        details=details
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

def ensure_all_sheets_exist(service, spreadsheet_id: str) -> List[str]:
    """Garante que todas as 8 abas necessárias existam na planilha e possuam cabeçalhos formatados."""
    sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    existing_sheets = [s["properties"]["title"] for s in sheet_metadata.get("sheets", [])]
    
    requests = []
    for sheet_name in ALL_SHEETS_HEADERS.keys():
        if sheet_name not in existing_sheets:
            requests.append({"addSheet": {"properties": {"title": sheet_name}}})
        
    if requests:
        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={"requests": requests}
        ).execute()

    # Inicializa cabeçalho da Fila_Mobile se a linha 1 estiver vazia
    res_fila = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range="Fila_Mobile!A1:O1"
    ).execute()
    
    if not res_fila.get("values"):
        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range="Fila_Mobile!A1:O1",
            valueInputOption="RAW",
            body={"values": [HEADER_FILA_MOBILE]}
        ).execute()

    # Recarrega metadados com as abas criadas
    sheet_metadata_after = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    return [s["properties"]["title"] for s in sheet_metadata_after.get("sheets", [])]

async def test_connection(db: AsyncSession, spreadsheet_id: Optional[str] = None) -> Dict[str, Any]:
    """Testa a conexão completa com a planilha do Google e valida permissões em todas as abas."""
    target_id = await get_effective_spreadsheet_id(db, spreadsheet_id)
    if not target_id:
        raise ValueError("ID da Planilha do Google não informado.")

    info, _ = await get_service_account_info(db)
    client_email = info.get("client_email") if info else None

    service = await get_sheets_service(db)
    sheet_metadata = service.spreadsheets().get(spreadsheetId=target_id).execute()
    title = sheet_metadata.get("properties", {}).get("title", "Planilha Google")
    
    # Garante existência de todas as 8 abas
    sheets_found = ensure_all_sheets_exist(service, target_id)

    details_payload = {
        "service_account": client_email,
        "spreadsheet_id": target_id,
        "sheets_configured": sheets_found
    }

    await record_sync_log(
        db,
        action="TEST",
        status="SUCESSO",
        message=f"Conexão com a planilha '{title}' testada com sucesso. {len(sheets_found)} abas configuradas.",
        details=json.dumps(details_payload, ensure_ascii=False)
    )

    return {
        "success": True,
        "spreadsheet_title": title,
        "sheets_found": sheets_found,
        "service_account_email": client_email,
        "message": f"Conexão bem sucedida com a planilha '{title}'! {len(sheets_found)} abas verificadas."
    }

async def process_mobile_queue(db: AsyncSession, service, spreadsheet_id: str) -> Tuple[int, List[str]]:
    """Lê registros da aba Fila_Mobile, valida, reconcilia categorias/itens/contas/contatos, insere no SQLite e limpa a fila."""
    imported_count = 0
    errors: List[str] = []

    res = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range="Fila_Mobile!A2:O"
    ).execute()
    rows = res.get("values", [])

    if not rows:
        return (0, [])

    for index, row in enumerate(rows, start=2):
        try:
            if len(row) < 5 or not row[0]:
                continue

            trans_id = row[0].strip()
            profile = row[1].strip().upper() if len(row) > 1 and row[1] else "PESSOAL"
            if profile not in ["PESSOAL", "EMPRESA"]:
                profile = "PESSOAL"

            trans_type = row[2].strip().upper() if len(row) > 2 and row[2] else "DESPESA"
            if trans_type not in ["RECEITA", "DESPESA"]:
                trans_type = "DESPESA"

            description = row[3].strip() if len(row) > 3 and row[3] else "Lançamento Mobile"
            
            # Valor em centavos
            amount_raw = row[4].strip()
            amount_cents = int(float(amount_raw.replace(",", "."))) if amount_raw else 0
            if amount_cents <= 0:
                errors.append(f"Linha {index}: Valor inválido ({amount_raw}). Lançamento ignorado.")
                continue

            cat_name = row[5].strip() if len(row) > 5 and row[5] else ("Outras Receitas" if trans_type == "RECEITA" else "Outras Despesas")
            item_name = row[6].strip() if len(row) > 6 and row[6] else None
            contact_name = row[7].strip() if len(row) > 7 and row[7] else None
            account_name = row[8].strip() if len(row) > 8 and row[8] else None
            due_date = row[9].strip() if len(row) > 9 and row[9] else datetime.now(timezone.utc).strftime("%Y-%m-%d")
            payment_date = row[10].strip() if len(row) > 10 and row[10] else None
            status_val = row[11].strip().upper() if len(row) > 11 and row[11] else "PENDENTE"
            notes = row[12].strip() if len(row) > 12 and row[12] else None

            # 1. Verifica duplicidade por ID
            existing_trans = await db.get(Transaction, trans_id)
            if existing_trans:
                continue

            # 2. Resolve ou cria categoria correspondente
            cat_query = select(Category).where(
                Category.profile == profile,
                Category.name == cat_name,
                Category.type == trans_type
            )
            cat_res = await db.execute(cat_query)
            category = cat_res.scalar_one_or_none()

            if not category:
                category = Category(
                    profile=profile,
                    type=trans_type,
                    nature="NENHUM",
                    name=cat_name
                )
                db.add(category)
                await db.flush()

            # 3. Resolve ou cria Item se informado
            item_id = None
            if item_name:
                item_query = select(Item).where(
                    Item.profile == profile,
                    Item.name == item_name,
                    Item.category_id == category.id
                )
                i_res = await db.execute(item_query)
                item = i_res.scalar_one_or_none()
                if not item:
                    item = Item(
                        profile=profile,
                        category_id=category.id,
                        name=item_name
                    )
                    db.add(item)
                    await db.flush()
                item_id = item.id

            # 4. Resolve ou cria Contato se informado
            contact_id = None
            if contact_name:
                contact_query = select(Contact).where(
                    Contact.profile == profile,
                    Contact.name == contact_name
                )
                c_res = await db.execute(contact_query)
                contact = c_res.scalar_one_or_none()
                if not contact:
                    contact = Contact(
                        profile=profile,
                        name=contact_name,
                        type="OUTRO"
                    )
                    db.add(contact)
                    await db.flush()
                contact_id = contact.id

            # 5. Resolve Conta se informada
            account_id = None
            if account_name:
                acc_query = select(Account).where(
                    Account.profile == profile,
                    Account.name == account_name
                )
                a_res = await db.execute(acc_query)
                account = a_res.scalar_one_or_none()
                if account:
                    account_id = account.id

            # 6. Grava transação no SQLite
            new_trans = Transaction(
                id=trans_id,
                profile=profile,
                type=trans_type,
                account_id=account_id,
                category_id=category.id,
                item_id=item_id,
                contact_id=contact_id,
                description=description,
                amount_cents=amount_cents,
                due_date=due_date,
                payment_date=payment_date,
                status=status_val if status_val in ["PENDENTE", "CONCLUIDO", "CANCELADO"] else "PENDENTE",
                sync_status="SINCRONIZADO",
                notes=notes
            )
            db.add(new_trans)
            imported_count += 1

        except Exception as e:
            errors.append(f"Erro na linha {index} da Fila_Mobile: {str(e)}")

    if imported_count > 0:
        await db.commit()
        # Limpa as linhas processadas da Fila_Mobile (mantendo a linha de cabeçalho A1:O1)
        service.spreadsheets().values().clear(
            spreadsheetId=spreadsheet_id,
            range="Fila_Mobile!A2:O"
        ).execute()

    return (imported_count, errors)

async def export_sqlite_to_sheets(db: AsyncSession, service, spreadsheet_id: str) -> Tuple[int, Dict[str, int]]:
    """
    Exporta todas as entidades mestras e operacionais do SQLite para as abas correspondentes na Planilha Google.
    Utiliza batchUpdate para máxima performance e integridade atômica.
    """
    # 1. Categorias
    cat_query = select(Category).order_by(Category.profile.asc(), Category.type.asc(), Category.name.asc())
    cat_records = (await db.execute(cat_query)).scalars().all()
    cat_values = [HEADER_CATEGORIAS]
    for cat in cat_records:
        cat_values.append([
            cat.id,
            cat.profile,
            cat.type,
            cat.name,
            cat.nature,
            cat.created_at
        ])

    # 2. Itens
    item_query = (
        select(
            Item,
            Category.name.label("cat_name")
        )
        .join(Category, Item.category_id == Category.id)
        .order_by(Item.profile.asc(), Category.name.asc(), Item.name.asc())
    )
    item_records = (await db.execute(item_query)).all()
    item_values = [HEADER_ITENS]
    for item, cat_name in item_records:
        item_values.append([
            item.id,
            item.profile,
            item.category_id,
            cat_name or "",
            item.name,
            round((item.default_amount_cents or 0) / 100.0, 2) if item.default_amount_cents else "",
            item.default_amount_cents or "",
            item.created_at
        ])

    # 3. Contas
    acc_query = select(Account).order_by(Account.profile.asc(), Account.name.asc())
    acc_records = (await db.execute(acc_query)).scalars().all()
    acc_values = [HEADER_CONTAS]
    for acc in acc_records:
        acc_values.append([
            acc.id,
            acc.profile,
            acc.name,
            acc.type,
            acc.created_at
        ])

    # 4. Contatos
    con_query = select(Contact).order_by(Contact.profile.asc(), Contact.name.asc())
    con_records = (await db.execute(con_query)).scalars().all()
    con_values = [HEADER_CONTATOS]
    for con in con_records:
        con_values.append([
            con.id,
            con.profile,
            con.name,
            con.type,
            con.document or "",
            con.notes or "",
            con.created_at
        ])

    # 5. Dívidas
    debt_query = (
        select(Debt, Contact.name.label("contact_name"))
        .outerjoin(Contact, Debt.contact_id == Contact.id)
        .order_by(Debt.profile.asc(), Debt.created_at.desc())
    )
    debt_records = (await db.execute(debt_query)).all()
    debt_values = [HEADER_DIVIDAS]
    for debt, contact_name in debt_records:
        debt_values.append([
            debt.id,
            debt.profile,
            debt.title,
            round(debt.total_amount_cents / 100.0, 2),
            debt.total_amount_cents,
            round(debt.remaining_amount_cents / 100.0, 2),
            debt.remaining_amount_cents,
            contact_name or "",
            debt.contact_id or "",
            debt.due_date or "",
            debt.status,
            debt.created_at
        ])

    # 6. Orçamentos
    bud_query = (
        select(Budget, Category.name.label("category_name"))
        .join(Category, Budget.category_id == Category.id)
        .order_by(Budget.year.desc(), Budget.month.desc(), Budget.profile.asc())
    )
    bud_records = (await db.execute(bud_query)).all()
    bud_values = [HEADER_ORCAMENTOS]
    for bud, category_name in bud_records:
        bud_values.append([
            bud.id,
            bud.profile,
            bud.category_id,
            category_name or "",
            bud.month,
            bud.year,
            round(bud.limit_amount_cents / 100.0, 2),
            bud.limit_amount_cents,
            bud.created_at
        ])

    # 7. Transações Consolidadas
    trans_query = (
        select(
            Transaction,
            Category.name.label("category_name"),
            Item.name.label("item_name"),
            Contact.name.label("contact_name"),
            Account.name.label("account_name")
        )
        .join(Category, Transaction.category_id == Category.id)
        .outerjoin(Item, Transaction.item_id == Item.id)
        .outerjoin(Contact, Transaction.contact_id == Contact.id)
        .outerjoin(Account, Transaction.account_id == Account.id)
        .order_by(Transaction.due_date.desc(), Transaction.created_at.desc())
    )
    trans_records = (await db.execute(trans_query)).all()
    trans_values = [HEADER_TRANSACOES]
    for trans, cat_name, item_name, contact_name, account_name in trans_records:
        trans_values.append([
            trans.id,
            trans.profile,
            trans.type,
            trans.description,
            round(trans.amount_cents / 100.0, 2),
            trans.amount_cents,
            cat_name or "",
            trans.category_id,
            item_name or "",
            trans.item_id or "",
            contact_name or "",
            trans.contact_id or "",
            account_name or "",
            trans.account_id or "",
            trans.debt_id or "",
            trans.due_date,
            trans.payment_date or "",
            trans.status,
            trans.sync_status,
            trans.notes or "",
            trans.created_at,
            trans.updated_at
        ])

    # Mapeamento consolidado das 7 abas para envio em lote
    all_export_data = {
        "Transacoes": trans_values,
        "Categorias": cat_values,
        "Itens": item_values,
        "Contas": acc_values,
        "Contatos": con_values,
        "Dividas": debt_values,
        "Orcamentos": bud_values,
    }

    # 1. Limpa todas as 7 abas
    service.spreadsheets().values().batchClear(
        spreadsheetId=spreadsheet_id,
        body={"ranges": [f"{sheet}!A:V" for sheet in all_export_data.keys()]}
    ).execute()

    # 2. Atualiza os dados em lote
    batch_update_payload = [
        {
            "range": f"{sheet}!A1",
            "values": values
        }
        for sheet, values in all_export_data.items()
    ]

    service.spreadsheets().values().batchUpdate(
        spreadsheetId=spreadsheet_id,
        body={
            "valueInputOption": "USER_ENTERED",
            "data": batch_update_payload
        }
    ).execute()

    # 3. Marca transações como SINCRONIZADO no banco local
    for trans, _, _, _, _ in trans_records:
        trans.sync_status = "SINCRONIZADO"
    await db.commit()

    entity_counts = {
        "transacoes": len(trans_records),
        "categorias": len(cat_records),
        "itens": len(item_records),
        "contas": len(acc_records),
        "contatos": len(con_records),
        "dividas": len(debt_records),
        "orcamentos": len(bud_records)
    }
    total_exported = sum(entity_counts.values())

    return (total_exported, entity_counts)


async def check_sync_pending_status(db: AsyncSession, check_remote: bool = True) -> SyncStatusResponse:
    """
    Calcula as pendências de envio (SQLite -> Planilha) e de recebimento (Fila_Mobile -> SQLite).
    Retorna métricas consolidadas e detalhadas para alimentar o indicador visual da interface.
    """
    spreadsheet_id = await get_effective_spreadsheet_id(db)
    info, source = await get_service_account_info(db)
    has_credentials = info is not None
    service_account_email = info.get("client_email") if info else None
    spreadsheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit" if spreadsheet_id else None
    is_configured = bool(has_credentials and spreadsheet_id)

    # 1. Busca último log geral de sync
    last_sync_query = select(SyncLog).order_by(SyncLog.created_at.desc()).limit(1)
    last_sync_res = await db.execute(last_sync_query)
    last_sync_log = last_sync_res.scalar_one_or_none()

    # 2. Busca último export bem sucedido
    last_export_query = select(SyncLog).where(
        SyncLog.action.in_(["EXPORT", "FULL"]),
        SyncLog.status == "SUCESSO"
    ).order_by(SyncLog.created_at.desc()).limit(1)
    last_export_res = await db.execute(last_export_query)
    last_export_log = last_export_res.scalar_one_or_none()
    last_export_time = last_export_log.created_at if last_export_log else None

    # 3. Transações pendentes de envio
    pending_trans_query = select(func.count(Transaction.id)).where(Transaction.sync_status == "PENDENTE")
    pending_trans_count = (await db.execute(pending_trans_query)).scalar() or 0

    # 4. Alterações em tabelas mestras e comprovantes
    if last_export_time:
        cat_cnt = (await db.execute(select(func.count(Category.id)).where(Category.created_at > last_export_time))).scalar() or 0
        item_cnt = (await db.execute(select(func.count(Item.id)).where(Item.created_at > last_export_time))).scalar() or 0
        acc_cnt = (await db.execute(select(func.count(Account.id)).where(Account.created_at > last_export_time))).scalar() or 0
        con_cnt = (await db.execute(select(func.count(Contact.id)).where(Contact.created_at > last_export_time))).scalar() or 0
        debt_cnt = (await db.execute(select(func.count(Debt.id)).where(Debt.created_at > last_export_time))).scalar() or 0
        bud_cnt = (await db.execute(select(func.count(Budget.id)).where(Budget.created_at > last_export_time))).scalar() or 0
    else:
        cat_cnt = (await db.execute(select(func.count(Category.id)))).scalar() or 0
        item_cnt = (await db.execute(select(func.count(Item.id)))).scalar() or 0
        acc_cnt = (await db.execute(select(func.count(Account.id)))).scalar() or 0
        con_cnt = (await db.execute(select(func.count(Contact.id)))).scalar() or 0
        debt_cnt = (await db.execute(select(func.count(Debt.id)))).scalar() or 0
        bud_cnt = (await db.execute(select(func.count(Budget.id)))).scalar() or 0

    # Comprovantes com backup pendente no Drive
    pending_att_cnt = (await db.execute(
        select(func.count(Attachment.id)).where(Attachment.sync_status.in_(["PENDENTE", "ERRO"]))
    )).scalar() or 0

    master_changes = cat_cnt + item_cnt + acc_cnt + con_cnt + debt_cnt + bud_cnt
    pending_send = pending_trans_count + master_changes + pending_att_cnt

    # 5. Pendências de Recebimento na Fila Mobile (Google Sheets)
    pending_receive = 0
    if is_configured and check_remote:
        try:
            service = await get_sheets_service(db)
            res = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range="Fila_Mobile!A2:E"
            ).execute()
            rows = res.get("values", [])
            # Conta linhas com dados válidos (não vazias)
            pending_receive = len([r for r in rows if any(str(c).strip() for c in r)])
        except Exception:
            # Fallback silencioso em caso de instabilidade na API do Google
            pending_receive = 0

    total_pending = pending_send + pending_receive
    has_pending = total_pending > 0

    return SyncStatusResponse(
        is_configured=is_configured,
        has_credentials=has_credentials,
        spreadsheet_id=spreadsheet_id,
        spreadsheet_url=spreadsheet_url,
        service_account_email=service_account_email,
        pending_send=pending_send,
        pending_receive=pending_receive,
        total_pending=total_pending,
        has_pending=has_pending,
        last_sync_at=last_sync_log.created_at if last_sync_log else None,
        last_sync_status=last_sync_log.status if last_sync_log else None,
        last_action=last_sync_log.action if last_sync_log else None,
        details=SyncPendingDetails(
            pending_transactions=pending_trans_count,
            pending_categories=cat_cnt,
            pending_items=item_cnt,
            pending_accounts=acc_cnt,
            pending_contacts=con_cnt,
            pending_debts=debt_cnt,
            pending_budgets=bud_cnt,
            pending_attachments=pending_att_cnt,
            queue_rows=pending_receive,
        )
    )

