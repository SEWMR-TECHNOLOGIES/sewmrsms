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
SMS_CALLBACK_URL = os.getenv("sMS_CALLBACK_URL")
JWT_SECRET = os.getenv("JWT_SECRET")
DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
UPLOAD_SERVICE_URL = "https://data.sewmrtechnologies.com/handle-file-uploads"
MAX_FILE_SIZE = 0.5 * 1024 * 1024  # 0.5 MB
CRON_AUTH_TOKEN = os.getenv("CRON_AUTH_TOKEN")
