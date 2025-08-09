# backend/app/models/sender_id_propagation.py
from sqlalchemy import Column, Integer, ForeignKey, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from db.base import Base
from models.enums import PropagationStatusEnum

class SenderIdPropagation(Base):
    __tablename__ = 'sender_id_propagations'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    request_id = Column(Integer, ForeignKey('sender_id_requests.id', ondelete='CASCADE'), nullable=False)
    network_id = Column(Integer, ForeignKey('networks.id', ondelete='CASCADE'), nullable=False)
    status = Column(Enum(PropagationStatusEnum), default=PropagationStatusEnum.pending)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
