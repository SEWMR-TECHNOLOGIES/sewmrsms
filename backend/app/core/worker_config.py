# backend/app/core/worker_config.py

import os
import redis

from core.config import REDIS_URL

# Create Redis connection
redis_conn = redis.from_url(
    REDIS_URL
)
