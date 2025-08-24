# backend/app/models/user.py
from sqlalchemy import Column, Integer, Text, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship
from db.base import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False)
    username = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    first_name = Column(Text, nullable=False)   
    last_name = Column(Text, nullable=False)
    phone = Column(String(20))
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    sms_jobs = relationship("SMSJob", back_populates="user", cascade="all, delete")
