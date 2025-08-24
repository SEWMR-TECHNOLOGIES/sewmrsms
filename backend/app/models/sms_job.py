# backend/app/models/sms_job.py
from sqlalchemy import (
    Column, Integer, Text, String, ForeignKey, DateTime, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from models.enums import MessageStatusEnum
from db.base import Base


class SMSJob(Base):
    __tablename__ = "sms_jobs"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("sender_ids.id", ondelete="CASCADE"), nullable=False)

    phone_number = Column(String(15), nullable=False)
    message = Column(Text, nullable=False)

    status = Column(Enum(MessageStatusEnum), nullable=False, default=MessageStatusEnum.pending)
    retries = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)

    scheduled_for = Column(DateTime, nullable=True)   # NULL means "send immediately"
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships (optional but useful)
    user = relationship("User", back_populates="sms_jobs")
    sender = relationship("SenderId", back_populates="sms_jobs")
