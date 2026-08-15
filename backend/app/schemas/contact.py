from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional

ProfileType = Literal["PESSOAL", "EMPRESA"]
ContactType = Literal["FORNECEDOR", "CLIENTE", "FUNCIONARIO", "OUTRO"]

class ContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nome do contato")
    type: ContactType = Field(..., description="Classificação do contato")
    document: Optional[str] = Field(None, max_length=30, description="CPF ou CNPJ opcional")
    notes: Optional[str] = Field(None, description="Observações gerais")

class ContactCreate(ContactBase):
    profile: ProfileType = Field(..., description="Perfil do lançamento")

class ContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[ContactType] = None
    document: Optional[str] = Field(None, max_length=30)
    notes: Optional[str] = None

class ContactResponse(ContactBase):
    id: str
    profile: ProfileType
    created_at: str

    model_config = ConfigDict(from_attributes=True)
