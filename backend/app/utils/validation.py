import re
from difflib import SequenceMatcher

# Common placeholder/generic names
GENERIC_NAMES = {
    "user", "test", "admin", "john", "doe", "guest", "abcd", "xyz", "anonymous", 
    "qwerty", "sample", "demo", "null", "none", "name", "firstname", "lastname"
}

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

# Optional: List of patterns that look like random gibberish
GIBBERISH_PATTERNS = [
    r'(.)\1{3,}',           # repeated characters
    r'[bcdfghjklmnpqrstvwxyz]{5,}',  # long consonant clusters
]

def is_gibberish(name: str) -> bool:
    """Detects likely nonsense names."""
    name_lower = name.lower()
    
    # Simple repeated chars or consonant cluster check
    for pattern in GIBBERISH_PATTERNS:
        if re.search(pattern, name_lower):
            return True
    
    # Optional: compare similarity to known generic names
    for generic in GENERIC_NAMES:
        if SequenceMatcher(None, name_lower, generic).ratio() > 0.8:
            return True
    
    return False

def validate_name(name: str) -> bool:
    """
    Validates realistic human names.
    Rules:
    - Alphabetic (with accents), spaces, hyphens, apostrophes
    - Length 2–50
    - Not in generic names
    - No digits
    - No excessive repeated characters
    - Cannot start/end with hyphen/apostrophe or have consecutive hyphens/apostrophes
    - Rejects likely gibberish
    """
    if not name:
        return False

    name_clean = name.strip()
    if not (2 <= len(name_clean) <= 50):
        return False

    if name_clean.lower() in GENERIC_NAMES:
        return False

    if any(char.isdigit() for char in name_clean):
        return False

    if not re.fullmatch(r"[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+", name_clean):
        return False

    if re.search(r"(^[-']|[-']$|[-']{2,})", name_clean):
        return False

    if is_gibberish(name_clean):
        return False

    return True
