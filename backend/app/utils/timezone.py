"""Timezone helper — single source of truth for East Africa Time."""
from datetime import datetime
import pytz

EAT = pytz.timezone("Africa/Nairobi")


def now_eat() -> datetime:
    """Return current naive datetime in Africa/Nairobi (for DB storage)."""
    return datetime.now(EAT).replace(tzinfo=None)
