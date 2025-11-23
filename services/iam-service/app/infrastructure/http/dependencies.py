# IAM Service - HTTP Dependencies
from functools import lru_cache
from functools import lru_cache
from fastapi import Depends
from sqlalchemy.orm import Session
from shared.common import get_settings as get_common_settings, Settings
from shared.common.database import get_db_session
from app.infrastructure.db.repositories import (
    SqlAlchemyUsuarioRepository,
    SqlAlchemyRolRepository,
    SqlAlchemySesionRepository,
)
from app.application.use_cases.register_user import RegisterUserUseCase
from app.application.use_cases.login import LoginUseCase
from app.application.use_cases.get_current_user import GetCurrentUserUseCase
from app.application.use_cases.list_users import ListUsersUseCase


# Importar el session factory (se inicializará en main.py)
_session_factory = None


def set_session_factory(factory):
    """Establece el session factory global"""
    global _session_factory
    _session_factory = factory


def get_db() -> Session:
    """Dependency para obtener sesión de BD"""
    if _session_factory is None:
        raise RuntimeError("Session factory not initialized")
    db = _session_factory()
    try:
        yield db
    finally:
        db.close()


@lru_cache()
def get_settings() -> Settings:
    """Dependency para obtener configuración"""
    return get_common_settings()


# Use Case Factories
def get_register_user_use_case(db: Session = Depends(get_db)):
    """Factory para RegisterUserUseCase"""
    usuario_repo = SqlAlchemyUsuarioRepository(db)
    rol_repo = SqlAlchemyRolRepository(db)
    return RegisterUserUseCase(usuario_repo, rol_repo, db)


def get_login_use_case(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """Factory para LoginUseCase"""
    usuario_repo = SqlAlchemyUsuarioRepository(db)
    sesion_repo = SqlAlchemySesionRepository(db)
    return LoginUseCase(
        usuario_repo,
        sesion_repo,
        db,  # Agregar sesión para auditoría
        jwt_secret=settings.JWT_SECRET_KEY,
        jwt_algorithm=settings.JWT_ALGORITHM,
        jwt_expiration_minutes=settings.JWT_EXPIRATION_MINUTES,
    )


def get_current_user_use_case(db: Session = Depends(get_db)):
    """Factory para GetCurrentUserUseCase"""
    usuario_repo = SqlAlchemyUsuarioRepository(db)
    return GetCurrentUserUseCase(usuario_repo)


def get_list_users_use_case(db: Session = Depends(get_db)):
    """Factory para ListUsersUseCase"""
    usuario_repo = SqlAlchemyUsuarioRepository(db)
    return ListUsersUseCase(usuario_repo)
