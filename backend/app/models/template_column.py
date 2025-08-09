# backend/app/models/template_column.py
from sqlalchemy import Column, Integer, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base

class TemplateColumn(Base):
    __tablename__ = 'template_columns'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    template_id = Column(Integer, ForeignKey('sms_templates.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    position = Column(Integer, nullable=False)
    is_phone_column = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
