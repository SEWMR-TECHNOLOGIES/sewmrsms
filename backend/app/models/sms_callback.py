from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base
from models.enums import SmsDeliveryStatusEnum


class SmsCallback(Base):
    __tablename__ = 'sms_callbacks'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    message_id = Column(Text, nullable=False)
    phone = Column(String(15), nullable=False)
    status = Column(Enum(SmsDeliveryStatusEnum, name="sms_delivery_status"), nullable=False, default=SmsDeliveryStatusEnum.pending)
    uid = Column(Text)
    remarks = Column(Text)
    payload = Column(JSON)
    received_at = Column(DateTime, nullable=False, server_default=func.now())
    sender_alias = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
