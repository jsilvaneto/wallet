from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, update
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.database import get_db
from app.models import Transaction, Debt, User, Attachment
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.services.attachment_service import enrich_attachment_schema
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transações e Fluxo"])

def enrich_transaction_response(trans: Transaction) -> TransactionResponse:
    """Serializa a transação incluindo lista de comprovantes e contador."""
    attachments_list = []
    if trans.attachments:
        attachments_list = [enrich_attachment_schema(att) for att in trans.attachments]
    
    resp = TransactionResponse.model_validate(trans)
    resp.attachments = attachments_list
    resp.attachments_count = len(attachments_list)
    return resp

@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    profile: Optional[str] = Query(None, description="Filtrar por PESSOAL ou EMPRESA"),
    type: Optional[str] = Query(None, description="RECEITA ou DESPESA"),
    status_filter: Optional[str] = Query(None, alias="status", description="PENDENTE, CONCLUIDO, CANCELADO"),
    start_due_date: Optional[str] = Query(None, description="Vencimento inicial (YYYY-MM-DD)"),
    end_due_date: Optional[str] = Query(None, description="Vencimento final (YYYY-MM-DD)"),
    category_id: Optional[str] = Query(None, description="Filtrar por Categoria"),
    account_id: Optional[str] = Query(None, description="Filtrar por Conta Bancária / Carteira"),
    payment_method_id: Optional[str] = Query(None, description="Filtrar por Forma de Pagamento"),
    contact_id: Optional[str] = Query(None, description="Filtrar por Contato / Favorecido"),
    debt_id: Optional[str] = Query(None, description="Filtrar por Dívida vinculada"),
    search: Optional[str] = Query(None, description="Busca textual na descrição ou observações"),
    is_overdue: Optional[bool] = Query(None, description="Filtrar apenas contas em atraso (vencidas e não pagas)"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Transaction).options(selectinload(Transaction.attachments))
    if isinstance(profile, str) and profile:
        query = query.where(Transaction.profile == profile)
    if isinstance(type, str) and type:
        query = query.where(Transaction.type == type)
    if isinstance(status_filter, str) and status_filter:
        query = query.where(Transaction.status == status_filter)
    if is_overdue is True:
        today_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query = query.where(Transaction.status == "PENDENTE", Transaction.due_date < today_iso)
    if isinstance(start_due_date, str) and start_due_date:
        query = query.where(Transaction.due_date >= start_due_date)
    if isinstance(end_due_date, str) and end_due_date:
        query = query.where(Transaction.due_date <= end_due_date)
    if isinstance(category_id, str) and category_id:
        query = query.where(Transaction.category_id == category_id)
    if isinstance(account_id, str) and account_id:
        query = query.where(Transaction.account_id == account_id)
    if isinstance(payment_method_id, str) and payment_method_id:
        query = query.where(Transaction.payment_method_id == payment_method_id)
    if isinstance(contact_id, str) and contact_id:
        query = query.where(Transaction.contact_id == contact_id)
    if isinstance(debt_id, str) and debt_id:
        query = query.where(Transaction.debt_id == debt_id)
    if isinstance(search, str) and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(Transaction.description.ilike(term), Transaction.notes.ilike(term)))
        
    query = query.order_by(Transaction.due_date.asc(), Transaction.created_at.asc())
    result = await db.execute(query)
    transactions = result.scalars().all()
    return [enrich_transaction_response(t) for t in transactions]

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    trans_in: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    trans_data = trans_in.model_dump()
    attachment_ids = trans_data.pop("attachment_ids", None)

    new_trans = Transaction(**trans_data)
    db.add(new_trans)
    
    # Se já for criada como CONCLUIDO e vinculada a uma dívida, abate o saldo
    if new_trans.status == "CONCLUIDO" and new_trans.debt_id:
        debt_query = select(Debt).where(Debt.id == new_trans.debt_id)
        debt_res = await db.execute(debt_query)
        debt = debt_res.scalar_one_or_none()
        if debt:
            debt.remaining_amount_cents = max(0, debt.remaining_amount_cents - new_trans.amount_cents)
            if debt.remaining_amount_cents == 0:
                debt.status = "QUITADA"

    await db.commit()
    await db.refresh(new_trans)

    # Vincula comprovantes pré-carregados se informados
    if attachment_ids:
        await db.execute(
            update(Attachment)
            .where(Attachment.id.in_(attachment_ids))
            .values(transaction_id=new_trans.id)
        )
        await db.commit()

    # Recarrega com relacionamentos
    query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == new_trans.id)
    reloaded = (await db.execute(query)).scalar_one()
    return enrich_transaction_response(reloaded)

@router.get("/{trans_id}", response_model=TransactionResponse)
async def get_transaction(
    trans_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == trans_id)
    trans = (await db.execute(query)).scalar_one_or_none()
    if not trans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    return enrich_transaction_response(trans)

