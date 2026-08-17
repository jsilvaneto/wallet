from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional, List
from app.schemas.attachment import AttachmentResponse

ProfileType = Literal["PESSOAL", "EMPRESA"]
TransactionType = Literal["RECEITA", "DESPESA"]
TransactionStatus = Literal["PENDENTE", "CONCLUIDO", "CANCELADO"]
SyncStatus = Literal["PENDENTE", "SINCRONIZADO"]

class TransactionBase(BaseModel):
    type: TransactionType = Field(..., description="RECEITA ou DESPESA")
    account_id: Optional[str] = None
    category_id: str = Field(..., description="ID da categoria")
    item_id: Optional[str] = None
    contact_id: Optional[str] = None
    debt_id: Optional[str] = None
    description: str = Field(..., min_length=1, max_length=255)
    amount_cents: int = Field(..., gt=0, description="Valor em centavos")
    due_date: str = Field(..., description="Data prevista / vencimento (YYYY-MM-DD)")
    payment_date: Optional[str] = Field(None, description="Data de quitação real (YYYY-MM-DD)")
    status: TransactionStatus = Field(default="PENDENTE")
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    profile: ProfileType = Field(..., description="Perfil da transação")
    attachment_ids: Optional[List[str]] = Field(default=None, description="IDs dos anexos previamente carregados para vincular")

class TransactionUpdate(BaseModel):
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    item_id: Optional[str] = None
    contact_id: Optional[str] = None
    debt_id: Optional[str] = None
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount_cents: Optional[int] = Field(None, gt=0)
    due_date: Optional[str] = None
    payment_date: Optional[str] = None
    status: Optional[TransactionStatus] = None
    notes: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: str
    profile: ProfileType
    schedule_id: Optional[str] = None
    installment_number: Optional[int] = None
    total_installments: Optional[int] = None
    sync_status: SyncStatus
    created_at: str
    updated_at: str
    attachments: List[AttachmentResponse] = Field(default_factory=list)
    attachments_count: int = 0

    model_config = ConfigDict(from_attributes=True)

