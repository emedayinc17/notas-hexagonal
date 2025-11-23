# Académico Service - HTTP Dependencies
from functools import lru_cache
from fastapi import Depends
from sqlalchemy.orm import Session
from shared.common import get_settings as get_common_settings, Settings
from app.infrastructure.db.repositories import *
from app.application.use_cases.create_grado import CreateGradoUseCase
from app.application.use_cases.create_clase import CreateClaseUseCase


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


def get_create_grado_use_case(db: Session = Depends(get_db)):
    grado_repo = SqlAlchemyGradoRepository(db)
    return CreateGradoUseCase(grado_repo)


def get_create_curso_use_case(db: Session = Depends(get_db)):
    from shared.common import generate_uuid, AlreadyExistsException
    from app.domain import Curso, CursoRepository
    
    curso_repo = SqlAlchemyCursoRepository(db)
    
    class CreateCursoUseCase:
        def __init__(self, curso_repository: CursoRepository):
            self.curso_repository = curso_repository
        
        def execute(self, codigo: str, nombre: str, descripcion: str = None, horas_semanales: int = None) -> Curso:
            existing = self.curso_repository.find_by_codigo(codigo)
            if existing:
                raise AlreadyExistsException(f"Curso con código {codigo} ya existe")
            
            nuevo_curso = Curso(
                id=generate_uuid(),
                codigo=codigo,
                nombre=nombre,
                descripcion=descripcion,
                horas_semanales=horas_semanales,
                status="ACTIVO",
            )
            
            return self.curso_repository.create(nuevo_curso)
    
    return CreateCursoUseCase(curso_repo)


def get_create_clase_use_case(db: Session = Depends(get_db)):
    clase_repo = SqlAlchemyClaseRepository(db)
    curso_repo = SqlAlchemyCursoRepository(db)
    seccion_repo = SqlAlchemySeccionRepository(db)
    periodo_repo = SqlAlchemyPeriodoRepository(db)
    return CreateClaseUseCase(clase_repo, curso_repo, seccion_repo, periodo_repo)


def get_create_seccion_use_case(db: Session = Depends(get_db)):
    from app.application.use_cases.create_seccion import CreateSeccionUseCase
    seccion_repo = SqlAlchemySeccionRepository(db)
    grado_repo = SqlAlchemyGradoRepository(db)
    return CreateSeccionUseCase(seccion_repo, grado_repo)


def get_create_periodo_use_case(db: Session = Depends(get_db)):
    from app.application.use_cases.create_periodo import CreatePeriodoUseCase
    periodo_repo = SqlAlchemyPeriodoRepository(db)
    tipo_repo = SqlAlchemyPeriodoTipoRepository(db)
    return CreatePeriodoUseCase(periodo_repo, tipo_repo)


def get_create_periodo_tipo_use_case(db: Session = Depends(get_db)):
    from app.application.use_cases.create_periodo import CreatePeriodoTipoUseCase
    tipo_repo = SqlAlchemyPeriodoTipoRepository(db)
    return CreatePeriodoTipoUseCase(tipo_repo)


# Import Depends
from fastapi import Depends
