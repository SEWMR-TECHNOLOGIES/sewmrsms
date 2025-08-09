# backend/app/models/sms_package.py
from sqlalchemy import Column, Integer, Text, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship

from db.base import Base

class SmsPackage(Base):
    __tablename__ = 'sms_packages'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    price_per_sms = Column(Numeric(10, 2), nullable=False)
    start_sms_count = Column(Integer, nullable=False)
    best_for = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    package_benefits = relationship("PackageBenefit", back_populates="package", cascade="all, delete-orphan")
