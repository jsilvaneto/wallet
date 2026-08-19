from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, text
from app.database import engine, Base, AsyncSessionLocal
import app.models
from app.models import User, Category, Account, PaymentMethod
from app.core.security import get_password_hash
from app.api.v1 import api_router

async def migrate_database_schema():
    """Garante que colunas novas como 'nature', 'attachment_type', 'payment_method_id' e 'credit_card_id' existam no banco SQLite."""
    async with engine.begin() as conn:
        try:
            # 1. Verifica colunas da tabela categories
            res = await conn.execute(text("PRAGMA table_info(categories)"))
            columns = [row[1] for row in res.fetchall()]
            if "nature" not in columns:
                await conn.execute(text("ALTER TABLE categories ADD COLUMN nature VARCHAR(20) DEFAULT 'NENHUM' NOT NULL"))

            # 2. Verifica colunas da tabela attachments
            res_att = await conn.execute(text("PRAGMA table_info(attachments)"))
            att_columns = [row[1] for row in res_att.fetchall()]
            if att_columns and "attachment_type" not in att_columns:
                await conn.execute(text("ALTER TABLE attachments ADD COLUMN attachment_type VARCHAR(30) DEFAULT 'COMPROVANTE' NOT NULL"))

            # 3. Verifica colunas da tabela transactions
            res_trans = await conn.execute(text("PRAGMA table_info(transactions)"))
            trans_columns = [row[1] for row in res_trans.fetchall()]
            if trans_columns:
                if "payment_method_id" not in trans_columns:
                    await conn.execute(text("ALTER TABLE transactions ADD COLUMN payment_method_id VARCHAR(36) REFERENCES payment_methods(id) ON DELETE SET NULL"))
                if "credit_card_id" not in trans_columns:
                    await conn.execute(text("ALTER TABLE transactions ADD COLUMN credit_card_id VARCHAR(36) REFERENCES credit_cards(id) ON DELETE SET NULL"))
                if "invoice_month" not in trans_columns:
                    await conn.execute(text("ALTER TABLE transactions ADD COLUMN invoice_month INTEGER"))
                if "invoice_year" not in trans_columns:
                    await conn.execute(text("ALTER TABLE transactions ADD COLUMN invoice_year INTEGER"))
                if "is_invoice_payment" not in trans_columns:
                    await conn.execute(text("ALTER TABLE transactions ADD COLUMN is_invoice_payment INTEGER DEFAULT 0 NOT NULL"))

            # 4. Verifica colunas da tabela schedules
            res_sched = await conn.execute(text("PRAGMA table_info(schedules)"))
            sched_columns = [row[1] for row in res_sched.fetchall()]
            if sched_columns:
                if "account_id" not in sched_columns:
                    await conn.execute(text("ALTER TABLE schedules ADD COLUMN account_id VARCHAR(36) REFERENCES accounts(id) ON DELETE SET NULL"))
                if "payment_method_id" not in sched_columns:
                    await conn.execute(text("ALTER TABLE schedules ADD COLUMN payment_method_id VARCHAR(36) REFERENCES payment_methods(id) ON DELETE SET NULL"))
                if "credit_card_id" not in sched_columns:
                    await conn.execute(text("ALTER TABLE schedules ADD COLUMN credit_card_id VARCHAR(36) REFERENCES credit_cards(id) ON DELETE SET NULL"))
        except Exception as e:
            print("Aviso na migração SQLite:", e)

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
                Category(profile="PESSOAL", type="RECEITA", nature="NENHUM", name="Salário / Rendimentos"),
                Category(profile="PESSOAL", type="RECEITA", nature="NENHUM", name="Investimentos & Dividendos"),
                Category(profile="PESSOAL", type="RECEITA", nature="NENHUM", name="Outras Receitas"),
                # Pessoal - Despesas (com naturezas padrão)
                Category(profile="PESSOAL", type="DESPESA", nature="OBRIGATORIO", name="Moradia & Contas"),
                Category(profile="PESSOAL", type="DESPESA", nature="NECESSARIO", name="Alimentação & Supermercado"),
                Category(profile="PESSOAL", type="DESPESA", nature="NECESSARIO", name="Transporte & Combustível"),
                Category(profile="PESSOAL", type="DESPESA", nature="OBRIGATORIO", name="Saúde & Farmácia"),
                Category(profile="PESSOAL", type="DESPESA", nature="NECESSARIO", name="Educação"),
                Category(profile="PESSOAL", type="DESPESA", nature="DESEJO", name="Lazer & Entretenimento"),
                Category(profile="PESSOAL", type="DESPESA", nature="NENHUM", name="Outras Despesas"),
                # Empresa - Receitas
                Category(profile="EMPRESA", type="RECEITA", nature="NENHUM", name="Prestação de Serviços"),
                Category(profile="EMPRESA", type="RECEITA", nature="NENHUM", name="Venda de Produtos"),
                Category(profile="EMPRESA", type="RECEITA", nature="NENHUM", name="Rendimentos PJ"),
                Category(profile="EMPRESA", type="RECEITA", nature="NENHUM", name="Outras Receitas PJ"),
                # Empresa - Despesas (com naturezas padrão)
                Category(profile="EMPRESA", type="DESPESA", nature="NECESSARIO", name="Fornecedores & Insumos"),
                Category(profile="EMPRESA", type="DESPESA", nature="OBRIGATORIO", name="Salários & Pró-Labore"),
                Category(profile="EMPRESA", type="DESPESA", nature="OBRIGATORIO", name="Impostos & Tributos (DAS/GPS)"),
                Category(profile="EMPRESA", type="DESPESA", nature="NECESSARIO", name="Software & Infraestrutura"),
                Category(profile="EMPRESA", type="DESPESA", nature="NECESSARIO", name="Marketing & Comercial"),
                Category(profile="EMPRESA", type="DESPESA", nature="NENHUM", name="Outras Despesas PJ"),
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

        # 4. Cria formas de pagamento padrão se não houver formas cadastradas
        pm_count = await session.scalar(select(func.count(PaymentMethod.id)))
        if pm_count == 0:
            standard_methods = [
                "Pix",
                "Boleto",
                "Cartão de Crédito",
                "Cartão de Débito",
                "Dinheiro Físico",
                "Transferência Bancária",
                "Débito Automático"
            ]
            default_pms = []
            for prof in ["PESSOAL", "EMPRESA"]:
                for name in standard_methods:
                    default_pms.append(PaymentMethod(profile=prof, name=name))
            session.add_all(default_pms)

        await session.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await migrate_database_schema()
    await seed_initial_data()
    yield
    await engine.dispose()

app = FastAPI(
    title="Wallet API",
    description="Sistema de Gestão Financeira",
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
