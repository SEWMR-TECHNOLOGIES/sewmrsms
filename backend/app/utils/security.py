import hashlib
import hmac
import os
import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import pytz
from models.api_access_tokens import ApiAccessToken
from models.user import User
from core.config import JWT_SECRET
# Use a strong random salt length
SALT_LENGTH = 16

class Hasher:
    @staticmethod
    def hash_password(password: str) -> str:
        salt = os.urandom(SALT_LENGTH)
        hashed = hashlib.pbkdf2_hmac(
            'sha256',  # algorithm
            password.encode('utf-8'),
            salt,
            100000  # iterations
        )
        return salt.hex() + ":" + hashed.hex()

    @staticmethod
    def verify_password(plain_password: str, stored_hash: str) -> bool:
        try:
            salt_hex, hash_hex = stored_hash.split(":")
            salt = bytes.fromhex(salt_hex)
            stored_bytes = bytes.fromhex(hash_hex)
            new_hash = hashlib.pbkdf2_hmac(
                'sha256',
                plain_password.encode('utf-8'),
                salt,
                100000
            )
            return hmac.compare_digest(stored_bytes, new_hash)
        except Exception:
            return False

# JWT settings
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")

def verify_api_token(db: Session, raw_token: str) -> User | None:
    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    token_obj = db.query(ApiAccessToken).filter_by(
        token_hash=token_hash,
        revoked=False
    ).first()

    if not token_obj:
        return None

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    # Extend by 1 day if it's a different day than last_used
    if not token_obj.last_used or token_obj.last_used.date() != now.date():
        if token_obj.expires_at:
            token_obj.expires_at += timedelta(days=1)
        else:
            token_obj.expires_at = now + timedelta(days=1)

    # Update last_used to now
    token_obj.last_used = now
    db.commit()
    db.refresh(token_obj)

    # Check if token is expired
    if token_obj.expires_at and token_obj.expires_at <= now:
        return None

    # Return the user
    return db.query(User).filter_by(id=token_obj.user_id).first()
