from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, Text, Numeric, Enum, Boolean, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum
import uuid

Base = declarative_base()

# Enums
class PaymentMethodEnum(enum.Enum):
    bank = 'bank'
    mobile = 'mobile'
    card = 'card'
    cash = 'cash'
    other = 'other'

class PaymentStatusEnum(enum.Enum):
    pending = 'pending'
    completed = 'completed'
    failed = 'failed'
    cancelled = 'cancelled'

class SenderStatusEnum(enum.Enum):
    active = 'active'
    inactive = 'inactive'
    pending = 'pending'

class SenderIdRequestStatusEnum(enum.Enum):
    pending = 'pending'
    approved = 'approved'
    rejected = 'rejected'

class PropagationStatusEnum(enum.Enum):
    pending = 'pending'
    propagated = 'propagated'
    failed = 'failed'

class SubscriptionStatusEnum(enum.Enum):
    active = 'active'
    inactive = 'inactive'
    cancelled = 'cancelled'
    expired = 'expired'

class ScheduleStatusEnum(enum.Enum):
    pending = 'pending'
    sent = 'sent'
    failed = 'failed'
    cancelled = 'cancelled'

class MessageStatusEnum(enum.Enum):
    pending = 'pending'
    sent = 'sent'
    failed = 'failed'

# Models

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False)
    username = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text)
    phone = Column(String(20))
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class ContactGroup(Base):
    __tablename__ = 'contact_groups'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class Contact(Base):
    __tablename__ = 'contacts'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text)
    phone = Column(String(15), nullable=False)
    email = Column(Text)
    group_id = Column(Integer, ForeignKey('contact_groups.id', ondelete='SET NULL'), nullable=True)
    is_blacklisted = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class Network(Base):
    __tablename__ = 'networks'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    color_code = Column(String(7), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class Benefit(Base):
    __tablename__ = 'benefits'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class SmsPackage(Base):
    __tablename__ = 'sms_packages'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    price_per_sms = Column(Numeric(10, 2), nullable=False)
    start_sms_count = Column(Integer, nullable=False)
    best_for = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class PackageBenefit(Base):
    __tablename__ = 'package_benefits'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    package_id = Column(Integer, ForeignKey('sms_packages.id', ondelete='CASCADE'), nullable=False)
    benefit_id = Column(Integer, ForeignKey('benefits.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class OrderPayment(Base):
    __tablename__ = 'order_payments'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    order_id = Column(Integer, ForeignKey('subscription_orders.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    method = Column(Enum(PaymentMethodEnum), nullable=False)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    paid_at = Column(DateTime, nullable=False, server_default=func.now())


class BankPayment(Base):
    __tablename__ = 'bank_payments'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    order_payment_id = Column(Integer, ForeignKey('order_payments.id', ondelete='CASCADE'), nullable=False)
    bank_name = Column(Text, nullable=False)
    transaction_reference = Column(Text)
    slip_path = Column(Text, nullable=False)
    paid_at = Column(DateTime, nullable=False, server_default=func.now())


class MobilePayment(Base):
    __tablename__ = 'mobile_payments'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    order_payment_id = Column(Integer, ForeignKey('order_payments.id', ondelete='CASCADE'), nullable=False)
    gateway = Column(Text)
    merchant_request_id = Column(Text)
    checkout_request_id = Column(Text)
    transaction_reference = Column(Text)
    amount = Column(Numeric(15, 2))
    reason = Column(Text)
    paid_at = Column(DateTime, nullable=False, server_default=func.now())


class SenderId(Base):
    __tablename__ = 'sender_ids'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    alias = Column(Text, nullable=False)  # the sender ID name/label
    is_third_party = Column(Boolean, nullable=False, default=False)
    status = Column(Enum(SenderStatusEnum), default=SenderStatusEnum.active)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


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
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class SenderIdPropagation(Base):
    __tablename__ = 'sender_id_propagations'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    request_id = Column(Integer, ForeignKey('sender_id_requests.id', ondelete='CASCADE'), nullable=False)
    network_id = Column(Integer, ForeignKey('networks.id', ondelete='CASCADE'), nullable=False)
    status = Column(Enum(PropagationStatusEnum), default=PropagationStatusEnum.pending)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class SubscriptionOrder(Base):
    __tablename__ = 'subscription_orders'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    package_id = Column(Integer, ForeignKey('sms_packages.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    total_sms = Column(Integer, nullable=False)
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class UserSubscription(Base):
    __tablename__ = 'user_subscriptions'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    total_sms = Column(Integer, nullable=False)
    used_sms = Column(Integer, default=0)
    remaining_sms = Column(Integer)  # calculated in DB with GENERATED ALWAYS, not handled here
    status = Column(Enum(SubscriptionStatusEnum), default=SubscriptionStatusEnum.active)
    subscribed_at = Column(DateTime, nullable=False, server_default=func.now())


class SmsTemplate(Base):
    __tablename__ = 'sms_templates'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    sample_message = Column(Text, nullable=False)
    column_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


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


class SmsMessage(Base):
    __tablename__ = 'sms_messages'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    sender_alias = Column(String(11), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    sent_at = Column(DateTime, nullable=False, server_default=func.now())


class SmsCallback(Base):
    __tablename__ = 'sms_callbacks'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    message_id = Column(Text, nullable=False)
    phone = Column(String(15), nullable=False)
    status = Column(Text)
    uid = Column(Text)
    remarks = Column(Text)
    payload = Column(JSON)
    received_at = Column(DateTime, nullable=False, server_default=func.now())
    sender_alias = Column(Text)


class SmsSchedule(Base):
    __tablename__ = 'sms_schedules'

    id = Column(Integer, primary_key=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    sender_id = Column(Integer, ForeignKey('sender_ids.id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)
    scheduled_for = Column(DateTime, nullable=False)
    status = Column(Enum(ScheduleStatusEnum), default=ScheduleStatusEnum.pending)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class SmsScheduledMessage(Base):
    __tablename__ = 'scheduled_messages'

    id = Column(Integer, primary_key=True)
    schedule_id = Column(Integer, ForeignKey('sms_schedules.id', ondelete='CASCADE'), nullable=False)
    phone_number = Column(String(15), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(MessageStatusEnum), default=MessageStatusEnum.pending)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
