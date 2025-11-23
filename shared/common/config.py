# Shared Common - Config
import os
import json
from typing import Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración compartida para todos los servicios"""
    
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 horas
    
    # Application
    APP_NAME: str
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # CORS
    CORS_ORIGINS: Union[list[str], str] = ["*"]
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Services URLs (opcionales, solo para servicios que necesiten comunicación HTTP)
    PERSONAS_SERVICE_URL: Optional[str] = None
    ACADEMICO_SERVICE_URL: Optional[str] = None
    IAM_SERVICE_URL: Optional[str] = None
    NOTAS_SERVICE_URL: Optional[str] = None
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parsea CORS_ORIGINS desde string JSON o devuelve la lista directamente"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                # Si es un solo valor, convertir a lista
                return [v]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"
    
    @property
    def DATABASE_URL(self) -> str:
        """Construye la URL de conexión a MySQL"""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"


def get_settings() -> Settings:
    """Factory de configuración"""
    return Settings()
