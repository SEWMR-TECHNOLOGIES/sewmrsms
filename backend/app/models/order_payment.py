# backend/app/models/order_payment.py
from sqlalchemy import Column, Integer, Numeric, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base
from models.enums import PaymentMethodEnum, PaymentStatusEnum

class OrderPayment(Base):
    __tablename__ = 'order_payments'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    order_id = Column(Integer, ForeignKey('subscription_orders.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    method = Column(Enum(PaymentMethodEnum), nullable=False)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    paid_at = Column(DateTime, nullable=False, server_default=func.now())
