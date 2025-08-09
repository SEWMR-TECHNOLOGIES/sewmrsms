# backend/app/models/subscription_order.py
from sqlalchemy import Column, Integer, Numeric, ForeignKey, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base
from models.enums import PaymentStatusEnum

class SubscriptionOrder(Base):
    __tablename__ = 'subscription_orders'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    package_id = Column(Integer, ForeignKey('sms_packages.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    total_sms = Column(Integer, nullable=False)
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
