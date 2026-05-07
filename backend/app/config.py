import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://todo_user:todo_password@localhost:5432/todo_db",
    )
    secret_key: str = os.getenv("SECRET_KEY", "change-this-secret-key")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")


settings = Settings()
