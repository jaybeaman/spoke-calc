from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models.rim import Rim
from ..models.user import User
from ..schemas.rim import RimCreate, RimUpdate, RimResponse
from ..utils.auth import get_current_user

router = APIRouter(prefix="/rims", tags=["rims"])


@router.get("", response_model=List[RimResponse])
def list_rims(
    search: Optional[str] = None,
    manufacturer: Optional[str] = None,
    iso_size: Optional[int] = None,
    min_erd: Optional[float] = None,
    max_erd: Optional[float] = None,
    tire_type: Optional[str] = None,
    measured_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Rim)

    if search:
        query = query.filter(
            or_(
                Rim.manufacturer.ilike(f"%{search}%"),
                Rim.model.ilike(f"%{search}%")
            )
        )

    if manufacturer:
        query = query.filter(Rim.manufacturer.ilike(f"%{manufacturer}%"))

    if iso_size:
        query = query.filter(Rim.iso_size == iso_size)

    if min_erd:
        query = query.filter(Rim.erd >= min_erd)

    if max_erd:
        query = query.filter(Rim.erd <= max_erd)

    if tire_type:
        query = query.filter(Rim.tire_type == tire_type)

    if measured_only:
        query = query.filter(Rim.is_reference == False)

    # Order by: measured first, then by manufacturer/model
    query = query.order_by(Rim.is_reference.asc(), Rim.manufacturer, Rim.model)

    return query.offset(skip).limit(limit).all()


@router.get("/manufacturers", response_model=List[str])
def list_rim_manufacturers(db: Session = Depends(get_db)):
    results = db.query(Rim.manufacturer).distinct().order_by(Rim.manufacturer).all()
    return [r[0] for r in results if r[0]]


@router.get("/{rim_id}", response_model=RimResponse)
def get_rim(rim_id: int, db: Session = Depends(get_db)):
    rim = db.query(Rim).filter(Rim.id == rim_id).first()
    if not rim:
        raise HTTPException(status_code=404, detail="Rim not found")
    return rim


@router.post("", response_model=RimResponse)
def create_rim(
    rim_data: RimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rim = Rim(
        **rim_data.model_dump(),
        is_reference=False,
        measured_by_id=current_user.id,
        measured_at=datetime.utcnow()
    )
    db.add(rim)
    db.commit()
    db.refresh(rim)
    return rim


@router.put("/{rim_id}", response_model=RimResponse)
def update_rim(
    rim_id: int,
    rim_data: RimUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rim = db.query(Rim).filter(Rim.id == rim_id).first()
    if not rim:
        raise HTTPException(status_code=404, detail="Rim not found")

    # Update fields
    update_data = rim_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rim, field, value)

    # Track who updated it
    rim.measured_by_id = current_user.id
    rim.measured_at = datetime.utcnow()
    rim.is_reference = False  # Once edited, it's no longer reference data

    db.commit()
    db.refresh(rim)
    return rim


@router.delete("/{rim_id}")
def delete_rim(
    rim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rim = db.query(Rim).filter(Rim.id == rim_id).first()
    if not rim:
        raise HTTPException(status_code=404, detail="Rim not found")

    # Only admin can delete reference data
    if rim.is_reference and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only admins can delete reference data"
        )

    db.delete(rim)
    db.commit()
    return {"message": "Rim deleted"}
