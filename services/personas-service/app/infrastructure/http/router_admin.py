# Personas Service - HTTP Router Admin
from fastapi import APIRouter, Depends, Header, status, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session
from shared.common import DomainException, extract_bearer_token, decode_jwt_token
from app.infrastructure.http.dependencies import *


router = APIRouter(prefix="/v1", tags=["personas"])


# Request Models
class CreateAlumnoRequest(BaseModel):
    codigo_alumno: str
    nombres: str
    apellido_paterno: str
    apellido_materno: str
    fecha_nacimiento: date
    genero: str  # M, F, OTRO
    dni: Optional[str] = None
    email: Optional[str] = None


class UpdateAlumnoRequest(BaseModel):
    codigo_alumno: Optional[str] = None
    nombres: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    dni: Optional[str] = None
    email: Optional[str] = None


class CreatePadreRequest(BaseModel):
    nombres: str
    apellido_paterno: str
    apellido_materno: str
    email: str
    dni: Optional[str] = None
    celular: Optional[str] = None


class UpdatePadreRequest(BaseModel):
    nombres: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    email: Optional[str] = None
    dni: Optional[str] = None
    celular: Optional[str] = None


class LinkPadreAlumnoRequest(BaseModel):
    padre_id: str
    alumno_id: str
    tipo_relacion: str  # PADRE, MADRE, TUTOR, APODERADO
    es_contacto_principal: bool = False


class MatricularAlumnoRequest(BaseModel):
    alumno_id: str
    clase_id: str
    fecha_matricula: Optional[date] = None


# Endpoints
@router.post("/alumnos", status_code=status.HTTP_201_CREATED)
async def create_alumno(
    request: CreateAlumnoRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_create_alumno_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear alumnos"}
            )
        
        alumno = use_case.execute(
            codigo_alumno=request.codigo_alumno,
            nombres=request.nombres,
            apellido_paterno=request.apellido_paterno,
            apellido_materno=request.apellido_materno,
            fecha_nacimiento=request.fecha_nacimiento,
            genero=request.genero,
            dni=request.dni,
            email=request.email,
        )
        
        return {
            "id": alumno.id,
            "codigo_alumno": alumno.codigo_alumno,
            "nombres": alumno.nombres,
            "apellido_paterno": alumno.apellido_paterno,
            "status": alumno.status,
        }
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )


@router.get("/alumnos")
async def list_alumnos(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    db: Session = Depends(get_db),
):
    """
    Lista alumnos con búsqueda opcional segura.
    """
    import re
    import logging
    from app.infrastructure.db.repositories import SqlAlchemyAlumnoRepository
    from app.infrastructure.db.models import AlumnoModel
    
    logger = logging.getLogger(__name__)
    
    # Validar parámetro de búsqueda si se proporciona
    if search:
        # Detectar patrones sospechosos de SQL Injection
        suspicious_patterns = [
            r"(\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bUPDATE\b|\bINSERT\b)",
            r"(--|#|/\*|\*/)",
            r"(\bUNION\b.*\bSELECT\b)",
            r"(\bOR\b\s+\d+\s*=\s*\d+)",
            r"(;|\bEXEC\b)",
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, search, re.IGNORECASE):
                logger.warning(f"🚨 SQL Injection attempt detected: {search[:100]}")
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": "Invalid search parameter"}
                )
        
        # Validar longitud mínima
        if len(search.strip()) < 2:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Search term must be at least 2 characters"}
            )
        
        search = search.strip()
    
    # Si hay búsqueda, usar filtro seguro con ORM
    if search:
        # Búsqueda segura usando ORM (parametrizado automáticamente)
        query = db.query(AlumnoModel).filter(
            AlumnoModel.is_deleted == False
        )
        
        # Buscar en múltiples campos usando OR (todo parametrizado por SQLAlchemy)
        search_filter = (
            AlumnoModel.nombres.ilike(f"%{search}%") |
            AlumnoModel.apellido_paterno.ilike(f"%{search}%") |
            AlumnoModel.apellido_materno.ilike(f"%{search}%") |
            AlumnoModel.dni.ilike(f"%{search}%") |
            AlumnoModel.codigo_alumno.ilike(f"%{search}%")
        )
        
        alumnos_models = query.filter(search_filter).offset(offset).limit(limit).all()
        
        # Convertir a objetos de dominio
        from app.infrastructure.db.repositories import alumno_model_to_domain
        alumnos = [alumno_model_to_domain(m) for m in alumnos_models]
    else:
        # Sin búsqueda, usar repositorio normal
        repo = SqlAlchemyAlumnoRepository(db)
        alumnos = repo.find_all(offset=offset, limit=limit)
    
    return {
        "alumnos": [
            {
                "id": a.id,
                "codigo_alumno": a.codigo_alumno,
                "nombres": a.nombres,
                "apellido_paterno": a.apellido_paterno,
                "apellido_materno": a.apellido_materno,
                "apellidos": f"{a.apellido_paterno} {a.apellido_materno}".strip(),
                "dni": a.dni,
                "fecha_nacimiento": a.fecha_nacimiento.isoformat() if a.fecha_nacimiento else None,
                "genero": a.genero,
                "direccion": a.direccion,
                "telefono": a.telefono,
                "email": a.email,
                "foto_url": a.foto_url,
                "status": a.status,
            } for a in alumnos
        ],
        "total": len(alumnos),
    }


