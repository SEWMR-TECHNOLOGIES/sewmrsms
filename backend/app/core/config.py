# backend/app/core/config.py

import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
MERCHANT_CODE = os.getenv("MERCHANT_CODE")
CALLBACK_URL = os.getenv("CALLBACK_URL")
API_ID = os.getenv("API_ID")
API_PASSWORD = os.getenv("API_PASSWORD")
SMS_CALLBACK_URL = os.getenv("SMS_CALLBACK_URL")
JWT_SECRET = os.getenv("JWT_SECRET")
DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
UPLOAD_SERVICE_URL = "https://data.sewmrtechnologies.com/handle-file-uploads"
MAX_FILE_SIZE = 0.5 * 1024 * 1024  # 0.5 MB
MAX_COOKIE_AGE = 60 * 60 * 24
CRON_AUTH_TOKEN = os.getenv("CRON_AUTH_TOKEN")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL")
FROM_NAME = os.getenv("FROM_NAME")
APP_ENV = os.getenv("APP_ENV", "development")
IS_PRODUCTION = APP_ENV == "production"
if APP_ENV == "production":
    COOKIE_DOMAIN = ".sewmrsms.co.tz"
else:
    COOKIE_DOMAIN = None 
UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")
REDIS_URL = os.getenv("REDIS_URL")