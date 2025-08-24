# backend/app/models/sender_id.py
from sqlalchemy import Column, Integer, Text, ForeignKey, Boolean, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship
from db.base import Base
from models.enums import SenderStatusEnum

class SenderId(Base):
    __tablename__ = 'sender_ids'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    alias = Column(Text, nullable=False)
    status = Column(Enum(SenderStatusEnum), default=SenderStatusEnum.active)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    sms_jobs = relationship("SMSJob", back_populates="sender", cascade="all, delete")
