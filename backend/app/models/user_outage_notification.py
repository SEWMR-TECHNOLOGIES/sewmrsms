# backend/app/models/user_outage_notification.py
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship
from db.base import Base

class UserOutageNotification(Base):
    __tablename__ = 'user_outage_notifications'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)

    # Reference to the user
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Contact info
    phone = Column(Text, nullable=False)
    email = Column(Text, nullable=False)

    # Number of messages before outage
    notify_before_messages = Column(Integer, nullable=False, default=1)

    # Timestamp of the last notification sent
    last_notified_at = Column(DateTime, nullable=True)

    # Optional: count of notifications sent for this threshold
    notification_count = Column(Integer, nullable=False, default=0)

    # Timestamps
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="outage_notifications")
