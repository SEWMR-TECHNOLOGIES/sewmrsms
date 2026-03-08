# backend/app/models/admin_activity_log.py
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship
from db.base import Base


class AdminActivityLog(Base):
    __tablename__ = 'admin_activity_logs'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    admin_id = Column(Integer, ForeignKey('admin_users.id', ondelete='CASCADE'), nullable=False)
    action = Column(Text, nullable=False)
    entity_type = Column(Text, nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    admin = relationship("AdminUser", back_populates="activity_logs")
