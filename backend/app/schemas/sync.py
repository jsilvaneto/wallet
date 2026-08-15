from pydantic import BaseModel
from typing import List, Optional

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
    errors: List[str] = []

class SyncLogResponse(BaseModel):
    id: str
    action: str
    status: str
    items_imported: int
    items_exported: int
    message: str
    details: Optional[str] = None
    created_at: str
