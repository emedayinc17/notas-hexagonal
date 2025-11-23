# Notas Service - HTTP Dependencies
from functools import lru_cache
from sqlalchemy.orm import Session
from fastapi import Depends
from shared.common import get_settings as get_common_settings, Settings
from app.infrastructure.db.repositories import *
from app.infrastructure.clients.personas_client import PersonasServiceClient
from app.infrastructure.clients.academico_client import AcademicoServiceClient
from app.application.use_cases.registrar_nota import RegistrarNotaUseCase


_session_factory = None


def set_session_factory(factory):
    global _session_factory
    _session_factory = factory


def get_db() -> Session:
    if _session_factory is None:
        raise RuntimeError("Session factory not initialized")
    db = _session_factory()
    try:
        yield db
    finally:
        db.close()


@lru_cache()
def get_settings() -> Settings:
    return get_common_settings()


def get_personas_client(settings = Depends(get_settings)) -> PersonasServiceClient:
    # Asumimos que la URL viene en settings, si no usamos default
    base_url = getattr(settings, "PERSONAS_SERVICE_URL", "http://localhost:8003")
    return PersonasServiceClient(base_url=base_url)


def get_academico_client(settings = Depends(get_settings)) -> AcademicoServiceClient:
    base_url = getattr(settings, "ACADEMICO_SERVICE_URL", "http://localhost:8002")
    return AcademicoServiceClient(base_url=base_url)


def get_registrar_nota_use_case(
    db: Session = Depends(get_db),
    personas_client: PersonasServiceClient = Depends(get_personas_client),
    academico_client: AcademicoServiceClient = Depends(get_academico_client),
):
    nota_repo = SqlAlchemyNotaRepository(db)
    alerta_repo = SqlAlchemyAlertaRepository(db)
    outbox_repo = SqlAlchemyOutboxRepository(db)
    
    return RegistrarNotaUseCase(
        nota_repository=nota_repo,
        alerta_repository=alerta_repo,
        outbox_repository=outbox_repo,
        personas_client=personas_client,
        academico_client=academico_client,
        db_session=db,  # Agregar sesión para auditoría
    )
