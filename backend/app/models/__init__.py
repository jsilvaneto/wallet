import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, ForeignKey, Text, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# 1. Usuários
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

# 2. Contas / Carteiras
class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False) # 'PESSOAL' ou 'EMPRESA'
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False) # CORRENTE, POUPANCA, INVESTIMENTO, CAIXA
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_account_profile"),
    )

# 3. Categorias
class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False) # 'RECEITA' ou 'DESPESA'
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    nature: Mapped[str] = mapped_column(String(20), default="NENHUM", nullable=False) # 'NENHUM', 'OBRIGATORIO', 'NECESSARIO', 'DESEJO'
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_category_profile"),
        CheckConstraint("type IN ('RECEITA', 'DESPESA')", name="chk_category_type"),
        CheckConstraint("nature IN ('NENHUM', 'OBRIGATORIO', 'NECESSARIO', 'DESEJO')", name="chk_category_nature"),
    )

# 4. Itens Vinculados a Categoria
class Item(Base):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    default_amount_cents: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

    category: Mapped["Category"] = relationship("Category")

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_item_profile"),
    )

# 5. Contatos (Clientes, Fornecedores, etc.)
class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False) # FORNECEDOR, CLIENTE, FUNCIONARIO, OUTRO
    document: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_contact_profile"),
        CheckConstraint("type IN ('FORNECEDOR', 'CLIENTE', 'FUNCIONARIO', 'OUTRO')", name="chk_contact_type"),
    )

# 6. Dívidas / Passivos
class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False)
    contact_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    total_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True) # YYYY-MM-DD
    status: Mapped[str] = mapped_column(String(20), default="ATIVA", nullable=False) # ATIVA, QUITADA, CANCELADA
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

    contact: Mapped[Optional["Contact"]] = relationship("Contact")

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_debt_profile"),
        CheckConstraint("status IN ('ATIVA', 'QUITADA', 'CANCELADA')", name="chk_debt_status"),
    )

# 7. Planos Mestres de Pagamentos (Recorrentes ou Parcelados)
class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False) # RECEITA, DESPESA
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    item_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("items.id", ondelete="SET NULL"), nullable=True)
    contact_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    debt_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("debts.id", ondelete="SET NULL"), nullable=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    
    schedule_type: Mapped[str] = mapped_column(String(30), nullable=False) # RECORRENTE_CONTINUA, PARCELADA
    frequency: Mapped[str] = mapped_column(String(20), default="MENSAL", nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    total_installments: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_date: Mapped[str] = mapped_column(String(10), nullable=False)
    due_day: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="ATIVO", nullable=False) # ATIVO, PAUSADO, FINALIZADO, CANCELADO
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

    category: Mapped["Category"] = relationship("Category")
    item: Mapped[Optional["Item"]] = relationship("Item")
    contact: Mapped[Optional["Contact"]] = relationship("Contact")
    debt: Mapped[Optional["Debt"]] = relationship("Debt")

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_schedule_profile"),
        CheckConstraint("type IN ('RECEITA', 'DESPESA')", name="chk_schedule_type"),
        CheckConstraint("schedule_type IN ('RECORRENTE_CONTINUA', 'PARCELADA')", name="chk_schedule_kind"),
        CheckConstraint("frequency IN ('SEMANAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')", name="chk_schedule_freq"),
        CheckConstraint("due_day BETWEEN 1 AND 31", name="chk_schedule_day"),
    )

# 8. Transações e Contas a Pagar/Receber
class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False) # RECEITA, DESPESA
    account_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    item_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("items.id", ondelete="SET NULL"), nullable=True)
    contact_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    debt_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("debts.id", ondelete="SET NULL"), nullable=True)
    schedule_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("schedules.id", ondelete="CASCADE"), nullable=True)
    
    installment_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_installments: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[str] = mapped_column(String(10), nullable=False) # YYYY-MM-DD
    payment_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True) # YYYY-MM-DD
    status: Mapped[str] = mapped_column(String(20), default="PENDENTE", nullable=False) # PENDENTE, CONCLUIDO, CANCELADO
    sync_status: Mapped[str] = mapped_column(String(20), default="PENDENTE", nullable=False) # PENDENTE, SINCRONIZADO
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)
    updated_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, onupdate=now_utc_iso, nullable=False)

    account: Mapped[Optional["Account"]] = relationship("Account")
    category: Mapped["Category"] = relationship("Category")
    item: Mapped[Optional["Item"]] = relationship("Item")
    contact: Mapped[Optional["Contact"]] = relationship("Contact")
    debt: Mapped[Optional["Debt"]] = relationship("Debt")
    schedule: Mapped[Optional["Schedule"]] = relationship("Schedule")

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_trans_profile"),
        CheckConstraint("type IN ('RECEITA', 'DESPESA')", name="chk_trans_type"),
        CheckConstraint("status IN ('PENDENTE', 'CONCLUIDO', 'CANCELADO')", name="chk_trans_status"),
        CheckConstraint("sync_status IN ('PENDENTE', 'SINCRONIZADO')", name="chk_trans_sync"),
        Index("idx_trans_profile_due", "profile", "due_date"),
        Index("idx_trans_status", "status"),
        Index("idx_trans_sync", "sync_status"),
    )

# 9. Orçamentos Mensais
class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    limit_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

    category: Mapped["Category"] = relationship("Category")

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_budget_profile"),
        CheckConstraint("month BETWEEN 1 AND 12", name="chk_budget_month"),
    )

# 10. Metas Financeiras
class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    profile: Mapped[str] = mapped_column(String(10), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    target_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    current_amount_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    target_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="EM_ANDAMENTO", nullable=False)
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

    __table_args__ = (
        CheckConstraint("profile IN ('PESSOAL', 'EMPRESA')", name="chk_goal_profile"),
        CheckConstraint("status IN ('EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')", name="chk_goal_status"),
    )

# 11. Configurações do Sistema
class SystemConfig(Base):
    __tablename__ = "system_configs"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

# 12. Histórico e Logs de Sincronização
class SyncLog(Base):
    __tablename__ = "sync_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    action: Mapped[str] = mapped_column(String(20), nullable=False) # 'EXPORT', 'IMPORT', 'FULL', 'TEST'
    status: Mapped[str] = mapped_column(String(20), nullable=False) # 'SUCESSO', 'ERRO', 'EM_ANDAMENTO'
    items_imported: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    items_exported: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(30), default=now_utc_iso, nullable=False)

