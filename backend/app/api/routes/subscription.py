# backend/app/api/subscription.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from models.sms_package import SmsPackage
from models.package_benefit import PackageBenefit
from models.benefit import Benefit
from api.deps import get_db

router = APIRouter()
@router.get("/packages")
def get_sms_packages(db: Session = Depends(get_db)):
    # Load packages with their benefits using joins
    packages = db.query(SmsPackage).options(
        joinedload(SmsPackage.package_benefits).joinedload(PackageBenefit.benefit)
    ).all()

    result = []
    for pkg in packages:
        # Extract benefits descriptions for each package
        benefits = [pb.benefit.description for pb in pkg.package_benefits]
        result.append({
            "uuid": str(pkg.uuid),
            "name": pkg.name,
            "price_per_sms": float(pkg.price_per_sms),
            "start_sms_count": pkg.start_sms_count,
            "best_for": pkg.best_for,
            "benefits": benefits,
            "created_at": pkg.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": pkg.updated_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return {
        "success": True,
        "message": "SMS packages loaded successfully",
        "data": result
    }
