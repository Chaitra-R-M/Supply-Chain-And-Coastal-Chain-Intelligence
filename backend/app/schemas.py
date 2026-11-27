from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PortUpdate(BaseModel):
    name: Optional[str] = None
    max_berths: Optional[int] = Field(None, ge=1, le=50)
    max_storage_mt: Optional[float] = Field(None, gt=0)
    channel_depth_m: Optional[float] = Field(None, gt=0)
    operating_hours: Optional[str] = None
    facilities: Optional[List[str]] = None


class VesselCreate(BaseModel):
    name: str = Field(..., min_length=2)
    imo_number: str = Field(..., min_length=5)
    shipping_company: str
    vessel_type: str
    capacity_dwt: float = Field(..., gt=0)
    length_m: float = Field(..., gt=10)
    draft_m: float = Field(..., gt=1)
    origin_port: str
    destination_port: str = "Mangalore Port"
    eta_hours: float = Field(default=6.0, ge=0)
    status: str = "En Route"


class VesselUpdate(BaseModel):
    status: Optional[str] = None
    speed_knots: Optional[float] = Field(None, ge=0)
    eta_hours: Optional[float] = Field(None, ge=0)
    assigned_berth_code: Optional[str] = None


class BerthCreate(BaseModel):
    code: str = Field(..., min_length=2)
    name: str
    berth_type: str
    max_length_m: float = Field(..., gt=20)
    max_draft_m: float = Field(..., gt=2)
    capacity_mt: float = Field(..., gt=100)


class BerthUpdate(BaseModel):
    max_length_m: Optional[float] = Field(None, gt=20)
    max_draft_m: Optional[float] = Field(None, gt=2)
    capacity_mt: Optional[float] = Field(None, gt=100)
    status: Optional[str] = None
    progress_pct: Optional[int] = Field(None, ge=0, le=100)


class BerthAssignRequest(BaseModel):
    vessel_id: str
    operation: str = "Unloading"  # Loading or Unloading
    duration_hours: float = Field(default=12.0, gt=0.5, le=168)
    start_time: Optional[datetime] = None


class CargoCreate(BaseModel):
    tracking_code: Optional[str] = None
    cargo_type: str
    commodity: str
    quantity_mt: float = Field(..., gt=0)
    owner_company: str
    destination: str
    vessel_name: str
    berth_code: Optional[str] = None
    warehouse_code: Optional[str] = None
    operation: str = "Import Unloading"


class CargoUpdate(BaseModel):
    status: Optional[str] = None
    berth_code: Optional[str] = None
    warehouse_code: Optional[str] = None
    note: Optional[str] = None


class InventoryAdjustRequest(BaseModel):
    warehouse_id: str
    delta_mt: float
    reason: str = "Cargo transfer"


class RiskCreate(BaseModel):
    category: str
    severity: str
    title: str
    description: str
    affected_entity: str
    recommended_action: str


class RiskUpdate(BaseModel):
    status: str  # Active, Acknowledged, Resolved
    resolution_note: Optional[str] = None
