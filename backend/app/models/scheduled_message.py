# backend/app/models/scheduled_message.py
from sqlalchemy import Column, Integer, Text, ForeignKey, Enum, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from backend.app.db.base import Base
from backend.app.models.enums import MessageStatusEnum

class SmsScheduledMessage(Base):
    __tablename__ = 'scheduled_messages'

    id = Column(Integer, primary_key=True)
    schedule_id = Column(Integer, ForeignKey('sms_schedules.id', ondelete='CASCADE'), nullable=False)
    phone_number = Column(String(15), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(MessageStatusEnum), default=MessageStatusEnum.pending)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
