from pydantic import BaseModel
from typing import Optional


class SpokeCalculation(BaseModel):
    # Rim
    erd: float  # Effective Rim Diameter in mm
    rim_offset: Optional[float] = 0  # Drilling offset

    # Hub - left side
    flange_diameter_left: float  # PCD in mm
    flange_offset_left: float  # Center to flange in mm

    # Hub - right side
    flange_diameter_right: float
    flange_offset_right: float

    # Spoke hole
    spoke_hole_diameter: Optional[float] = 2.6

    # Build params
    spoke_count: int
    cross_pattern_left: int  # 0 = radial, 1, 2, 3, 4
    cross_pattern_right: int


class SpokeResult(BaseModel):
    spoke_length_left: float
    spoke_length_right: float
    spoke_length_left_rounded: float  # Rounded to nearest available length
    spoke_length_right_rounded: float
    tension_percent_left: float  # Tension distribution percentage
    tension_percent_right: float
    bracing_angle_left: float  # Degrees
    bracing_angle_right: float
    wrap_angle_left: float  # Degrees
    wrap_angle_right: float
    total_angle_left: float  # Bracing + wrap
    total_angle_right: float
    theta_angle_left: float  # Hub angle
    theta_angle_right: float