@router.patch("/{trans_id}/complete", response_model=TransactionResponse)
async def complete_transaction(
    trans_id: str,
    payment_date: Optional[str] = Query(default=None, description="Data de pagamento (YYYY-MM-DD), padrão hoje"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Marca uma transação pendente como CONCLUIDA e abate dívidas vinculadas."""
    query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == trans_id)
    result = await db.execute(query)
    trans = result.scalar_one_or_none()
    if not trans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    
    clean_payment_date = payment_date if isinstance(payment_date, str) and payment_date.strip() else None

    if trans.status != "CONCLUIDO":
        trans.status = "CONCLUIDO"
        trans.payment_date = clean_payment_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        trans.sync_status = "PENDENTE"
        trans.updated_at = datetime.now(timezone.utc).isoformat()
        
        # Abatimento em dívida
        if trans.debt_id:
            debt_query = select(Debt).where(Debt.id == trans.debt_id)
            debt_res = await db.execute(debt_query)
            debt = debt_res.scalar_one_or_none()
            if debt:
                debt.remaining_amount_cents = max(0, debt.remaining_amount_cents - trans.amount_cents)
                if debt.remaining_amount_cents == 0:
                    debt.status = "QUITADA"
                    
        await db.commit()
        
    reload_query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == trans.id)
    reloaded = (await db.execute(reload_query)).scalar_one()
    return enrich_transaction_response(reloaded)

@router.patch("/{trans_id}/uncomplete", response_model=TransactionResponse)
async def uncomplete_transaction(
    trans_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Desmarca uma transação liquidada, retornando para PENDENTE e restaurando saldos de dívida se houver."""
    query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == trans_id)
    result = await db.execute(query)
    trans = result.scalar_one_or_none()
    if not trans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    
    if trans.status == "CONCLUIDO":
        trans.status = "PENDENTE"
        trans.payment_date = None
        trans.sync_status = "PENDENTE"
        trans.updated_at = datetime.now(timezone.utc).isoformat()
        
        # Restaura saldo de dívida
        if trans.debt_id:
            debt_query = select(Debt).where(Debt.id == trans.debt_id)
            debt_res = await db.execute(debt_query)
            debt = debt_res.scalar_one_or_none()
            if debt:
                debt.remaining_amount_cents = min(debt.total_amount_cents, debt.remaining_amount_cents + trans.amount_cents)
                if debt.status == "QUITADA" and debt.remaining_amount_cents > 0:
                    debt.status = "ATIVA"
                    
        await db.commit()
        
    reload_query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == trans.id)
    reloaded = (await db.execute(reload_query)).scalar_one()
    return enrich_transaction_response(reloaded)

@router.patch("/{trans_id}/toggle-status", response_model=TransactionResponse)
async def toggle_transaction_status(
    trans_id: str,
    payment_date: Optional[str] = Query(default=None, description="Data de pagamento (YYYY-MM-DD), padrão hoje"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Alterna o status da transação entre CONCLUIDO e PENDENTE."""
    query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == trans_id)
    result = await db.execute(query)
    trans = result.scalar_one_or_none()
    if not trans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    
    clean_payment_date = payment_date if isinstance(payment_date, str) and payment_date.strip() else None

    if trans.status == "CONCLUIDO":
        return await uncomplete_transaction(trans_id=trans_id, db=db, _=_)
    else:
        return await complete_transaction(trans_id=trans_id, payment_date=clean_payment_date, db=db, _=_)

@router.put("/{trans_id}", response_model=TransactionResponse)
async def update_transaction(
    trans_id: str,
    trans_in: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == trans_id)
    result = await db.execute(query)
    trans = result.scalar_one_or_none()
    if not trans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    
    update_data = trans_in.model_dump(exclude_unset=True)
    attachment_ids = update_data.pop("attachment_ids", None)

    old_status = trans.status
    for field, value in update_data.items():
        setattr(trans, field, value)
    
    # Se alterou para CONCLUIDO e não tinha data de quitação, define hoje
    if trans.status == "CONCLUIDO" and not trans.payment_date:
        trans.payment_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    elif trans.status == "PENDENTE" and "payment_date" not in update_data:
        trans.payment_date = None

    # Abatimento em dívida se acabou de ser marcada como CONCLUIDO
    if old_status != "CONCLUIDO" and trans.status == "CONCLUIDO" and trans.debt_id:
        debt_query = select(Debt).where(Debt.id == trans.debt_id)
        debt_res = await db.execute(debt_query)
        debt = debt_res.scalar_one_or_none()
        if debt:
            debt.remaining_amount_cents = max(0, debt.remaining_amount_cents - trans.amount_cents)
            if debt.remaining_amount_cents == 0:
                debt.status = "QUITADA"

    trans.sync_status = "PENDENTE"
    trans.updated_at = datetime.now(timezone.utc).isoformat()

    # Vincula novos anexos adicionados durante a edição
    if attachment_ids:
        await db.execute(
            update(Attachment)
            .where(Attachment.id.in_(attachment_ids))
            .values(transaction_id=trans.id)
        )

    await db.commit()
    
    # Recarrega com anexos atualizados
    reload_query = select(Transaction).options(selectinload(Transaction.attachments)).where(Transaction.id == trans.id)
    reloaded = (await db.execute(reload_query)).scalar_one()
    return enrich_transaction_response(reloaded)

@router.delete("/{trans_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    trans_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Transaction).where(Transaction.id == trans_id)
    result = await db.execute(query)
    trans = result.scalar_one_or_none()
    if not trans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    await db.delete(trans)
    await db.commit()
