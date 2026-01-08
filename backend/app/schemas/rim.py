from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RimBase(BaseModel):
    manufacturer: str
    model: str
    iso_size: Optional[int] = None
    erd: float
    drilling_offset: Optional[float] = 0
    outer_width: Optional[float] = None
    inner_width: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    joint_type: Optional[str] = None
    eyelet_type: Optional[str] = None
    tire_type: Optional[str] = None
    notes: Optional[str] = None


class RimCreate(RimBase):
    pass


class RimUpdate(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    iso_size: Optional[int] = None
    erd: Optional[float] = None
    drilling_offset: Optional[float] = None
    outer_width: Optional[float] = None
    inner_width: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    joint_type: Optional[str] = None
    eyelet_type: Optional[str] = None
    tire_type: Optional[str] = None
    notes: Optional[str] = None


class MeasuredBy(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class RimResponse(RimBase):
    id: int
    is_reference: bool
    measured_by: Optional[MeasuredBy] = None
    measured_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
