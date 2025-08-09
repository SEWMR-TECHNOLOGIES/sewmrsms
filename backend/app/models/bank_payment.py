# backend/app/models/bank_payment.py
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from backend.app.db.base import Base

class BankPayment(Base):
    __tablename__ = 'bank_payments'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    order_payment_id = Column(Integer, ForeignKey('order_payments.id', ondelete='CASCADE'), nullable=False)
    bank_name = Column(Text, nullable=False)
    transaction_reference = Column(Text)
    slip_path = Column(Text, nullable=False)
    paid_at = Column(DateTime, nullable=False, server_default=func.now())
