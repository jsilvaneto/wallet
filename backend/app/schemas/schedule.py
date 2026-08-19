from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional

ProfileType = Literal["PESSOAL", "EMPRESA"]
TransactionType = Literal["RECEITA", "DESPESA"]
ScheduleType = Literal["RECORRENTE_CONTINUA", "PARCELADA"]
FrequencyType = Literal["SEMANAL", "MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]
ScheduleStatus = Literal["ATIVO", "PAUSADO", "FINALIZADO", "CANCELADO"]

class ScheduleBase(BaseModel):
    type: TransactionType = Field(..., description="RECEITA ou DESPESA")
    account_id: Optional[str] = None
    credit_card_id: Optional[str] = None
    category_id: str = Field(..., description="ID da categoria")
    item_id: Optional[str] = None
    contact_id: Optional[str] = None
    debt_id: Optional[str] = None
    payment_method_id: Optional[str] = None
    description: str = Field(..., min_length=1, max_length=255)
    schedule_type: ScheduleType = Field(..., description="RECORRENTE_CONTINUA ou PARCELADA")
    frequency: FrequencyType = Field(default="MENSAL")
    amount_cents: int = Field(..., gt=0, description="Valor da parcela ou recorrência em centavos")
    total_installments: Optional[int] = Field(None, ge=2, description="Obrigatório se PARCELADA")
    start_date: str = Field(..., description="Data do 1º vencimento (YYYY-MM-DD)")
    due_day: int = Field(..., ge=1, le=31, description="Dia padrão de vencimento")

class ScheduleCreate(ScheduleBase):
    profile: ProfileType = Field(..., description="Perfil do plano")

class ScheduleUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount_cents: Optional[int] = Field(None, gt=0)
    due_day: Optional[int] = Field(None, ge=1, le=31)
    status: Optional[ScheduleStatus] = None

class ScheduleResponse(ScheduleBase):
    id: str
    profile: ProfileType
    status: ScheduleStatus
    created_at: str

    model_config = ConfigDict(from_attributes=True)
