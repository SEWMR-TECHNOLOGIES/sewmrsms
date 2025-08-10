import re

def validate_email(email: str) -> bool:
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    pattern = r'^255[67]\d{8}$'
    return bool(re.match(pattern, phone))

def validate_password_confirmation(password: str, confirm_password: str) -> bool:
    return password == confirm_password

def validate_password_strength(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    return True

def validate_sender_alias(alias: str) -> bool:
    pattern = r'^[A-Z0-9 ]{3,11}$'
    return bool(re.fullmatch(pattern, alias))
