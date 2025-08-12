# backend/app/models/password_reset_token.py
from sqlalchemy import Column, Index, Integer, ForeignKey, Boolean, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid

from db.base import Base

class PasswordResetToken(Base):
    __tablename__ = 'password_reset_tokens'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False)  # store SHA256 hash
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)

Index('idx_password_reset_tokens_user_id', PasswordResetToken.user_id)
Index('idx_password_reset_tokens_token_hash', PasswordResetToken.token_hash)
