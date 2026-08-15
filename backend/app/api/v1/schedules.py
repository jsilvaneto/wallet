from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Schedule, User
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from app.services.schedule_service import create_schedule_with_transactions
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/schedules", tags=["Pagamentos Planejados"])

@router.get("", response_model=List[ScheduleResponse])
async def list_schedules(
    profile: Optional[str] = Query(None, description="Filtrar por PESSOAL ou EMPRESA"),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Schedule)
    if profile:
        query = query.where(Schedule.profile == profile)
    if status_filter:
        query = query.where(Schedule.status == status_filter)
    query = query.order_by(Schedule.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_in: ScheduleCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    if schedule_in.schedule_type == "PARCELADA" and not schedule_in.total_installments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Planos parcelados exigem a quantidade total de parcelas (total_installments)"
        )
    return await create_schedule_with_transactions(db, schedule_in)

@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: str,
    schedule_in: ScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Schedule).where(Schedule.id == schedule_id)
    result = await db.execute(query)
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado")
    
    update_data = schedule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)
    
    await db.commit()
    await db.refresh(schedule)
    return schedule

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Schedule).where(Schedule.id == schedule_id)
    result = await db.execute(query)
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado")
    await db.delete(schedule)
    await db.commit()
