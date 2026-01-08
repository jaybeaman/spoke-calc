from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://spokecalc:spokecalc_secret@localhost:5432/spokecalc"
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    cors_origins: str = "http://localhost:3333"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
