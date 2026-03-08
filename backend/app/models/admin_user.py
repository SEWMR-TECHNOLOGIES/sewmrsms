# backend/app/models/admin_user.py
from sqlalchemy import Column, Integer, Text, String, DateTime, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from sqlalchemy.orm import relationship
from db.base import Base


class AdminRoleEnum(enum.Enum):
    superadmin = 'superadmin'
    admin = 'admin'
    moderator = 'moderator'


class AdminUser(Base):
    __tablename__ = 'admin_users'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False)
    username = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    first_name = Column(Text, nullable=False, default='')
    last_name = Column(Text, nullable=False, default='')
    role = Column(Enum(AdminRoleEnum), nullable=False, default=AdminRoleEnum.admin)
    is_active = Column(Boolean, nullable=False, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    activity_logs = relationship("AdminActivityLog", back_populates="admin", cascade="all, delete-orphan")
