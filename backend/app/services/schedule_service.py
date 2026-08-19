import calendar
from datetime import date, datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Schedule, Transaction
from app.schemas.schedule import ScheduleCreate

def calculate_next_date(base_date: date, frequency: str, step: int, fixed_day: int) -> date:
    """Calcula a data futura respeitando a frequência e o dia de vencimento."""
    if frequency == "SEMANAL":
        from datetime import timedelta
        return base_date + timedelta(weeks=step)
    
    # Cálculo em meses para mensal, trimestral, semestral e anual
    month_increments = {
        "MENSAL": 1,
        "TRIMESTRAL": 3,
        "SEMESTRAL": 6,
        "ANUAL": 12
    }
    months_to_add = month_increments.get(frequency, 1) * step
    
    total_month = base_date.month - 1 + months_to_add
    year = base_date.year + total_month // 12
    month = total_month % 12 + 1
    max_day = calendar.monthrange(year, month)[1]
    day = min(fixed_day, max_day)
    
    return date(year, month, day)

async def create_schedule_with_transactions(db: AsyncSession, schedule_in: ScheduleCreate) -> Schedule:
    # 1. Cria o registro mestre do plano
    schedule_data = schedule_in.model_dump()
    new_schedule = Schedule(**schedule_data)
    db.add(new_schedule)
    await db.flush() # Obtém o ID do schedule

    # 2. Converte a data inicial
    start_dt = datetime.strptime(schedule_in.start_date, "%Y-%m-%d").date()
    
    # 3. Determina quantas transações materializar
    if schedule_in.schedule_type == "PARCELADA":
        count = schedule_in.total_installments or 1
    else:
        # Recorrente contínua gera os próximos 12 lançamentos de projeção
        count = 12

    # 4. Cria as transações
    for i in range(count):
        inst_number = (i + 1) if schedule_in.schedule_type == "PARCELADA" else None
        total_inst = schedule_in.total_installments if schedule_in.schedule_type == "PARCELADA" else None
        
        due_dt = calculate_next_date(start_dt, schedule_in.frequency, i, schedule_in.due_day)
        
        desc = schedule_in.description
        if schedule_in.schedule_type == "PARCELADA":
            desc = f"{schedule_in.description} ({inst_number}/{total_inst})"

        trans = Transaction(
            profile=schedule_in.profile,
            type=schedule_in.type,
            category_id=schedule_in.category_id,
            item_id=schedule_in.item_id,
            contact_id=schedule_in.contact_id,
            debt_id=schedule_in.debt_id,
            payment_method_id=schedule_in.payment_method_id,
            schedule_id=new_schedule.id,
            installment_number=inst_number,
            total_installments=total_inst,
            description=desc,
            amount_cents=schedule_in.amount_cents,
            due_date=due_dt.isoformat(),
            status="PENDENTE",
            sync_status="PENDENTE"
        )
        db.add(trans)

    await db.commit()
    await db.refresh(new_schedule)
    return new_schedule
