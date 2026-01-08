from fastapi import APIRouter
from ..schemas.calculator import SpokeCalculation, SpokeResult
from ..services.spoke_calculator import calculate_full_analysis

router = APIRouter(prefix="/calculate", tags=["calculator"])


@router.post("", response_model=SpokeResult)
def calculate_spokes(calc: SpokeCalculation):
    result = calculate_full_analysis(
        erd=calc.erd,
        flange_diameter_left=calc.flange_diameter_left,
        flange_diameter_right=calc.flange_diameter_right,
        flange_offset_left=calc.flange_offset_left,
        flange_offset_right=calc.flange_offset_right,
        spoke_count=calc.spoke_count,
        cross_pattern_left=calc.cross_pattern_left,
        cross_pattern_right=calc.cross_pattern_right,
        spoke_hole_diameter=calc.spoke_hole_diameter or 2.6,
        rim_offset=calc.rim_offset or 0
    )

    return SpokeResult(**result)
