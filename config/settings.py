from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    openai_api_key:      str = ""
    database_url:        str = "sqlite:///./explainmydecision.db"
    model_path:          str = "models/trained/best_model.joblib"
    mlflow_tracking_uri: str = "mlruns"
    log_level:           str = "INFO"
    clerk_frontend_api:  str = ""
    clerk_secret_key:    str = ""
    gemini_api_key: str = "AIzaSyDB1H_PAOvuhslRYRDw8F4se0BIglZ4MlM"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()