@router.put("/alumnos/{alumno_id}")
async def update_alumno(
    alumno_id: str,
    request: UpdateAlumnoRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar alumnos"}
            )
        
        from app.infrastructure.db.models import AlumnoModel
        alumno_model = db.query(AlumnoModel).filter(AlumnoModel.id == alumno_id, AlumnoModel.status == "ACTIVO").first()
        
        if not alumno_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Alumno no encontrado"}
            )
        
        if request.codigo_alumno is not None:
            alumno_model.codigo_alumno = request.codigo_alumno
        if request.nombres is not None:
            alumno_model.nombres = request.nombres
        if request.apellido_paterno is not None:
            alumno_model.apellido_paterno = request.apellido_paterno
        if request.apellido_materno is not None:
            alumno_model.apellido_materno = request.apellido_materno
        if request.fecha_nacimiento is not None:
            alumno_model.fecha_nacimiento = request.fecha_nacimiento
        if request.genero is not None:
            alumno_model.genero = request.genero
        if request.dni is not None:
            alumno_model.dni = request.dni
        if request.email is not None:
            alumno_model.email = request.email
        
        db.commit()
        db.refresh(alumno_model)
        
        return {
            "id": alumno_model.id,
            "codigo_alumno": alumno_model.codigo_alumno,
            "nombres": alumno_model.nombres,
            "apellido_paterno": alumno_model.apellido_paterno,
            "apellido_materno": alumno_model.apellido_materno,
            "status": alumno_model.status,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/alumnos/{alumno_id}")
async def delete_alumno(
    alumno_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar alumnos"}
            )
        
        from app.infrastructure.db.models import AlumnoModel
        alumno_model = db.query(AlumnoModel).filter(AlumnoModel.id == alumno_id).first()
        
        if not alumno_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Alumno no encontrado"}
            )
        
        alumno_model.status = "RETIRADO"  # ENUM: ACTIVO, RETIRADO, TRASLADADO
        db.commit()
        
        return {"message": "Alumno eliminado correctamente", "id": alumno_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.post("/padres", status_code=status.HTTP_201_CREATED)
async def create_padre(
    request: CreatePadreRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_create_padre_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear padres"}
            )
        
        padre = use_case.execute(
            nombres=request.nombres,
            apellido_paterno=request.apellido_paterno,
            apellido_materno=request.apellido_materno,
            email=request.email,
            dni=request.dni,
            celular=request.celular,
        )
        
        return {
            "id": padre.id,
            "nombres": padre.nombres,
            "apellido_paterno": padre.apellido_paterno,
            "email": padre.email,
            "status": padre.status,
        }
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )


