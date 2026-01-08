from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Build(Base):
    __tablename__ = "builds"

    id = Column(Integer, primary_key=True, index=True)

    # Components
    rim_id = Column(Integer, ForeignKey("rims.id"), nullable=False)
    hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=False)

    # Build parameters
    spoke_count = Column(Integer, nullable=False)
    cross_pattern_left = Column(Integer, nullable=False)  # 0, 1, 2, 3, 4
    cross_pattern_right = Column(Integer, nullable=False)

    # Calculated results
    spoke_length_left = Column(Float, nullable=False)
    spoke_length_right = Column(Float, nullable=False)

    # Analysis data
    tension_percent_left = Column(Float)
    tension_percent_right = Column(Float)
    bracing_angle_left = Column(Float)
    bracing_angle_right = Column(Float)
    wrap_angle_left = Column(Float)
    wrap_angle_right = Column(Float)
    total_angle_left = Column(Float)
    total_angle_right = Column(Float)
    theta_angle_left = Column(Float)
    theta_angle_right = Column(Float)

    # Customer info
    customer_name = Column(String)
    customer_notes = Column(Text)  # Notes for the customer
    internal_notes = Column(Text)  # Internal shop notes

    # Metadata
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    rim = relationship("Rim", back_populates="builds")
    hub = relationship("Hub", back_populates="builds")
    created_by = relationship("User", back_populates="builds")
