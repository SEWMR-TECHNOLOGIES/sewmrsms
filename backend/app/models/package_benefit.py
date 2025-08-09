from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship

from db.base import Base
from models.benefit import Benefit

class PackageBenefit(Base):
    __tablename__ = 'package_benefits'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    package_id = Column(Integer, ForeignKey('sms_packages.id', ondelete='CASCADE'), nullable=False)
    benefit_id = Column(Integer, ForeignKey('benefits.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    package = relationship("SmsPackage", back_populates="package_benefits")
    benefit = relationship("Benefit")
