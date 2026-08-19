import calendar
from datetime import datetime, date, timedelta
from typing import Tuple, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, or_
from fastapi import HTTPException, status

from app.models import CreditCard, Transaction, Account, Category, Contact
from app.schemas.credit_card import (
    CreditCardInvoiceItem,
    CreditCardInvoiceSummary,
    CreditCardInvoiceDetail,
    CreditCardInvoiceSettleRequest,
    CreditCardInvoiceSettleResponse
)

def calculate_invoice_period_and_due_date(
    purchase_date: date,
    closing_day: int,
    due_day: int
) -> Tuple[int, int, str, str, str]:
    """
    Calcula:
    1. invoice_month (Mês de competência)
    2. invoice_year (Ano de competência)
    3. period_start (YYYY-MM-DD)
    4. period_end (YYYY-MM-DD) - Data de fechamento
    5. due_date (YYYY-MM-DD) - Data de vencimento da fatura
    """
    # 1. Se a compra ocorreu antes do dia de fechamento, cai no mês da compra.
    #    Se ocorreu a partir do dia de fechamento ("melhor dia"), cai no mês seguinte.
    if purchase_date.day < closing_day:
        inv_month = purchase_date.month
        inv_year = purchase_date.year
    else:
        inv_month = 1 if purchase_date.month == 12 else purchase_date.month + 1
        inv_year = purchase_date.year + 1 if purchase_date.month == 12 else purchase_date.year

    # 2. Data de fechamento (period_end)
    max_days_inv = calendar.monthrange(inv_year, inv_month)[1]
    clamped_closing = min(closing_day, max_days_inv)
    period_end_dt = date(inv_year, inv_month, clamped_closing)

    # 3. Data de início do ciclo (dia seguinte ao fechamento anterior)
    prev_m = 12 if inv_month == 1 else inv_month - 1
    prev_y = inv_year - 1 if inv_month == 1 else inv_year
    max_days_prev = calendar.monthrange(prev_y, prev_m)[1]
    prev_clamped_closing = min(closing_day, max_days_prev)
    period_start_dt = date(prev_y, prev_m, prev_clamped_closing) + timedelta(days=1)

    # 4. Data de vencimento da fatura (due_date)
    # Se o dia de vencimento for >= dia de fechamento, vence no mesmo mês do fechamento.
    # Se for < dia de fechamento (ex: fecha dia 25 e vence dia 05), vence no mês seguinte.
    if due_day >= closing_day:
        due_m = inv_month
        due_y = inv_year
    else:
        due_m = 1 if inv_month == 12 else inv_month + 1
        due_y = inv_year + 1 if inv_month == 12 else inv_year

    max_days_due = calendar.monthrange(due_y, due_m)[1]
    clamped_due = min(due_day, max_days_due)
    due_dt = date(due_y, due_m, clamped_due)

    return (
        inv_month,
        inv_year,
        period_start_dt.strftime("%Y-%m-%d"),
        period_end_dt.strftime("%Y-%m-%d"),
        due_dt.strftime("%Y-%m-%d")
    )


async def calculate_card_limits(
    db: AsyncSession,
    card: CreditCard
) -> Tuple[int, int, int]:
    """
    Retorna (used_limit_cents, available_limit_cents, current_invoice_cents)
    """
    today = date.today()
    cur_inv_m, cur_inv_y, _, _, _ = calculate_invoice_period_and_due_date(
        today, card.closing_day, card.due_day
    )

    # Limite Comprometido (Todas as despesas pendentes neste cartão, incluindo parcelas futuras)
    used_query = select(func.coalesce(func.sum(Transaction.amount_cents), 0)).where(
        Transaction.credit_card_id == card.id,
        Transaction.type == "DESPESA",
        Transaction.status == "PENDENTE"
    )
    used_limit_cents = (await db.execute(used_query)).scalar() or 0
    available_limit_cents = max(0, card.limit_cents - used_limit_cents)

    # Fatura Atual do ciclo corrente
    cur_inv_query = select(func.coalesce(func.sum(Transaction.amount_cents), 0)).where(
        Transaction.credit_card_id == card.id,
        Transaction.type == "DESPESA",
        Transaction.invoice_year == cur_inv_y,
        Transaction.invoice_month == cur_inv_m,
        Transaction.status != "CANCELADO"
    )
    current_invoice_cents = (await db.execute(cur_inv_query)).scalar() or 0

    return (used_limit_cents, available_limit_cents, current_invoice_cents)


