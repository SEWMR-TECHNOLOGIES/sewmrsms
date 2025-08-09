import hashlib
import hmac
import os
import jwt
from datetime import datetime, timedelta

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
JWT_SECRET = os.getenv("JWT_SECRET", "fallback_secret")
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
