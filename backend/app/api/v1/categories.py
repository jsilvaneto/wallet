from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Category, User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTreeResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/categories", tags=["Categorias"])

@router.get("", response_model=List[CategoryResponse])
async def list_categories(
    profile: Optional[str] = Query(None, description="Filtrar por PESSOAL ou EMPRESA"),
    type: Optional[str] = Query(None, description="Filtrar por RECEITA ou DESPESA"),
    nature: Optional[str] = Query(None, description="Filtrar por NENHUM, OBRIGATORIO, NECESSARIO, DESEJO"),
    parent_only: bool = Query(False, description="Trazer apenas categorias raiz"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Category)
    if profile:
        query = query.where(Category.profile == profile)
    if type:
        query = query.where(Category.type == type)
    if nature:
        query = query.where(Category.nature == nature)
    if parent_only:
        query = query.where(Category.parent_id.is_(None))
        
    query = query.order_by(Category.name.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/tree", response_model=List[CategoryTreeResponse])
async def list_category_tree(
    profile: Optional[str] = Query(None, description="Filtrar por PESSOAL ou EMPRESA"),
    type: Optional[str] = Query(None, description="Filtrar por RECEITA ou DESPESA"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    # 1. Busca todas as categorias do perfil/tipo
    query = select(Category)
    if profile:
        query = query.where(Category.profile == profile)
    if type:
        query = query.where(Category.type == type)
    query = query.order_by(Category.name.asc())
    result = await db.execute(query)
    all_cats = result.scalars().all()

    # 2. Monta árvore: raízes e suas subcategorias
    roots = [c for c in all_cats if c.parent_id is None]
    subcats_map = {}
    for c in all_cats:
        if c.parent_id:
            subcats_map.setdefault(c.parent_id, []).append(c)

    tree = []
    for r in roots:
        tree.append(CategoryTreeResponse(
            id=r.id,
            profile=r.profile,
            type=r.type,
            name=r.name,
            nature=r.nature,
            parent_id=r.parent_id,
            created_at=r.created_at,
            subcategories=[CategoryResponse.model_validate(sub) for sub in subcats_map.get(r.id, [])]
        ))
    return tree

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    if cat_in.parent_id:
        parent_query = select(Category).where(Category.id == cat_in.parent_id)
        parent_result = await db.execute(parent_query)
        parent = parent_result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Categoria pai inexistente.")
        if parent.profile != cat_in.profile or parent.type != cat_in.type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A subcategoria deve pertencer ao mesmo perfil e tipo da categoria pai."
            )
        if parent.parent_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uma subcategoria não pode ser associada a outra subcategoria (limite de 1 nível de aninhamento)."
            )

    new_cat = Category(**cat_in.model_dump())
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    return new_cat

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Category).where(Category.id == category_id)
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada.")
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    cat_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Category).where(Category.id == category_id)
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada.")
    
    if cat_in.parent_id:
        if cat_in.parent_id == category_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uma categoria não pode ser pai de si mesma.")
        parent = await db.get(Category, cat_in.parent_id)
        if not parent:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Categoria pai inexistente.")
        if parent.parent_id is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é permitido aninhamento além de subcategorias.")

    update_data = cat_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Category).where(Category.id == category_id)
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada.")
    
    await db.delete(category)
    await db.commit()
