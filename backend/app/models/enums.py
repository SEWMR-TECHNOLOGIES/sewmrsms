# backend/app/models/enums.py

import enum

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
    in_review = 'in_review'

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
    partial = 'partial'

class MessageStatusEnum(enum.Enum):
    pending = 'pending'
    sent = 'sent'
    failed = 'failed'
class SmsDeliveryStatusEnum(enum.Enum):
    pending = "pending"
    delivered = "delivered"
    undeliverable = "undeliverable"
    acknowledged = "acknowledged"
    expired = "expired"
    accepted = "accepted"
    rejected = "rejected"
    unknown = "unknown"
    failed = "failed"
    dnd = "dnd"

