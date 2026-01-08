from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Rim(Base):
    __tablename__ = "rims"

    id = Column(Integer, primary_key=True, index=True)
    manufacturer = Column(String, index=True, nullable=False)
    model = Column(String, index=True, nullable=False)

    # Core specs for spoke calculation
    iso_size = Column(Integer, index=True)  # e.g., 622 for 700c
    erd = Column(Float, nullable=False)  # Effective Rim Diameter in mm
    drilling_offset = Column(Float, default=0)  # Offset drilling in mm

    # Additional specs
    outer_width = Column(Float)
    inner_width = Column(Float)
    height = Column(Float)
    weight = Column(Float)  # in grams

    # Characteristics
    joint_type = Column(String)  # pinned, welded, seamless, sleeved
    eyelet_type = Column(String)  # none, single, double
    tire_type = Column(String)  # clincher, tubeless, tubular

    # Provenance
    is_reference = Column(Boolean, default=False)  # True = from Freespoke
    measured_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    measured_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    measured_by = relationship("User", back_populates="measured_rims")
    builds = relationship("Build", back_populates="rim")