async def get_card_invoices_summary(
    db: AsyncSession,
    card: CreditCard
) -> List[CreditCardInvoiceSummary]:
    """
    Retorna a lista cronológica de faturas do cartão (passadas, atual e futuras com lançamentos).
    """
    # 1. Busca todos os pares (invoice_year, invoice_month) que possuem transações no cartão
    distinct_query = (
        select(Transaction.invoice_year, Transaction.invoice_month)
        .where(
            Transaction.credit_card_id == card.id,
            Transaction.invoice_year.isnot(None),
            Transaction.invoice_month.isnot(None),
            Transaction.status != "CANCELADO"
        )
        .distinct()
    )
    distinct_rows = (await db.execute(distinct_query)).all()

    today = date.today()
    cur_inv_m, cur_inv_y, _, _, _ = calculate_invoice_period_and_due_date(
        today, card.closing_day, card.due_day
    )

    periods_set = set((row[0], row[1]) for row in distinct_rows)
    # Garante que o ciclo atual sempre apareça
    periods_set.add((cur_inv_y, cur_inv_m))

    summaries: List[CreditCardInvoiceSummary] = []

    for y, m in periods_set:
        dummy_purchase = date(y, m, 1)
        _, _, start_str, end_str, due_str = calculate_invoice_period_and_due_date(
            dummy_purchase, card.closing_day, card.due_day
        )

        # Busca transações deste ciclo
        items_query = select(Transaction).where(
            Transaction.credit_card_id == card.id,
            Transaction.invoice_year == y,
            Transaction.invoice_month == m,
            Transaction.status != "CANCELADO"
        )
        items = (await db.execute(items_query)).scalars().all()

        total_cents = sum(t.amount_cents for t in items if t.type == "DESPESA")
        paid_cents = sum(t.amount_cents for t in items if t.type == "DESPESA" and t.status == "CONCLUIDO")
        remaining_cents = total_cents - paid_cents

        today_str = today.strftime("%Y-%m-%d")
        if len(items) > 0 and all(t.status == "CONCLUIDO" for t in items):
            inv_status = "PAGA"
        elif today_str > end_str:
            inv_status = "FECHADA"
        else:
            inv_status = "ABERTA"

        summaries.append(CreditCardInvoiceSummary(
            card_id=card.id,
            card_name=card.name,
            month=m,
            year=y,
            period_start=start_str,
            period_end=end_str,
            due_date=due_str,
            status=inv_status,
            total_cents=total_cents,
            paid_cents=paid_cents,
            remaining_cents=remaining_cents,
            items_count=len(items)
        ))

    # Ordena por ano e mês decrescente
    summaries.sort(key=lambda s: (s.year, s.month), reverse=True)
    return summaries


async def get_invoice_detail(
    db: AsyncSession,
    card: CreditCard,
    year: int,
    month: int
) -> CreditCardInvoiceDetail:
    """
    Retorna o detalhe da fatura com a listagem de todos os lançamentos que a compõem.
    """
    dummy_purchase = date(year, month, 1)
    _, _, start_str, end_str, due_str = calculate_invoice_period_and_due_date(
        dummy_purchase, card.closing_day, card.due_day
    )

    query = (
        select(
            Transaction,
            Category.name.label("category_name"),
            Contact.name.label("contact_name")
        )
        .join(Category, Transaction.category_id == Category.id)
        .outerjoin(Contact, Transaction.contact_id == Contact.id)
        .where(
            Transaction.credit_card_id == card.id,
            Transaction.invoice_year == year,
            Transaction.invoice_month == month,
            Transaction.status != "CANCELADO"
        )
        .order_by(Transaction.due_date.asc(), Transaction.created_at.asc())
    )
    results = (await db.execute(query)).all()

    items: List[CreditCardInvoiceItem] = []
    total_cents = 0
    paid_cents = 0

    for t, cat_name, con_name in results:
        if t.type == "DESPESA":
            total_cents += t.amount_cents
            if t.status == "CONCLUIDO":
                paid_cents += t.amount_cents

        items.append(CreditCardInvoiceItem(
            id=t.id,
            description=t.description,
            amount_cents=t.amount_cents,
            category_id=t.category_id,
            category_name=cat_name,
            contact_id=t.contact_id,
            contact_name=con_name,
            due_date=t.due_date,
            payment_date=t.payment_date,
            created_at=t.created_at,
            installment_number=t.installment_number,
            total_installments=t.total_installments,
            status=t.status, # type: ignore
            notes=t.notes
        ))

    today_str = date.today().strftime("%Y-%m-%d")
    if len(items) > 0 and all(item.status == "CONCLUIDO" for item in items):
        inv_status = "PAGA"
    elif today_str > end_str:
        inv_status = "FECHADA"
    else:
        inv_status = "ABERTA"

    return CreditCardInvoiceDetail(
        card_id=card.id,
        card_name=card.name,
        month=month,
        year=year,
        period_start=start_str,
        period_end=end_str,
        due_date=due_str,
        status=inv_status,
        total_cents=total_cents,
        paid_cents=paid_cents,
        remaining_cents=total_cents - paid_cents,
        items_count=len(items),
        items=items
    )


