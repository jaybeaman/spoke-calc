from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Hub(Base):
    __tablename__ = "hubs"

    id = Column(Integer, primary_key=True, index=True)
    manufacturer = Column(String, index=True, nullable=False)
    model = Column(String, index=True, nullable=False)

    # Position and type
    position = Column(String, index=True)  # front, rear

    # Axle specs
    oln = Column(Float)  # Over Locknut distance in mm
    axle_type = Column(String)  # QR, 12mm thru, 15mm thru, etc.

    # Brake and drive
    brake_type = Column(String)  # rim, disc-6bolt, centerlock, coaster, drum
    drive_interface = Column(String)  # shimano-hg, shimano-ms, campagnolo, sram-xd, etc.

    # Flange measurements (critical for spoke calc)
    flange_diameter_left = Column(Float)  # PCD left in mm
    flange_diameter_right = Column(Float)  # PCD right in mm
    flange_offset_left = Column(Float)  # Center to left flange in mm
    flange_offset_right = Column(Float)  # Center to right flange in mm

    # Spoke specs
    spoke_hole_diameter = Column(Float, default=2.6)  # Usually 2.4 or 2.6mm
    spoke_count = Column(Integer)
    spoke_interface = Column(String)  # j-bend, straight-pull

    # Other
    weight = Column(Float)  # in grams
    internal_gearing = Column(String)  # for IGH hubs
    generator_type = Column(String)  # for dynamo hubs

    # Provenance
    is_reference = Column(Boolean, default=False)  # True = from Freespoke
    measured_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    measured_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    measured_by = relationship("User", back_populates="measured_hubs")
    builds = relationship("Build", back_populates="hub")
