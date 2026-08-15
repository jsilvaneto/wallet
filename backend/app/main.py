from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.api.v1 import api_router

from sqlalchemy import select, func
from app.database import engine, Base, AsyncSessionLocal
from app.models import User, Category, Account
from app.core.security import get_password_hash

async def seed_initial_data():
    async with AsyncSessionLocal() as session:
        # 1. Cria usuário admin se não houver usuários
        user_count = await session.scalar(select(func.count(User.id)))
        if user_count == 0:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin")
            )
            session.add(admin_user)

        # 2. Cria categorias padrão se não houver categorias
        cat_count = await session.scalar(select(func.count(Category.id)))
        if cat_count == 0:
            default_categories = [
                # Pessoal - Receitas
                Category(profile="PESSOAL", type="RECEITA", name="Salário / Rendimentos"),
                Category(profile="PESSOAL", type="RECEITA", name="Investimentos & Dividendos"),
                Category(profile="PESSOAL", type="RECEITA", name="Outras Receitas"),
                # Pessoal - Despesas
                Category(profile="PESSOAL", type="DESPESA", name="Moradia & Contas"),
                Category(profile="PESSOAL", type="DESPESA", name="Alimentação & Supermercado"),
                Category(profile="PESSOAL", type="DESPESA", name="Transporte & Combustível"),
                Category(profile="PESSOAL", type="DESPESA", name="Saúde & Farmácia"),
                Category(profile="PESSOAL", type="DESPESA", name="Educação"),
                Category(profile="PESSOAL", type="DESPESA", name="Lazer & Entretenimento"),
                Category(profile="PESSOAL", type="DESPESA", name="Outras Despesas"),
                # Empresa - Receitas
                Category(profile="EMPRESA", type="RECEITA", name="Prestação de Serviços"),
                Category(profile="EMPRESA", type="RECEITA", name="Venda de Produtos"),
                Category(profile="EMPRESA", type="RECEITA", name="Rendimentos PJ"),
                Category(profile="EMPRESA", type="RECEITA", name="Outras Receitas PJ"),
                # Empresa - Despesas
                Category(profile="EMPRESA", type="DESPESA", name="Fornecedores & Insumos"),
                Category(profile="EMPRESA", type="DESPESA", name="Salários & Pró-Labore"),
                Category(profile="EMPRESA", type="DESPESA", name="Impostos & Tributos (DAS/GPS)"),
                Category(profile="EMPRESA", type="DESPESA", name="Software & Infraestrutura"),
                Category(profile="EMPRESA", type="DESPESA", name="Marketing & Comercial"),
                Category(profile="EMPRESA", type="DESPESA", name="Outras Despesas PJ"),
            ]
            session.add_all(default_categories)

        # 3. Cria contas padrão se não houver contas
        acc_count = await session.scalar(select(func.count(Account.id)))
        if acc_count == 0:
            default_accounts = [
                Account(profile="PESSOAL", name="Carteira / Dinheiro", type="CAIXA"),
                Account(profile="PESSOAL", name="Conta Corrente", type="CORRENTE"),
                Account(profile="EMPRESA", name="Conta PJ", type="CORRENTE"),
            ]
            session.add_all(default_accounts)

        await session.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()
    yield
    await engine.dispose()

app = FastAPI(
    title="Wallet API",
    description="Sistema de Gestão Financeira Local-First",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/api/health", tags=["Sistema"])
async def health_check():
    return {
        "status": "healthy",
        "database": "sqlite_wal",
        "app": "Wallet API"
    }
