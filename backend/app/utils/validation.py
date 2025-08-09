import re

def validate_email(email: str) -> bool:
    # Basic regex for email validation
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    # Allow digits, optional + at start, 7-15 digits total (simple, tweak as needed)
    pattern = r'^\+?\d{7,15}$'
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