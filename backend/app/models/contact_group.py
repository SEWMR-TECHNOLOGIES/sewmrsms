# backend/app/models/contact_group.py
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base

class ContactGroup(Base):
    __tablename__ = 'contact_groups'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)  # added
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
