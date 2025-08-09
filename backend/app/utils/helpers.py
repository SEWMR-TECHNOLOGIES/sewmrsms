# backend/app/utils/helpers.py
from sqlalchemy.orm import Session
from models.sms_package import SmsPackage

def get_package_by_sms_count(db: Session, sms_count: int) -> SmsPackage | None:
    return (
        db.query(SmsPackage)
        .filter(SmsPackage.start_sms_count <= sms_count)
        .order_by(SmsPackage.start_sms_count.desc())
        .first()
    )
