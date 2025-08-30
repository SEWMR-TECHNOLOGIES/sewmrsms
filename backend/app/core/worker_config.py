# backend/app/core/worker_config.py

import os
import redis

from core.config import REDIS_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

# Create Redis connection
redis_conn = redis.from_url(
    REDIS_URL
)
