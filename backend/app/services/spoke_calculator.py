import math
from typing import Tuple, Dict, Any


def calculate_spoke_length(
    erd: float,
    flange_diameter: float,
    flange_offset: float,
    spoke_count: int,
    cross_pattern: int,
    spoke_hole_diameter: float = 2.6,
    rim_offset: float = 0
) -> float:
    """
    Calculate spoke length using the standard formula.

    Args:
        erd: Effective Rim Diameter in mm
        flange_diameter: Hub flange PCD (Pitch Circle Diameter) in mm
        flange_offset: Distance from hub center to flange in mm
        spoke_count: Total number of spokes
        cross_pattern: Number of crosses (0 = radial, 1, 2, 3, 4)
        spoke_hole_diameter: Diameter of spoke holes in hub flange (mm)
        rim_offset: Drilling offset of rim (mm)

    Returns:
        Spoke length in mm
    """
    # Rim radius (half of ERD)
    r = erd / 2

    # Flange radius (half of PCD)
    f = flange_diameter / 2

    # Adjusted flange offset (account for rim offset)
    o = flange_offset + rim_offset

    # Spokes per side
    spokes_per_side = spoke_count / 2

    # Angle between adjacent spoke holes on hub (in radians)
    # Cross pattern determines the angle offset
    if cross_pattern == 0:
        # Radial lacing - spoke goes straight from hub to nearest rim hole
        angle = 0
    else:
        # Cross lacing - angle based on how many holes the spoke crosses
        angle = (2 * math.pi * cross_pattern) / spokes_per_side

    # Standard spoke length formula:
    # L = sqrt(R² + F² + O² - 2*R*F*cos(A)) - d/2
    # where d is the spoke hole diameter (accounts for elbow)

    spoke_length = math.sqrt(
        r**2 + f**2 + o**2 - 2 * r * f * math.cos(angle)
    ) - (spoke_hole_diameter / 2)

    return spoke_length


def calculate_both_sides(
    erd: float,
    flange_diameter_left: float,
    flange_diameter_right: float,
    flange_offset_left: float,
    flange_offset_right: float,
    spoke_count: int,
    cross_pattern_left: int,
    cross_pattern_right: int,
    spoke_hole_diameter: float = 2.6,
    rim_offset: float = 0
) -> Tuple[float, float]:
    """
    Calculate spoke lengths for both sides of the wheel.

    Returns:
        Tuple of (left_length, right_length) in mm
    """
    left = calculate_spoke_length(
        erd=erd,
        flange_diameter=flange_diameter_left,
        flange_offset=flange_offset_left,
        spoke_count=spoke_count,
        cross_pattern=cross_pattern_left,
        spoke_hole_diameter=spoke_hole_diameter,
        rim_offset=rim_offset
    )

    right = calculate_spoke_length(
        erd=erd,
        flange_diameter=flange_diameter_right,
        flange_offset=flange_offset_right,
        spoke_count=spoke_count,
        cross_pattern=cross_pattern_right,
        spoke_hole_diameter=spoke_hole_diameter,
        rim_offset=-rim_offset  # Opposite direction for right side
    )

    return (left, right)


def round_to_available_length(length: float) -> float:
    """
    Round spoke length to nearest commonly available size.
    Spokes are typically available in 2mm increments.
    Some builders prefer to round down for slight tension flexibility.
    """
    # Round to nearest even number (2mm increments)
    return round(length / 2) * 2


def calculate_bracing_angle(erd: float, flange_offset: float) -> float:
    """
    Calculate the bracing angle - angle between spoke and hub axle plane.
    Higher angles = stiffer wheel laterally.
    """
    rim_radius = erd / 2
    # Bracing angle is arctan(offset / rim_radius)
    angle_rad = math.atan(flange_offset / rim_radius)
    return math.degrees(angle_rad)


def calculate_tension_distribution(flange_offset_left: float, flange_offset_right: float) -> Tuple[float, float]:
    """
    Calculate tension distribution between left and right sides.
    For a dished wheel (rear), the side with less offset needs more tension.
    Returns percentages normalized where the higher-offset side is 100%.
    """
    if flange_offset_left == 0 and flange_offset_right == 0:
        return (100.0, 100.0)

    # Tension is inversely proportional to offset for equal lateral stiffness
    # The side with smaller offset needs higher tension
    total = flange_offset_left + flange_offset_right
    if total == 0:
        return (100.0, 100.0)

    # Calculate relative tensions (smaller offset = higher tension needed)
    # Normalize so the max is 100%
    left_tension = flange_offset_right / total * 200  # *200 because total/offset gives ratio
    right_tension = flange_offset_left / total * 200

    # Normalize to percentage where larger offset side = 100%
    max_tension = max(left_tension, right_tension)
    if max_tension > 0:
        left_pct = (left_tension / max_tension) * 100
        right_pct = (right_tension / max_tension) * 100
    else:
        left_pct = 100.0
        right_pct = 100.0

    return (round(left_pct, 1), round(right_pct, 1))


