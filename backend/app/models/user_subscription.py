# backend/app/models/user_subscription.py
from sqlalchemy import Column, Computed, Integer, ForeignKey, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base
from models.enums import SubscriptionStatusEnum

class UserSubscription(Base):
    __tablename__ = 'user_subscriptions'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    total_sms = Column(Integer, nullable=False)
    used_sms = Column(Integer, default=0)
    remaining_sms = Column(Integer, Computed('total_sms - used_sms'), nullable=False)
    status = Column(Enum(SubscriptionStatusEnum), default=SubscriptionStatusEnum.active)
    subscribed_at = Column(DateTime, nullable=False, server_default=func.now())
