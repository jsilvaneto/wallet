from pydantic import BaseModel
from typing import List, Optional

class CategoryBreakdown(BaseModel):
    category_id: str
    category_name: str
    amount_cents: int
    percentage: float

class DashboardSummaryResponse(BaseModel):
    profile: str
    month: int
    year: int
    
    # Realizados (Liquidados no mês)
    income_realized_cents: int
    expense_realized_cents: int
    net_realized_cents: int
    
    # Pendentes (A vencer no mês)
    income_pending_cents: int
    expense_pending_cents: int
    net_pending_cents: int
    
    # Projeção final consolidada
    projected_net_cents: int
    
    # Alertas operacionais
    overdue_count: int
    overdue_amount_cents: int
    due_today_count: int
    due_today_amount_cents: int

    # Top categorias de despesas
    top_expense_categories: List[CategoryBreakdown] = []
