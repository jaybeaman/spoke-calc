from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HubBase(BaseModel):
    manufacturer: str
    model: str
    position: Optional[str] = None
    oln: Optional[float] = None
    axle_type: Optional[str] = None
    brake_type: Optional[str] = None
    drive_interface: Optional[str] = None
    flange_diameter_left: float
    flange_diameter_right: float
    flange_offset_left: float
    flange_offset_right: float
    spoke_hole_diameter: Optional[float] = 2.6
    spoke_count: Optional[int] = None
    spoke_interface: Optional[str] = None
    weight: Optional[float] = None
    internal_gearing: Optional[str] = None
    generator_type: Optional[str] = None
    notes: Optional[str] = None


class HubCreate(HubBase):
    pass


class HubUpdate(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    position: Optional[str] = None
    oln: Optional[float] = None
    axle_type: Optional[str] = None
    brake_type: Optional[str] = None
    drive_interface: Optional[str] = None
    flange_diameter_left: Optional[float] = None
    flange_diameter_right: Optional[float] = None
    flange_offset_left: Optional[float] = None
    flange_offset_right: Optional[float] = None
    spoke_hole_diameter: Optional[float] = None
    spoke_count: Optional[int] = None
    spoke_interface: Optional[str] = None
    weight: Optional[float] = None
    internal_gearing: Optional[str] = None
    generator_type: Optional[str] = None
    notes: Optional[str] = None


class MeasuredBy(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class HubResponse(HubBase):
    id: int
    is_reference: bool
    measured_by: Optional[MeasuredBy] = None
    measured_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
