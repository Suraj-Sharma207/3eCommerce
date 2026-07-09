from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Chatbot Foundation API"
    API_V1_STR: str = "/api"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # CORS Origins (can be loaded as comma-separated values in env)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Fast Path Settings
    GIBBERISH_THRESHOLD: int = 4
    FAST_PATH_DEBUG: bool = True
    
    # Chat Configuration (matches frontend)
    CHAT_CONFIG: dict = {
        "IDLE_TIMEOUT": 10 * 60 * 1000,
        "GREETING_REPEAT_WINDOW": 5 * 60 * 1000,
        "MAX_CONTEXT_MESSAGES": 50,
        "MAX_HISTORY": 100
    }
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
