# backend/app/models/sender_id_request.py
from sqlalchemy import Boolean, Column, Integer, Text, String, ForeignKey, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base
from models.enums import SenderIdRequestStatusEnum

class SenderIdRequest(Base):
    __tablename__ = 'sender_id_requests'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    sender_alias = Column(String(11), nullable=False)
    document_path = Column(Text)
    status = Column(Enum(SenderIdRequestStatusEnum), default=SenderIdRequestStatusEnum.pending)
    sample_message = Column(Text)
    company_name = Column(Text)
    remarks = Column(Text, nullable=True)
    is_student_request = Column(Boolean, nullable=False, default=False)
    student_id_path = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