async def settle_card_invoice(
    db: AsyncSession,
    card: CreditCard,
    year: int,
    month: int,
    req: CreditCardInvoiceSettleRequest
) -> CreditCardInvoiceSettleResponse:
    """
    Executa a liquidação da fatura:
    1. Marca todos os lançamentos pendentes da fatura como CONCLUIDO
    2. Cria uma única saída (DESPESA) consolidada na conta bancária informada
    """
    # 1. Valida conta bancária
    account = await db.get(Account, req.account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta bancária de débito não encontrada."
        )

    # 2. Busca lançamentos pendentes desta fatura
    pending_query = select(Transaction).where(
        Transaction.credit_card_id == card.id,
        Transaction.invoice_year == year,
        Transaction.invoice_month == month,
        Transaction.status == "PENDENTE",
        Transaction.type == "DESPESA"
    )
    pending_items = (await db.execute(pending_query)).scalars().all()

    if not pending_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta fatura não possui lançamentos pendentes para liquidação."
        )

    total_pending_cents = sum(t.amount_cents for t in pending_items)
    amount_to_settle = req.amount_cents if (req.amount_cents and req.amount_cents > 0) else total_pending_cents

    # 3. Dá baixa em todos os lançamentos da fatura
    for item in pending_items:
        item.status = "CONCLUIDO"
        item.payment_date = req.payment_date
        item.sync_status = "PENDENTE"

    # 4. Resolve categoria para o débito bancário consolidado
    category_id = req.category_id
    if not category_id:
        # Busca categoria de pagamento de fatura ou a primeira categoria de despesa do perfil
        cat_query = select(Category).where(
            Category.profile == card.profile,
            Category.type == "DESPESA"
        ).order_by(Category.name.asc())
        cat_result = (await db.execute(cat_query)).scalars().first()
        if not cat_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhuma categoria de despesa cadastrada para registrar a saída na conta bancária."
            )
        category_id = cat_result.id

    # 5. Cria a transação de débito bancário consolidado
    dummy_purchase = date(year, month, 1)
    _, _, _, _, due_str = calculate_invoice_period_and_due_date(
        dummy_purchase, card.closing_day, card.due_day
    )

    bank_trans = Transaction(
        profile=card.profile,
        type="DESPESA",
        account_id=req.account_id,
        category_id=category_id,
        payment_method_id=req.payment_method_id,
        description=f"Pagamento Fatura {card.name} - {month:02d}/{year}",
        amount_cents=amount_to_settle,
        due_date=due_str,
        payment_date=req.payment_date,
        status="CONCLUIDO",
        sync_status="PENDENTE",
        is_invoice_payment=1,
        notes=req.notes or f"Liquidação consolidada da fatura {month:02d}/{year} ({len(pending_items)} compras)"
    )
    db.add(bank_trans)
    await db.commit()
    await db.refresh(bank_trans)

    return CreditCardInvoiceSettleResponse(
        card_id=card.id,
        month=month,
        year=year,
        total_settled_cents=amount_to_settle,
        settled_items_count=len(pending_items),
        bank_transaction_id=bank_trans.id,
        message=f"Fatura de {month:02d}/{year} liquidada com sucesso. Gerada saída de R$ {amount_to_settle / 100:.2f} na conta {account.name}."
    )


async def unsettle_card_invoice(
    db: AsyncSession,
    card: CreditCard,
    year: int,
    month: int
) -> dict:
    """
    Estorna/Reabre a fatura:
    1. Retorna os lançamentos para PENDENTE
    2. Exclui a saída de débito bancário consolidado associada
    """
    items_query = select(Transaction).where(
        Transaction.credit_card_id == card.id,
        Transaction.invoice_year == year,
        Transaction.invoice_month == month,
        Transaction.type == "DESPESA"
    )
    items = (await db.execute(items_query)).scalars().all()

    for item in items:
        item.status = "PENDENTE"
        item.payment_date = None
        item.sync_status = "PENDENTE"

    # Remove o débito bancário consolidado
    desc_pattern = f"Pagamento Fatura {card.name} - {month:02d}/{year}"
    bank_trans_query = select(Transaction).where(
        Transaction.profile == card.profile,
        Transaction.is_invoice_payment == 1,
        Transaction.description == desc_pattern
    )
    bank_trans_list = (await db.execute(bank_trans_query)).scalars().all()
    for bt in bank_trans_list:
        await db.delete(bt)

    await db.commit()
    return {
        "card_id": card.id,
        "month": month,
        "year": year,
        "message": f"Fatura de {month:02d}/{year} reaberta com sucesso. Lançamentos retornados para pendente."
    }
