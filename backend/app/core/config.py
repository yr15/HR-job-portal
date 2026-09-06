from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str
    secret_key: str = "insecure-dev-secret-change-me"
    access_token_expire_minutes: int = 1440
    frontend_origin: str = "http://localhost:3000"
    seed_demo_data: bool = True


settings = Settings()
