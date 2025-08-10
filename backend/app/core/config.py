# backend/app/core/config.py

import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
UPLOAD_SERVICE_URL = "https://data.sewmrtechnologies.com/handle-file-uploads"
MAX_FILE_SIZE = 0.5 * 1024 * 1024  # 0.5 MB
