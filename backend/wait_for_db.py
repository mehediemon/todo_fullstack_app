import os
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL)

for attempt in range(30):
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database is ready")
        break
    except OperationalError:
        print(f"Database not ready, retrying... ({attempt + 1}/30)")
        time.sleep(2)
else:
    raise RuntimeError("Database connection failed")