@router.get("/padres")
async def list_padres(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.infrastructure.db.models import PadreModel, RelacionPadreAlumnoModel
    from sqlalchemy import func
    
    # Query con JOIN para contar hijos
    padres_with_count = db.query(
        PadreModel,
        func.count(RelacionPadreAlumnoModel.id).label('hijos_count')
    ).outerjoin(
        RelacionPadreAlumnoModel,
        PadreModel.id == RelacionPadreAlumnoModel.padre_id
    ).filter(
        PadreModel.is_deleted == False
    ).group_by(
        PadreModel.id
    ).offset(offset).limit(limit).all()
    
    return {
        "padres": [
            {
                "id": p.id,
                "nombres": p.nombres,
                "apellido_paterno": p.apellido_paterno,
                "apellido_materno": p.apellido_materno,
                "apellidos": f"{p.apellido_paterno} {p.apellido_materno}".strip(),
                "email": p.email,
                "dni": p.dni,
                "celular": p.celular,
                "direccion": p.direccion if hasattr(p, 'direccion') else None,
                "ocupacion": p.ocupacion if hasattr(p, 'ocupacion') else None,
                "status": p.status,
                "hijos_count": count,  # ← Campo requerido por el frontend
            } for p, count in padres_with_count
        ],
        "total": len(padres_with_count),
    }


@router.put("/padres/{padre_id}")
async def update_padre(
    padre_id: str,
    request: UpdatePadreRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar padres"}
            )
        
        from app.infrastructure.db.models import PadreModel
        padre_model = db.query(PadreModel).filter(PadreModel.id == padre_id, PadreModel.status == "ACTIVO").first()
        
        if not padre_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Padre no encontrado"}
            )
        
        if request.nombres is not None:
            padre_model.nombres = request.nombres
        if request.apellido_paterno is not None:
            padre_model.apellido_paterno = request.apellido_paterno
        if request.apellido_materno is not None:
            padre_model.apellido_materno = request.apellido_materno
        if request.email is not None:
            padre_model.email = request.email
        if request.dni is not None:
            padre_model.dni = request.dni
        if request.celular is not None:
            padre_model.celular = request.celular
        
        db.commit()
        db.refresh(padre_model)
        
        return {
            "id": padre_model.id,
            "nombres": padre_model.nombres,
            "apellido_paterno": padre_model.apellido_paterno,
            "apellido_materno": padre_model.apellido_materno,
            "email": padre_model.email,
            "status": padre_model.status,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/padres/{padre_id}")
async def delete_padre(
    padre_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar padres"}
            )
        
        from app.infrastructure.db.models import PadreModel
        padre_model = db.query(PadreModel).filter(PadreModel.id == padre_id).first()
        
        if not padre_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Padre no encontrado"}
            )
        
        padre_model.status = "INACTIVO"
        db.commit()
        
        return {"message": "Padre eliminado correctamente", "id": padre_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.post("/relaciones", status_code=status.HTTP_201_CREATED)
async def link_padre_alumno(
    request: LinkPadreAlumnoRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_link_padre_alumno_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede vincular padre-alumno"}
            )
        
        relacion = use_case.execute(
            padre_id=request.padre_id,
            alumno_id=request.alumno_id,
            tipo_relacion=request.tipo_relacion,
            es_contacto_principal=request.es_contacto_principal,
        )
        
        return {
            "id": relacion.id,
            "padre_id": relacion.padre_id,
            "alumno_id": relacion.alumno_id,
            "tipo_relacion": relacion.tipo_relacion,
        }
    except Exception as e:
        # Manejar excepción de relación duplicada
        if "RelacionAlreadyExistsException" in str(type(e).__name__):
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "error": "RELATION_ALREADY_EXISTS", 
                    "message": "Esta relación padre-alumno ya existe"
                }
            )
        # Manejar excepciones de dominio
        if hasattr(e, 'code') and hasattr(e, 'message'):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": e.code, "message": e.message}
            )
        # Error genérico
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.post("/matriculas", status_code=status.HTTP_201_CREATED)
async def matricular_alumno(
    request: MatricularAlumnoRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_matricular_alumno_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede matricular alumnos"}
            )
        
        matricula = use_case.execute(
            alumno_id=request.alumno_id,
            clase_id=request.clase_id,
            fecha_matricula=request.fecha_matricula,
        )
        
        return {
            "id": matricula.id,
            "alumno_id": matricula.alumno_id,
            "clase_id": matricula.clase_id,
            "fecha_matricula": matricula.fecha_matricula.isoformat(),
            "status": matricula.status,
        }
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )


