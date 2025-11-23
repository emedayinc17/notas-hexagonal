# Personas Service - HTTP Dependencies
from functools import lru_cache
from sqlalchemy.orm import Session
from fastapi import Depends
from shared.common import get_settings as get_common_settings, Settings
from app.infrastructure.db.repositories import *
from app.application.use_cases.create_alumno import CreateAlumnoUseCase
from app.application.use_cases.create_padre import CreatePadreUseCase
from app.application.use_cases.link_padre_alumno import LinkPadreAlumnoUseCase
from app.application.use_cases.matricular_alumno import MatricularAlumnoUseCase


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


def get_create_alumno_use_case(db: Session = Depends(get_db)):
    alumno_repo = SqlAlchemyAlumnoRepository(db)
    return CreateAlumnoUseCase(alumno_repo)


def get_create_padre_use_case(db: Session = Depends(get_db)):
    padre_repo = SqlAlchemyPadreRepository(db)
    return CreatePadreUseCase(padre_repo)


def get_link_padre_alumno_use_case(db: Session = Depends(get_db)):
    relacion_repo = SqlAlchemyRelacionPadreAlumnoRepository(db)
    alumno_repo = SqlAlchemyAlumnoRepository(db)
    padre_repo = SqlAlchemyPadreRepository(db)
    return LinkPadreAlumnoUseCase(relacion_repo, alumno_repo, padre_repo)


def get_matricular_alumno_use_case(db: Session = Depends(get_db)):
    matricula_repo = SqlAlchemyMatriculaClaseRepository(db)
    alumno_repo = SqlAlchemyAlumnoRepository(db)
    return MatricularAlumnoUseCase(matricula_repo, alumno_repo)
