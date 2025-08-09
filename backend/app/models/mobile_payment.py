# backend/app/models/mobile_payment.py
from sqlalchemy import Column, Integer, Text, ForeignKey, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base

class MobilePayment(Base):
    __tablename__ = 'mobile_payments'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    order_payment_id = Column(Integer, ForeignKey('order_payments.id', ondelete='CASCADE'), nullable=False)
    gateway = Column(Text)
    merchant_request_id = Column(Text)
    checkout_request_id = Column(Text)
    transaction_reference = Column(Text)
    amount = Column(Numeric(15, 2))
    reason = Column(Text)
    paid_at = Column(DateTime, nullable=False, server_default=func.now())