def calculate_wrap_angle(flange_diameter: float, spoke_hole_diameter: float, spoke_count: int, cross_pattern: int) -> float:
    """
    Calculate the wrap angle at the rim - angle the spoke makes as it wraps around the flange.
    Only relevant for tangent (crossed) lacing, 0 for radial.
    """
    if cross_pattern == 0:
        return 0.0

    spokes_per_side = spoke_count / 2
    flange_radius = flange_diameter / 2

    # Angle between spoke holes on one side
    hole_angle = 360 / spokes_per_side

    # For crossed lacing, the spoke wraps around by (cross * hole_angle)
    # The wrap angle depends on how much the spoke deviates from radial
    wrap = (cross_pattern * hole_angle) / 2
    return round(wrap, 1)


def calculate_theta_angle(erd: float, flange_diameter: float, spoke_count: int, cross_pattern: int) -> float:
    """
    Calculate theta angle - the angle at the hub between radial line and spoke.
    """
    if cross_pattern == 0:
        return 0.0

    spokes_per_side = spoke_count / 2
    rim_radius = erd / 2
    flange_radius = flange_diameter / 2

    # Theta is based on the cross pattern and geometry
    theta_rad = (2 * math.pi * cross_pattern) / spokes_per_side
    return round(math.degrees(theta_rad), 1)


def calculate_full_analysis(
    erd: float,
    flange_diameter_left: float,
    flange_diameter_right: float,
    flange_offset_left: float,
    flange_offset_right: float,
    spoke_count: int,
    cross_pattern_left: int,
    cross_pattern_right: int,
    spoke_hole_diameter: float = 2.6,
    rim_offset: float = 0
) -> Dict[str, Any]:
    """
    Calculate complete spoke analysis including all derived metrics.
    """
    # Basic spoke lengths
    left_length, right_length = calculate_both_sides(
        erd=erd,
        flange_diameter_left=flange_diameter_left,
        flange_diameter_right=flange_diameter_right,
        flange_offset_left=flange_offset_left,
        flange_offset_right=flange_offset_right,
        spoke_count=spoke_count,
        cross_pattern_left=cross_pattern_left,
        cross_pattern_right=cross_pattern_right,
        spoke_hole_diameter=spoke_hole_diameter,
        rim_offset=rim_offset
    )

    # Bracing angles
    bracing_angle_left = calculate_bracing_angle(erd, flange_offset_left)
    bracing_angle_right = calculate_bracing_angle(erd, flange_offset_right)

    # Tension distribution
    tension_left, tension_right = calculate_tension_distribution(flange_offset_left, flange_offset_right)

    # Wrap angles
    wrap_angle_left = calculate_wrap_angle(flange_diameter_left, spoke_hole_diameter, spoke_count, cross_pattern_left)
    wrap_angle_right = calculate_wrap_angle(flange_diameter_right, spoke_hole_diameter, spoke_count, cross_pattern_right)

    # Theta angles
    theta_angle_left = calculate_theta_angle(erd, flange_diameter_left, spoke_count, cross_pattern_left)
    theta_angle_right = calculate_theta_angle(erd, flange_diameter_right, spoke_count, cross_pattern_right)

    # Total angle at rim (bracing + wrap for tangent spokes)
    total_angle_left = round(bracing_angle_left + wrap_angle_left, 1)
    total_angle_right = round(bracing_angle_right + wrap_angle_right, 1)

    return {
        "spoke_length_left": round(left_length, 1),
        "spoke_length_right": round(right_length, 1),
        "spoke_length_left_rounded": round_to_available_length(left_length),
        "spoke_length_right_rounded": round_to_available_length(right_length),
        "tension_percent_left": tension_left,
        "tension_percent_right": tension_right,
        "bracing_angle_left": round(bracing_angle_left, 1),
        "bracing_angle_right": round(bracing_angle_right, 1),
        "wrap_angle_left": wrap_angle_left,
        "wrap_angle_right": wrap_angle_right,
        "total_angle_left": total_angle_left,
        "total_angle_right": total_angle_right,
        "theta_angle_left": theta_angle_left,
        "theta_angle_right": theta_angle_right,
    }
