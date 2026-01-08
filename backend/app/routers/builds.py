from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import get_db
from ..models.build import Build
from ..models.user import User
from ..schemas.build import BuildCreate, BuildResponse, BuildUpdate
from ..utils.auth import get_current_user

router = APIRouter(prefix="/builds", tags=["builds"])


@router.get("", response_model=List[BuildResponse])
def list_builds(
    customer_name: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Build).options(
        joinedload(Build.rim),
        joinedload(Build.hub),
        joinedload(Build.created_by)
    )

    if customer_name:
        query = query.filter(Build.customer_name.ilike(f"%{customer_name}%"))

    query = query.order_by(Build.created_at.desc())

    return query.offset(skip).limit(limit).all()


@router.get("/{build_id}", response_model=BuildResponse)
def get_build(
    build_id: int,
    db: Session = Depends(get_db)
):
    build = db.query(Build).options(
        joinedload(Build.rim),
        joinedload(Build.hub),
        joinedload(Build.created_by)
    ).filter(Build.id == build_id).first()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    return build


@router.post("", response_model=BuildResponse)
def create_build(
    build_data: BuildCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    build = Build(
        **build_data.model_dump(),
        created_by_id=current_user.id
    )
    db.add(build)
    db.commit()
    db.refresh(build)

    # Reload with relationships
    return db.query(Build).options(
        joinedload(Build.rim),
        joinedload(Build.hub),
        joinedload(Build.created_by)
    ).filter(Build.id == build.id).first()


@router.patch("/{build_id}", response_model=BuildResponse)
def update_build(
    build_id: int,
    build_data: BuildUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    build = db.query(Build).filter(Build.id == build_id).first()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    # Only creator or admin can update
    if build.created_by_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this build"
        )

    # Update only provided fields
    update_data = build_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(build, field, value)

    db.commit()
    db.refresh(build)

    # Reload with relationships
    return db.query(Build).options(
        joinedload(Build.rim),
        joinedload(Build.hub),
        joinedload(Build.created_by)
    ).filter(Build.id == build.id).first()


@router.delete("/{build_id}")
def delete_build(
    build_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    build = db.query(Build).filter(Build.id == build_id).first()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    # Only creator or admin can delete
    if build.created_by_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this build"
        )

    db.delete(build)
    db.commit()
    return {"message": "Build deleted"}
