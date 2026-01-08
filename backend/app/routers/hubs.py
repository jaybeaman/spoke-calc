from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models.hub import Hub
from ..models.user import User
from ..schemas.hub import HubCreate, HubUpdate, HubResponse
from ..utils.auth import get_current_user

router = APIRouter(prefix="/hubs", tags=["hubs"])


@router.get("", response_model=List[HubResponse])
def list_hubs(
    search: Optional[str] = None,
    manufacturer: Optional[str] = None,
    position: Optional[str] = None,
    brake_type: Optional[str] = None,
    spoke_count: Optional[int] = None,
    axle_type: Optional[str] = None,
    measured_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Hub)

    if search:
        query = query.filter(
            or_(
                Hub.manufacturer.ilike(f"%{search}%"),
                Hub.model.ilike(f"%{search}%")
            )
        )

    if manufacturer:
        query = query.filter(Hub.manufacturer.ilike(f"%{manufacturer}%"))

    if position:
        query = query.filter(Hub.position == position)

    if brake_type:
        query = query.filter(Hub.brake_type == brake_type)

    if spoke_count:
        query = query.filter(Hub.spoke_count == spoke_count)

    if axle_type:
        query = query.filter(Hub.axle_type.ilike(f"%{axle_type}%"))

    if measured_only:
        query = query.filter(Hub.is_reference == False)

    # Order by: measured first, then by manufacturer/model
    query = query.order_by(Hub.is_reference.asc(), Hub.manufacturer, Hub.model)

    return query.offset(skip).limit(limit).all()


@router.get("/manufacturers", response_model=List[str])
def list_hub_manufacturers(db: Session = Depends(get_db)):
    results = db.query(Hub.manufacturer).distinct().order_by(Hub.manufacturer).all()
    return [r[0] for r in results if r[0]]


@router.get("/{hub_id}", response_model=HubResponse)
def get_hub(hub_id: int, db: Session = Depends(get_db)):
    hub = db.query(Hub).filter(Hub.id == hub_id).first()
    if not hub:
        raise HTTPException(status_code=404, detail="Hub not found")
    return hub


@router.post("", response_model=HubResponse)
def create_hub(
    hub_data: HubCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hub = Hub(
        **hub_data.model_dump(),
        is_reference=False,
        measured_by_id=current_user.id,
        measured_at=datetime.utcnow()
    )
    db.add(hub)
    db.commit()
    db.refresh(hub)
    return hub


@router.put("/{hub_id}", response_model=HubResponse)
def update_hub(
    hub_id: int,
    hub_data: HubUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hub = db.query(Hub).filter(Hub.id == hub_id).first()
    if not hub:
        raise HTTPException(status_code=404, detail="Hub not found")

    # Update fields
    update_data = hub_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hub, field, value)

    # Track who updated it
    hub.measured_by_id = current_user.id
    hub.measured_at = datetime.utcnow()
    hub.is_reference = False  # Once edited, it's no longer reference data

    db.commit()
    db.refresh(hub)
    return hub


@router.delete("/{hub_id}")
def delete_hub(
    hub_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hub = db.query(Hub).filter(Hub.id == hub_id).first()
    if not hub:
        raise HTTPException(status_code=404, detail="Hub not found")

    # Only admin can delete reference data
    if hub.is_reference and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only admins can delete reference data"
        )

    db.delete(hub)
    db.commit()
    return {"message": "Hub deleted"}
