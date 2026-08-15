from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Transaction, Debt, User
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transações e Fluxo"])

@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    profile: Optional[str] = Query(None, description="Filtrar por PESSOAL ou EMPRESA"),
    type: Optional[str] = Query(None, description="RECEITA ou DESPESA"),
    status_filter: Optional[str] = Query(None, alias="status", description="PENDENTE, CONCLUIDO, CANCELADO"),
    start_due_date: Optional[str] = Query(None, description="Vencimento inicial (YYYY-MM-DD)"),
    end_due_date: Optional[str] = Query(None, description="Vencimento final (YYYY-MM-DD)"),
    category_id: Optional[str] = None,
    contact_id: Optional[str] = None,
    debt_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Transaction)
    if profile:
        query = query.where(Transaction.profile == profile)
    if type:
        query = query.where(Transaction.type == type)
    if status_filter:
        query = query.where(Transaction.status == status_filter)
    if start_due_date:
        query = query.where(Transaction.due_date >= start_due_date)
    if end_due_date:
        query = query.where(Transaction.due_date <= end_due_date)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if contact_id:
        query = query.where(Transaction.contact_id == contact_id)
    if debt_id:
        query = query.where(Transaction.debt_id == debt_id)
        
    query = query.order_by(Transaction.due_date.asc(), Transaction.created_at.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    trans_in: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    new_trans = Transaction(**trans_in.model_dump())
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
    return new_trans

@router.patch("/{trans_id}/complete", response_model=TransactionResponse)
async def complete_transaction(
    trans_id: str,
    payment_date: Optional[str] = Query(None, description="Data de pagamento (YYYY-MM-DD), padrão hoje"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Marca uma transação pendente como CONCLUIDA e abate dívidas vinculadas."""
    query = select(Transaction).where(Transaction.id == trans_id)
    result = await db.execute(query)
    trans = result.scalar_one_or_none()
    if not trans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    
    if trans.status != "CONCLUIDO":
        trans.status = "CONCLUIDO"
        trans.payment_date = payment_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
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
        await db.refresh(trans)
        
    return trans

@router.put("/{trans_id}", response_model=TransactionResponse)
async def update_transaction(
    trans_id: str,
    trans_in: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Transaction).where(Transaction.id == trans_id)
    result = await db.execute(query)
    trans = result.scalar_one_or_none()
    if not trans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    
    update_data = trans_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trans, field, value)
    
    await db.commit()
    await db.refresh(trans)
    return trans

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
