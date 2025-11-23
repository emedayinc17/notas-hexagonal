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
    apellido_materno: Optional[str] = None
    fecha_nacimiento: date
    genero: str  # M, F, OTRO
    dni: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None


class UpdateAlumnoRequest(BaseModel):
    codigo_alumno: Optional[str] = None
    nombres: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    dni: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None


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
        
        # Robust check (case-insensitive)
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": "Forbidden", 
                    "message": f"Solo ADMIN puede crear alumnos. Rol actual: {rol}",
                    "debug_payload": payload # Remove in production
                }
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
            direccion=request.direccion,
            telefono=request.telefono,
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
    db: Session = Depends(get_db),
):
    from app.infrastructure.db.repositories import SqlAlchemyAlumnoRepository
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
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
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
        if request.direccion is not None:
            alumno_model.direccion = request.direccion
        if request.telefono is not None:
            alumno_model.telefono = request.telefono
        
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
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
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
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
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
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
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
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
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
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
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
        
        # Manejar excepción de tipo de relación duplicada
        if "TipoRelacionDuplicadaException" in str(type(e).__name__):
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "error": "TIPO_RELACION_DUPLICADA", 
                    "message": str(e)
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
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
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
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
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


@router.delete("/relaciones/{relacion_id}")
async def delete_relacion(
    relacion_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    """Eliminar relación padre-alumno"""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if not rol or rol.upper() != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo ADMIN puede realizar esta acción. Rol: {rol}"}
            )
        
        from app.infrastructure.db.models import RelacionPadreAlumnoModel
        relacion_model = db.query(RelacionPadreAlumnoModel).filter(
            RelacionPadreAlumnoModel.id == relacion_id,
            RelacionPadreAlumnoModel.is_deleted == False
        ).first()
        
        if not relacion_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Relación no encontrada"}
            )
        
        # Soft delete
        relacion_model.is_deleted = True
        db.commit()
        
        return {"message": "Relación eliminada correctamente", "id": relacion_id}
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

    # Construir respuesta con la forma que espera el frontend: { relaciones: [ { id, tipo_relacion, es_contacto_principal, padre: {...} } ] }
    relaciones_json = []
    for rel in relaciones:
        padre = padre_repo.find_by_id(rel.padre_id)
        if not padre:
            continue
        relaciones_json.append({
            "id": rel.id,
            "tipo_relacion": rel.tipo_relacion,
            "es_contacto_principal": rel.es_contacto_principal,
            "padre": {
                "id": padre.id,
                "nombres": padre.nombres,
                "apellido_paterno": padre.apellido_paterno,
                "apellido_materno": padre.apellido_materno,
                "apellidos": f"{padre.apellido_paterno} {padre.apellido_materno}".strip(),
                "dni": padre.dni,
                "email": padre.email,
                "celular": padre.celular,
            }
        })

    return {"relaciones": relaciones_json}


@router.get("/relaciones/padre/{padre_id}")
async def get_hijos_by_padre(
    padre_id: str,
    db: Session = Depends(get_db),
):
    """Devuelve los hijos (alumnos) vinculados a un padre en la forma que espera el frontend"""
    from app.infrastructure.db.repositories import SqlAlchemyRelacionPadreAlumnoRepository, SqlAlchemyAlumnoRepository
    relacion_repo = SqlAlchemyRelacionPadreAlumnoRepository(db)
    alumno_repo = SqlAlchemyAlumnoRepository(db)

    relaciones = relacion_repo.find_by_padre(padre_id)
    hijos_json = []
    for rel in relaciones:
        alumno = alumno_repo.find_by_id(rel.alumno_id)
        if not alumno:
            continue
        hijos_json.append({
            "relacion_id": rel.id,
            "alumno_id": alumno.id,
            "nombres": alumno.nombres,
            "apellido_paterno": alumno.apellido_paterno,
            "apellido_materno": alumno.apellido_materno,
            "apellidos": f"{alumno.apellido_paterno} {alumno.apellido_materno}".strip(),
            "dni": alumno.dni,
            "tipo_relacion": rel.tipo_relacion,
        })

    return {"hijos": hijos_json}


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


@router.get("/clases/{clase_id}/alumnos")
async def get_alumnos_por_clase(
    clase_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    """Obtener alumnos matriculados en una clase específica"""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol not in ["ADMIN", "DOCENTE"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN o DOCENTE pueden ver alumnos"}
            )
        
        from app.infrastructure.db.models import AlumnoModel, MatriculaClaseModel
        # Query para obtener alumnos matriculados en la clase específica
        query = db.query(AlumnoModel).join(
            MatriculaClaseModel,
            AlumnoModel.id == MatriculaClaseModel.alumno_id
        ).filter(
            MatriculaClaseModel.clase_id == clase_id,
            MatriculaClaseModel.status == 'ACTIVO',
            MatriculaClaseModel.is_deleted == False,
            AlumnoModel.status == 'ACTIVO',
            AlumnoModel.is_deleted == False
        )
        
        alumnos_matriculados = query.all()
        
        return {
            "alumnos": [
                {
                    "id": a.id,
                    "codigo_alumno": a.codigo_alumno,
                    "nombres": a.nombres,
                    "apellidos": f"{a.apellido_paterno} {a.apellido_materno or ''}".strip(),
                    "dni": a.dni,
                    "status": a.status
                } for a in alumnos_matriculados
            ],
            "total": len(alumnos_matriculados),
            "clase_id": clase_id
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )
