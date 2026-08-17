from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

ProfileType = Literal["PESSOAL", "EMPRESA"]
SyncStatusType = Literal["PENDENTE", "SINCRONIZADO", "ERRO", "LOCAL_ONLY"]

class AttachmentBase(BaseModel):
    profile: ProfileType
    transaction_id: Optional[str] = None
    file_name: str
    file_size_bytes: int
    mime_type: str

class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile: ProfileType
    transaction_id: Optional[str] = None
    file_name: str
    file_path: str
    file_size_bytes: int
    mime_type: str
    drive_file_id: Optional[str] = None
    drive_web_view_link: Optional[str] = None
    drive_folder_id: Optional[str] = None
    sync_status: SyncStatusType = "PENDENTE"
    sync_error: Optional[str] = None
    created_at: str
    synced_at: Optional[str] = None

    # URLs convenientes
    download_url: Optional[str] = None
    file_url: Optional[str] = None
    formatted_size: Optional[str] = None

class AttachmentStatsResponse(BaseModel):
    total_count: int = 0
    total_size_bytes: int = 0
    formatted_total_size: str = "0 B"
    synced_count: int = 0
    pending_count: int = 0
    error_count: int = 0
    drive_connected: bool = False
    drive_folder_id: Optional[str] = None
    drive_folder_url: Optional[str] = None
    drive_folder_name: Optional[str] = None

class DriveFolderConfigRequest(BaseModel):
    folder_id_or_url: str = Field(..., description="ID ou Link da pasta no Google Drive")

class DriveFolderConfigResponse(BaseModel):
    folder_id: Optional[str] = None
    folder_url: Optional[str] = None
    folder_name: Optional[str] = None
    is_valid: bool = False
    message: str = ""

class DriveSyncTriggerResponse(BaseModel):
    success: bool
    message: str
    total_processed: int = 0
    synced_count: int = 0
    failed_count: int = 0
    errors: list[str] = Field(default_factory=list)

