# backend/app/models/sms_schedule.py
from sqlalchemy import Column, Integer, Text, ForeignKey, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base
from models.enums import ScheduleStatusEnum

class SmsSchedule(Base):
    __tablename__ = 'sms_schedules'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    sender_id = Column(Integer, ForeignKey('sender_ids.id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)
    scheduled_for = Column(DateTime, nullable=False)
    status = Column(Enum(ScheduleStatusEnum), default=ScheduleStatusEnum.pending)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
