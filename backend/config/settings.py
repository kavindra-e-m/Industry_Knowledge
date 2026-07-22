"""
Application settings — loaded from .env via pydantic-settings.
Owner: Member 1 — Backend & RAG Lead
"""
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App
    APP_NAME: str = "IndustrialBrain"
    APP_PORT: int = 8000
    APP_BASE_URL: str = "http://localhost:8000"
    DEBUG: bool = False

    # JWT Auth
    SECRET_KEY: str = "change-this-to-a-random-64-char-string-before-demo"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # PostgreSQL
    DATABASE_URL: str = "postgresql://industrialbrain:industrialbrain123@localhost:5432/industrialbrain"

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "industrialbrain123"

    # ChromaDB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION_DOCUMENTS: str = "industrial_documents"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_CACHE_TTL: int = 3600  # seconds

    # Gemini
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_MAX_TOKENS: int = 8192
    GEMINI_TEMPERATURE: float = 0.1

    # Groq
    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MAX_TOKENS: int = 8192
    GROQ_TEMPERATURE: float = 0.1

    # Embeddings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # ML model paths
    FAILURE_MODEL_PATH: str = "ml/predictive_maintenance/models/failure_rf_model.pkl"
    SCALER_PATH: str = "ml/predictive_maintenance/models/scaler.pkl"
    ANOMALY_MODEL_PATH: str = "ml/predictive_maintenance/models/iso_forest.pkl"
    PID_MODEL_PATH: str = "ml/pid_parser/models/pid_yolov8.pt"

    # Data paths
    SEEDS_DIR: str = "data/seeds"
    SAMPLE_DOCS_DIR: str = "data/sample_documents"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

# Auto-detect if a Groq key was placed in GEMINI_API_KEY
if settings.GEMINI_API_KEY.startswith("gsk_") and not settings.GROQ_API_KEY:
    settings.GROQ_API_KEY = settings.GEMINI_API_KEY
