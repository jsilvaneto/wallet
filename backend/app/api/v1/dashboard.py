from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models import Transaction, Category, User
from app.schemas.dashboard import DashboardSummaryResponse, CategoryBreakdown
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analítico"])

@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    profile: str = Query(..., description="PESSOAL ou EMPRESA"),
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    month_str = f"{year:04d}-{month:02d}"

    # 1. Realizados no Mês (Status = CONCLUIDO)
    inc_real_query = select(func.coalesce(func.sum(Transaction.amount_cents), 0)).where(
        Transaction.profile == profile,
        Transaction.type == "RECEITA",
        Transaction.status == "CONCLUIDO",
        Transaction.due_date.startswith(month_str)
    )
    inc_real = (await db.execute(inc_real_query)).scalar() or 0

    exp_real_query = select(func.coalesce(func.sum(Transaction.amount_cents), 0)).where(
        Transaction.profile == profile,
        Transaction.type == "DESPESA",
        Transaction.status == "CONCLUIDO",
        Transaction.due_date.startswith(month_str)
    )
    exp_real = (await db.execute(exp_real_query)).scalar() or 0

    # 2. Pendentes no Mês (Status = PENDENTE)
    inc_pend_query = select(func.coalesce(func.sum(Transaction.amount_cents), 0)).where(
        Transaction.profile == profile,
        Transaction.type == "RECEITA",
        Transaction.status == "PENDENTE",
        Transaction.due_date.startswith(month_str)
    )
    inc_pend = (await db.execute(inc_pend_query)).scalar() or 0

    exp_pend_query = select(func.coalesce(func.sum(Transaction.amount_cents), 0)).where(
        Transaction.profile == profile,
        Transaction.type == "DESPESA",
        Transaction.status == "PENDENTE",
        Transaction.due_date.startswith(month_str)
    )
    exp_pend = (await db.execute(exp_pend_query)).scalar() or 0

    # 3. Alertas Operacionais
    # Atrasados (Vencimento anterior a hoje e ainda pendente)
    overdue_query = select(
        func.count(Transaction.id),
        func.coalesce(func.sum(Transaction.amount_cents), 0)
    ).where(
        Transaction.profile == profile,
        Transaction.type == "DESPESA",
        Transaction.status == "PENDENTE",
        Transaction.due_date < today_str
    )
    overdue_count, overdue_amount = (await db.execute(overdue_query)).one()

    # Vencem hoje
    due_today_query = select(
        func.count(Transaction.id),
        func.coalesce(func.sum(Transaction.amount_cents), 0)
    ).where(
        Transaction.profile == profile,
        Transaction.type == "DESPESA",
        Transaction.status == "PENDENTE",
        Transaction.due_date == today_str
    )
    due_today_count, due_today_amount = (await db.execute(due_today_query)).one()

    # 4. Top Categorias de Despesas do Mês
    cat_query = (
        select(
            Category.id,
            Category.name,
            func.coalesce(func.sum(Transaction.amount_cents), 0).label("total_cents")
        )
        .join(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.profile == profile,
            Transaction.type == "DESPESA",
            Transaction.status != "CANCELADO",
            Transaction.due_date.startswith(month_str)
        )
        .group_by(Category.id, Category.name)
        .order_by(desc("total_cents"))
        .limit(5)
    )
    cat_rows = (await db.execute(cat_query)).all()

    total_expenses_month = exp_real + exp_pend
    categories_breakdown = [
        CategoryBreakdown(
            category_id=c_id,
            category_name=c_name,
            amount_cents=c_total,
            percentage=round((c_total / total_expenses_month) * 100, 2) if total_expenses_month > 0 else 0.0
        )
        for c_id, c_name, c_total in cat_rows
    ]

    return DashboardSummaryResponse(
        profile=profile,
        month=month,
        year=year,
        income_realized_cents=inc_real,
        expense_realized_cents=exp_real,
        net_realized_cents=(inc_real - exp_real),
        income_pending_cents=inc_pend,
        expense_pending_cents=exp_pend,
        net_pending_cents=(inc_pend - exp_pend),
        projected_net_cents=(inc_real + inc_pend) - (exp_real + exp_pend),
        overdue_count=overdue_count,
        overdue_amount_cents=overdue_amount,
        due_today_count=due_today_count,
        due_today_amount_cents=due_today_amount,
        top_expense_categories=categories_breakdown
    )