@router.get("/matriculas")
async def list_matriculas(
    alumno_id: Optional[str] = Query(None),
    clase_id: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.infrastructure.db.repositories import SqlAlchemyMatriculaClaseRepository
    repo = SqlAlchemyMatriculaClaseRepository(db)
    matriculas = repo.find_all(alumno_id=alumno_id, clase_id=clase_id, offset=offset, limit=limit)
    return {
        "matriculas": [
            {
                "id": m.id,
                "alumno_id": m.alumno_id,
                "clase_id": m.clase_id,
                "fecha_matricula": m.fecha_matricula.isoformat() if m.fecha_matricula else None,
                "status": m.status,
            } for m in matriculas
        ],
        "total": len(matriculas),
    }


@router.delete("/matriculas/{matricula_id}")
async def delete_matricula(
    matricula_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar matrículas"}
            )
        
        from app.infrastructure.db.models import MatriculaClaseModel
        matricula_model = db.query(MatriculaClaseModel).filter(MatriculaClaseModel.id == matricula_id).first()
        
        if not matricula_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Matrícula no encontrada"}
            )
        
        matricula_model.status = "RETIRADO"  # ENUM: ACTIVO, RETIRADO, CONGELADO
        db.commit()
        
        return {"message": "Matrícula eliminada correctamente", "id": matricula_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.get("/relaciones/alumno/{alumno_id}")
async def get_padres_by_alumno(
    alumno_id: str,
    db: Session = Depends(get_db),
):
    """Endpoint usado por Notas Service para obtener padres de un alumno"""
    from app.infrastructure.db.repositories import SqlAlchemyRelacionPadreAlumnoRepository, SqlAlchemyPadreRepository
    relacion_repo = SqlAlchemyRelacionPadreAlumnoRepository(db)
    padre_repo = SqlAlchemyPadreRepository(db)
    
    relaciones = relacion_repo.find_by_alumno(alumno_id)
    padres = []
    
    for rel in relaciones:
        padre = padre_repo.find_by_id(rel.padre_id)
        if padre:
            padres.append({
                "id": padre.id,
                "nombres": padre.nombres,
                "apellido_paterno": padre.apellido_paterno,
                "email": padre.email,
                "tipo_relacion": rel.tipo_relacion,
            })
    
    return padres


@router.get("/matriculas/{matricula_id}")
async def get_matricula_info(
    matricula_id: str,
    db: Session = Depends(get_db),
):
    """Endpoint usado por Notas Service"""
    from app.infrastructure.db.repositories import SqlAlchemyMatriculaClaseRepository
    repo = SqlAlchemyMatriculaClaseRepository(db)
    matricula = repo.find_by_id(matricula_id)
    
    if not matricula:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "NotFound", "message": "Matrícula no encontrada"}
        )
    
    return {
        "id": matricula.id,
        "alumno_id": matricula.alumno_id,
        "clase_id": matricula.clase_id,
        "status": matricula.status,
    }
