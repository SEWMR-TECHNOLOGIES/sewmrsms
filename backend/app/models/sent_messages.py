# backend/app/models/sms_message.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship

from db.base import Base

class SentMessage(Base):
    __tablename__ = 'sent_messages'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    sender_alias = Column(String(11), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    phone_number = Column(String(15), nullable=False)
    message = Column(Text, nullable=False)
    message_id = Column(String(100), nullable=True)     # aggregator message ID
    remarks = Column(Text, nullable=True)               # error messages or notes
    number_of_parts = Column(Integer, nullable=False, default=1)
    sent_at = Column(DateTime, nullable=False, server_default=func.now())
    # Relationship
    callbacks = relationship("SmsCallback", back_populates="sent_message", cascade="all, delete-orphan")


