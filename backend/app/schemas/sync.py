from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class SyncConfigResponse(BaseModel):
    spreadsheet_id: Optional[str] = None
    spreadsheet_url: Optional[str] = None
    has_credentials: bool = False
    service_account_email: Optional[str] = None
    last_sync_at: Optional[str] = None
    last_sync_status: Optional[str] = None
    last_action: Optional[str] = None

class SyncConfigUpdate(BaseModel):
    spreadsheet_id: Optional[str] = None
    credentials_json: Optional[str] = None

class SyncTestResponse(BaseModel):
    success: bool
    message: str
    spreadsheet_title: Optional[str] = None
    sheets_found: List[str] = []
    service_account_email: Optional[str] = None

class SyncTriggerRequest(BaseModel):
    spreadsheet_id: Optional[str] = None

class SyncResultResponse(BaseModel):
    success: bool
    message: str
    imported_from_queue: int = 0
    exported_to_mirror: int = 0
    entity_counts: Dict[str, int] = Field(default_factory=dict, description="Quantitativo de registros exportados por tabela")
    errors: List[str] = []

class SyncPendingDetails(BaseModel):
    pending_transactions: int = 0
    pending_categories: int = 0
    pending_items: int = 0
    pending_accounts: int = 0
    pending_contacts: int = 0
    pending_debts: int = 0
    pending_budgets: int = 0
    queue_rows: int = 0

class SyncStatusResponse(BaseModel):
    is_configured: bool = False
    has_credentials: bool = False
    spreadsheet_id: Optional[str] = None
    spreadsheet_url: Optional[str] = None
    service_account_email: Optional[str] = None
    pending_send: int = 0
    pending_receive: int = 0
    total_pending: int = 0
    has_pending: bool = False
    last_sync_at: Optional[str] = None
    last_sync_status: Optional[str] = None
    last_action: Optional[str] = None
    details: Optional[SyncPendingDetails] = None

class SyncLogResponse(BaseModel):
    id: str
    action: str
    status: str
    items_imported: int
    items_exported: int
    message: str
    details: Optional[str] = None
    created_at: str

