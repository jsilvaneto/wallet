import os
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models import Transaction, Category, Item, Contact, Account, SystemConfig, SyncLog

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

HEADER_TRANSACOES = [
    "ID", "Perfil", "Tipo", "Descricao", "Valor_R$", "Categoria", 
    "Item", "Contato", "Conta", "Vencimento", "Pagamento", "Status", "Notas", "Atualizado_Em"
]

HEADER_FILA_MOBILE = [
    "ID", "Perfil", "Tipo", "Descricao", "Valor_Centavos", "Categoria", 
    "Item", "Contato", "Vencimento", "Pagamento", "Status", "Notas", "Criado_Em"
]

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

def ensure_sheets_exist(service, spreadsheet_id: str):
    """Garante que as abas 'Transacoes' e 'Fila_Mobile' existam com seus cabeçalhos."""
    sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    existing_sheets = [s["properties"]["title"] for s in sheet_metadata.get("sheets", [])]
    
    requests = []
    if "Transacoes" not in existing_sheets:
        requests.append({"addSheet": {"properties": {"title": "Transacoes"}}})
    if "Fila_Mobile" not in existing_sheets:
        requests.append({"addSheet": {"properties": {"title": "Fila_Mobile"}}})
        
    if requests:
        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={"requests": requests}
        ).execute()

    # Define cabeçalhos na aba Transacoes
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Transacoes!A1:N1",
        valueInputOption="RAW",
        body={"values": [HEADER_TRANSACOES]}
    ).execute()

    # Inicializa cabeçalho da Fila_Mobile se a linha 1 estiver vazia
    res_fila = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range="Fila_Mobile!A1:M1"
    ).execute()
    
    if not res_fila.get("values"):
        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range="Fila_Mobile!A1:M1",
            valueInputOption="RAW",
            body={"values": [HEADER_FILA_MOBILE]}
        ).execute()

async def test_connection(db: AsyncSession, spreadsheet_id: Optional[str] = None) -> Dict[str, Any]:
    """Testa a conexão completa com a planilha do Google e valida permissões."""
    target_id = await get_effective_spreadsheet_id(db, spreadsheet_id)
    if not target_id:
        raise ValueError("ID da Planilha do Google não informado.")

    info, _ = await get_service_account_info(db)
    client_email = info.get("client_email") if info else None

    service = await get_sheets_service(db)
    sheet_metadata = service.spreadsheets().get(spreadsheetId=target_id).execute()
    title = sheet_metadata.get("properties", {}).get("title", "Planilha Google")
    
    # Garante existência das abas
    ensure_sheets_exist(service, target_id)
    
    # Recarrega abas atualizadas
    sheet_metadata_after = service.spreadsheets().get(spreadsheetId=target_id).execute()
    sheets_found = [s["properties"]["title"] for s in sheet_metadata_after.get("sheets", [])]

    await record_sync_log(
        db,
        action="TEST",
        status="SUCESSO",
        message=f"Conexão com a planilha '{title}' testada com sucesso. Abas configuradas: {', '.join(sheets_found)}.",
        details=f"Service Account: {client_email} | Spreadsheet ID: {target_id}"
    )

    return {
        "success": True,
        "spreadsheet_title": title,
        "sheets_found": sheets_found,
        "service_account_email": client_email,
        "message": f"Conexão bem sucedida com a planilha '{title}'!"
    }

async def process_mobile_queue(db: AsyncSession, service, spreadsheet_id: str) -> Tuple[int, List[str]]:
    """Lê registros da aba Fila_Mobile, valida, insere no SQLite e limpa a fila."""
    imported_count = 0
    errors: List[str] = []

    res = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range="Fila_Mobile!A2:M"
    ).execute()
    rows = res.get("values", [])

    if not rows:
        return (0, [])

    for index, row in enumerate(rows, start=2):
        try:
            if len(row) < 5 or not row[0]:
                continue

            trans_id = row[0].strip()
            profile = row[1].strip().upper()
            trans_type = row[2].strip().upper()
            description = row[3].strip()
            amount_cents = int(row[4].strip())
            cat_name = row[5].strip() if len(row) > 5 and row[5] else "Outras Despesas"
            contact_name = row[7].strip() if len(row) > 7 and row[7] else None
            due_date = row[8].strip() if len(row) > 8 and row[8] else datetime.now(timezone.utc).strftime("%Y-%m-%d")
            payment_date = row[9].strip() if len(row) > 9 and row[9] else None
            status_val = row[10].strip().upper() if len(row) > 10 and row[10] else "PENDENTE"
            notes = row[11].strip() if len(row) > 11 else None

            # 1. Verifica duplicidade por UUID
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
                    name=cat_name
                )
                db.add(category)
                await db.flush()

            # 3. Resolve ou cria contato se informado
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

            # 4. Grava transação no SQLite
            new_trans = Transaction(
                id=trans_id,
                profile=profile,
                type=trans_type,
                category_id=category.id,
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
        # Limpa as linhas processadas da Fila_Mobile (mantendo a linha de cabeçalho A1:M1)
        service.spreadsheets().values().clear(
            spreadsheetId=spreadsheet_id,
            range="Fila_Mobile!A2:M"
        ).execute()

    return (imported_count, errors)

async def export_sqlite_to_sheets(db: AsyncSession, service, spreadsheet_id: str) -> int:
    """Exporta todas as transações consolidadas do SQLite para a aba Transacoes."""
    query = (
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
    result = await db.execute(query)
    records = result.all()

    values = [HEADER_TRANSACOES]
    for trans, cat_name, item_name, contact_name, account_name in records:
        values.append([
            trans.id,
            trans.profile,
            trans.type,
            trans.description,
            round(trans.amount_cents / 100.0, 2),
            cat_name or "",
            item_name or "",
            contact_name or "",
            account_name or "",
            trans.due_date,
            trans.payment_date or "",
            trans.status,
            trans.notes or "",
            trans.updated_at
        ])

    # Limpa a aba Transacoes e sobrescreve com os dados atualizados
    service.spreadsheets().values().clear(
        spreadsheetId=spreadsheet_id,
        range="Transacoes!A:N"
    ).execute()

    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Transacoes!A1",
        valueInputOption="USER_ENTERED",
        body={"values": values}
    ).execute()

    # Marca todas as transações como SINCRONIZADO
    for trans, _, _, _, _ in records:
        trans.sync_status = "SINCRONIZADO"
    await db.commit()

    return len(records)
