# backend/app/models/api_access_tokens.py
from sqlalchemy import Column, Integer, Boolean, DateTime, CHAR, ForeignKey, Index, String
from sqlalchemy.sql import func

from db.base import Base

class ApiAccessToken(Base):
    __tablename__ = 'api_access_tokens'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)              
    token_hash = Column(CHAR(64), unique=True, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, nullable=False, default=False)

# Indexes
Index('idx_api_access_tokens_user_id', ApiAccessToken.user_id)
Index('idx_api_access_tokens_token_hash', ApiAccessToken.token_hash)
Index('idx_api_access_tokens_name', ApiAccessToken.name)    
