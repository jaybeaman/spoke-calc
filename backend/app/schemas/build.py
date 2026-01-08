from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .rim import RimResponse
from .hub import HubResponse


class BuildCreate(BaseModel):
    rim_id: int
    hub_id: int
    spoke_count: int
    cross_pattern_left: int
    cross_pattern_right: int
    spoke_length_left: float
    spoke_length_right: float
    tension_percent_left: Optional[float] = None
    tension_percent_right: Optional[float] = None
    bracing_angle_left: Optional[float] = None
    bracing_angle_right: Optional[float] = None
    wrap_angle_left: Optional[float] = None
    wrap_angle_right: Optional[float] = None
    total_angle_left: Optional[float] = None
    total_angle_right: Optional[float] = None
    theta_angle_left: Optional[float] = None
    theta_angle_right: Optional[float] = None
    customer_name: Optional[str] = None
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None


class BuildUpdate(BaseModel):
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None


class CreatedBy(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class BuildResponse(BaseModel):
    id: int
    rim: RimResponse
    hub: HubResponse
    spoke_count: int
    cross_pattern_left: int
    cross_pattern_right: int
    spoke_length_left: float
    spoke_length_right: float
    tension_percent_left: Optional[float] = None
    tension_percent_right: Optional[float] = None
    bracing_angle_left: Optional[float] = None
    bracing_angle_right: Optional[float] = None
    wrap_angle_left: Optional[float] = None
    wrap_angle_right: Optional[float] = None
    total_angle_left: Optional[float] = None
    total_angle_right: Optional[float] = None
    theta_angle_left: Optional[float] = None
    theta_angle_right: Optional[float] = None
    customer_name: Optional[str] = None
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    created_by: CreatedBy
    created_at: datetime

    class Config:
        from_attributes = True
