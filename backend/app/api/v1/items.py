from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Item, User
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/items", tags=["Itens"])

@router.get("", response_model=List[ItemResponse])
async def list_items(
    profile: Optional[str] = Query(None, description="Filtrar por PESSOAL ou EMPRESA"),
    category_id: Optional[str] = Query(None, description="Filtrar por categoria"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Item)
    if profile:
        query = query.where(Item.profile == profile)
    if category_id:
        query = query.where(Item.category_id == category_id)
    query = query.order_by(Item.name.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_in: ItemCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    new_item = Item(**item_in.model_dump())
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item

@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: str,
    item_in: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Item).where(Item.id == item_id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
    
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Item).where(Item.id == item_id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
    await db.delete(item)
    await db.commit()
