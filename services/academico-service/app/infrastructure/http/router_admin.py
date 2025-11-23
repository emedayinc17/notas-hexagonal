# Académico Service - HTTP Router Admin
from fastapi import APIRouter, Depends, Header, status, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import date
from shared.common import DomainException, extract_bearer_token, decode_jwt_token
from app.infrastructure.http.dependencies import *


router = APIRouter(prefix="/v1", tags=["academico"])


# Request Models
class CreateGradoRequest(BaseModel):
    nombre: str
    nivel: str  # INICIAL, PRIMARIA, SECUNDARIA
    orden: int
    descripcion: Optional[str] = None


class UpdateGradoRequest(BaseModel):
    nombre: Optional[str] = None
    nivel: Optional[str] = None
    orden: Optional[int] = None
    descripcion: Optional[str] = None


class CreateCursoRequest(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    horas_semanales: Optional[int] = None


class UpdateCursoRequest(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    horas_semanales: Optional[int] = None


class CreateClaseRequest(BaseModel):
    curso_id: str
    seccion_id: str
    periodo_id: str
    docente_user_id: str


class UpdateClaseRequest(BaseModel):
    curso_id: Optional[str] = None
    seccion_id: Optional[str] = None
    periodo_id: Optional[str] = None
    docente_user_id: Optional[str] = None


class CreateSeccionRequest(BaseModel):
    grado_id: str
    nombre: str
    año_escolar: int
    capacidad_maxima: Optional[int] = 30


class UpdateSeccionRequest(BaseModel):
    grado_id: Optional[str] = None
    nombre: Optional[str] = None
    año_escolar: Optional[int] = None
    capacidad_maxima: Optional[int] = None


class CreatePeriodoTipoRequest(BaseModel):
    nombre: str
    num_periodos: int
    descripcion: Optional[str] = None


class CreatePeriodoRequest(BaseModel):
    año_escolar: int
    tipo_id: str
    numero: int
    nombre: str
    fecha_inicio: date
    fecha_fin: date


class UpdatePeriodoRequest(BaseModel):
    año_escolar: Optional[int] = None
    tipo_id: Optional[str] = None
    numero: Optional[int] = None
    nombre: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None


# Endpoints
@router.post("/grados", status_code=status.HTTP_201_CREATED)
async def create_grado(
    request: CreateGradoRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_create_grado_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear grados"}
            )
        
        grado = use_case.execute(
            nombre=request.nombre,
            nivel=request.nivel,
            orden=request.orden,
            descripcion=request.descripcion,
        )
        
        return {
            "id": grado.id,
            "nombre": grado.nombre,
            "nivel": grado.nivel.value if hasattr(grado.nivel, 'value') else grado.nivel,
            "orden": grado.orden,
            "descripcion": grado.descripcion,
            "status": grado.status,
        }
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message},
        )
    except Exception as e:
        # Log the unexpected error for debugging
        import traceback, sys
        traceback.print_exc(file=sys.stderr)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)},
        )


@router.get("/grados")
async def list_grados(
    nivel: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.infrastructure.db.repositories import SqlAlchemyGradoRepository
    repo = SqlAlchemyGradoRepository(db)
    grados = repo.find_all(nivel=nivel, offset=offset, limit=limit)
    return {
        "grados": [
            {
                "id": g.id,
                "nombre": g.nombre,
                "nivel": g.nivel.value if hasattr(g.nivel, 'value') else g.nivel,
                "orden": g.orden,
                "status": g.status,
            } for g in grados
        ],
        "total": len(grados),
        "offset": offset,
        "limit": limit,
    }


@router.put("/grados/{grado_id}")
async def update_grado(
    grado_id: str,
    request: UpdateGradoRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar grados"}
            )
        
        from app.infrastructure.db.models import GradoModel
        grado_model = db.query(GradoModel).filter(GradoModel.id == grado_id, GradoModel.status == "ACTIVO").first()
        
        if not grado_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Grado no encontrado"}
            )
        
        # Actualizar solo los campos enviados
        if request.nombre is not None:
            grado_model.nombre = request.nombre
        if request.nivel is not None:
            grado_model.nivel = request.nivel
        if request.orden is not None:
            grado_model.orden = request.orden
        if request.descripcion is not None:
            grado_model.descripcion = request.descripcion
        
        db.commit()
        db.refresh(grado_model)
        
        return {
            "id": grado_model.id,
            "nombre": grado_model.nombre,
            "nivel": grado_model.nivel,
            "orden": grado_model.orden,
            "descripcion": grado_model.descripcion,
            "status": grado_model.status,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/grados/{grado_id}")
async def delete_grado(
    grado_id: str,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar grados"}
            )
        
        from app.infrastructure.db.models import GradoModel
        grado_model = db.query(GradoModel).filter(GradoModel.id == grado_id).first()
        
        if not grado_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Grado no encontrado"}
            )
        
        # Soft delete
        grado_model.status = "INACTIVO"
        db.commit()
        
        return {"message": "Grado eliminado correctamente", "id": grado_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.post("/cursos", status_code=status.HTTP_201_CREATED)
async def create_curso(
    request: CreateCursoRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_create_curso_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear cursos"}
            )
        
        curso = use_case.execute(
            codigo=request.codigo,
            nombre=request.nombre,
            descripcion=request.descripcion,
            horas_semanales=request.horas_semanales,
        )
        
        return {
            "id": curso.id,
            "codigo": curso.codigo,
            "nombre": curso.nombre,
            "descripcion": curso.descripcion,
            "horas_semanales": curso.horas_semanales,
            "status": curso.status,
        }
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )


@router.get("/cursos")
async def list_cursos(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.infrastructure.db.repositories import SqlAlchemyCursoRepository
    repo = SqlAlchemyCursoRepository(db)
    cursos = repo.find_all(offset=offset, limit=limit)
    return {
        "cursos": [
            {
                "id": c.id,
                "codigo": c.codigo,
                "nombre": c.nombre,
                "status": c.status,
            } for c in cursos
        ],
        "total": len(cursos),
    }


@router.put("/cursos/{curso_id}")
async def update_curso(
    curso_id: str,
    request: UpdateCursoRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar cursos"}
            )
        
        from app.infrastructure.db.models import CursoModel
        curso_model = db.query(CursoModel).filter(CursoModel.id == curso_id, CursoModel.status == "ACTIVO").first()
        
        if not curso_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Curso no encontrado"}
            )
        
        if request.codigo is not None:
            curso_model.codigo = request.codigo
        if request.nombre is not None:
            curso_model.nombre = request.nombre
        if request.descripcion is not None:
            curso_model.descripcion = request.descripcion
        if request.horas_semanales is not None:
            curso_model.horas_semanales = request.horas_semanales
        
        db.commit()
        db.refresh(curso_model)
        
        return {
            "id": curso_model.id,
            "codigo": curso_model.codigo,
            "nombre": curso_model.nombre,
            "descripcion": curso_model.descripcion,
            "horas_semanales": curso_model.horas_semanales,
            "status": curso_model.status,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/cursos/{curso_id}")
async def delete_curso(
    curso_id: str,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar cursos"}
            )
        
        from app.infrastructure.db.models import CursoModel
        curso_model = db.query(CursoModel).filter(CursoModel.id == curso_id).first()
        
        if not curso_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Curso no encontrado"}
            )
        
        curso_model.status = "INACTIVO"
        db.commit()
        
        return {"message": "Curso eliminado correctamente", "id": curso_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.post("/secciones", status_code=status.HTTP_201_CREATED)
async def create_seccion(
    request: CreateSeccionRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_create_seccion_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"error": "Forbidden"})
        
        seccion = use_case.execute(
            grado_id=request.grado_id,
            nombre=request.nombre,
            año_escolar=request.año_escolar,
            capacidad_maxima=request.capacidad_maxima,
        )
        return {"id": seccion.id, "nombre": seccion.nombre, "status": seccion.status}
    except DomainException as e:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": e.code, "message": e.message})


@router.get("/secciones")
async def list_secciones(
    grado_id: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.infrastructure.db.repositories import SqlAlchemySeccionRepository
    repo = SqlAlchemySeccionRepository(db)
    secciones = repo.find_all(grado_id=grado_id, offset=offset, limit=limit)
    return {
        "secciones": [
            {
                "id": s.id,
                "grado_id": s.grado_id,
                "nombre": s.nombre,
                "año_escolar": s.año_escolar,
                "capacidad_maxima": s.capacidad_maxima,
                "status": s.status,
            } for s in secciones
        ],
        "total": len(secciones),
    }


@router.put("/secciones/{seccion_id}")
async def update_seccion(
    seccion_id: str,
    request: UpdateSeccionRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar secciones"}
            )
        
        from app.infrastructure.db.models import SeccionModel
        seccion_model = db.query(SeccionModel).filter(SeccionModel.id == seccion_id, SeccionModel.status == "ACTIVO").first()
        
        if not seccion_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Sección no encontrada"}
            )
        
        if request.grado_id is not None:
            seccion_model.grado_id = request.grado_id
        if request.nombre is not None:
            seccion_model.nombre = request.nombre
        if request.año_escolar is not None:
            seccion_model.año_escolar = request.año_escolar
        if request.capacidad_maxima is not None:
            seccion_model.capacidad_maxima = request.capacidad_maxima
        
        db.commit()
        db.refresh(seccion_model)
        
        return {
            "id": seccion_model.id,
            "grado_id": seccion_model.grado_id,
            "nombre": seccion_model.nombre,
            "año_escolar": seccion_model.año_escolar,
            "capacidad_maxima": seccion_model.capacidad_maxima,
            "status": seccion_model.status,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/secciones/{seccion_id}")
async def delete_seccion(
    seccion_id: str,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar secciones"}
            )
        
        from app.infrastructure.db.models import SeccionModel
        seccion_model = db.query(SeccionModel).filter(SeccionModel.id == seccion_id).first()
        
        if not seccion_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Sección no encontrada"}
            )
        
        seccion_model.status = "INACTIVO"
        db.commit()
        
        return {"message": "Sección eliminada correctamente", "id": seccion_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.post("/periodos/tipos", status_code=status.HTTP_201_CREATED)
async def create_periodo_tipo(
    request: CreatePeriodoTipoRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_create_periodo_tipo_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        if payload.get("rol_nombre") != "ADMIN":
            return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"error": "Forbidden"})
            
        tipo = use_case.execute(request.nombre, request.num_periodos, request.descripcion)
        return {"id": tipo.id, "nombre": tipo.nombre}
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": "Error", "message": str(e)})


@router.post("/periodos", status_code=status.HTTP_201_CREATED)
async def create_periodo(
    request: CreatePeriodoRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_create_periodo_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        if payload.get("rol_nombre") != "ADMIN":
            return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"error": "Forbidden"})
            
        periodo = use_case.execute(
            request.año_escolar, request.tipo_id, request.numero, 
            request.nombre, request.fecha_inicio, request.fecha_fin
        )
        return {"id": periodo.id, "nombre": periodo.nombre, "status": periodo.status}
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": "Error", "message": str(e)})


@router.get("/periodos")
async def list_periodos(
    año_escolar: Optional[int] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.infrastructure.db.repositories import SqlAlchemyPeriodoRepository
    repo = SqlAlchemyPeriodoRepository(db)
    periodos = repo.find_all(año_escolar=año_escolar, offset=offset, limit=limit)
    return {
        "periodos": [
            {
                "id": p.id,
                "año_escolar": p.año_escolar,
                "tipo_id": p.tipo_id,
                "numero": p.numero,
                "nombre": p.nombre,
                "fecha_inicio": p.fecha_inicio.isoformat() if p.fecha_inicio else None,
                "fecha_fin": p.fecha_fin.isoformat() if p.fecha_fin else None,
                "status": p.status,
            } for p in periodos
        ],
        "total": len(periodos),
    }


@router.put("/periodos/{periodo_id}")
async def update_periodo(
    periodo_id: str,
    request: UpdatePeriodoRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar periodos"}
            )
        
        from app.infrastructure.db.models import PeriodoModel
        periodo_model = db.query(PeriodoModel).filter(PeriodoModel.id == periodo_id, PeriodoModel.status == "ACTIVO").first()
        
        if not periodo_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Periodo no encontrado"}
            )
        
        if request.año_escolar is not None:
            periodo_model.año_escolar = request.año_escolar
        if request.tipo_id is not None:
            periodo_model.tipo_id = request.tipo_id
        if request.numero is not None:
            periodo_model.numero = request.numero
        if request.nombre is not None:
            periodo_model.nombre = request.nombre
        if request.fecha_inicio is not None:
            periodo_model.fecha_inicio = request.fecha_inicio
        if request.fecha_fin is not None:
            periodo_model.fecha_fin = request.fecha_fin
        
        db.commit()
        db.refresh(periodo_model)
        
        return {
            "id": periodo_model.id,
            "año_escolar": periodo_model.año_escolar,
            "tipo_id": periodo_model.tipo_id,
            "numero": periodo_model.numero,
            "nombre": periodo_model.nombre,
            "fecha_inicio": periodo_model.fecha_inicio.isoformat() if periodo_model.fecha_inicio else None,
            "fecha_fin": periodo_model.fecha_fin.isoformat() if periodo_model.fecha_fin else None,
            "status": periodo_model.status,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/periodos/{periodo_id}")
async def delete_periodo(
    periodo_id: str,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar periodos"}
            )
        
        from app.infrastructure.db.models import PeriodoModel
        periodo_model = db.query(PeriodoModel).filter(PeriodoModel.id == periodo_id).first()
        
        if not periodo_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Periodo no encontrado"}
            )
        
        periodo_model.status = "CERRADO"  # ENUM: ACTIVO, CERRADO
        db.commit()
        
        return {"message": "Periodo eliminado correctamente", "id": periodo_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.post("/clases", status_code=status.HTTP_201_CREATED)
async def create_clase(
    request: CreateClaseRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_create_clase_use_case),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear clases"}
            )
        
        clase = use_case.execute(
            curso_id=request.curso_id,
            seccion_id=request.seccion_id,
            periodo_id=request.periodo_id,
            docente_user_id=request.docente_user_id,
        )
        
        return {
            "id": clase.id,
            "curso_id": clase.curso_id,
            "seccion_id": clase.seccion_id,
            "periodo_id": clase.periodo_id,
            "docente_user_id": clase.docente_user_id,
            "status": clase.status,
        }
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )


@router.get("/clases")
async def list_clases(
    curso_id: Optional[str] = Query(None),
    seccion_id: Optional[str] = Query(None),
    periodo_id: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.infrastructure.db.repositories import SqlAlchemyClaseRepository
    repo = SqlAlchemyClaseRepository(db)
    clases = repo.find_all(
        curso_id=curso_id,
        seccion_id=seccion_id,
        periodo_id=periodo_id,
        offset=offset,
        limit=limit
    )
    return {
        "clases": [
            {
                "id": c.id,
                "curso_id": c.curso_id,
                "seccion_id": c.seccion_id,
                "periodo_id": c.periodo_id,
                "docente_user_id": c.docente_user_id,
                "status": c.status,
            } for c in clases
        ],
        "total": len(clases),
    }


@router.put("/clases/{clase_id}")
async def update_clase(
    clase_id: str,
    request: UpdateClaseRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar clases"}
            )
        
        from app.infrastructure.db.models import ClaseModel
        clase_model = db.query(ClaseModel).filter(ClaseModel.id == clase_id, ClaseModel.status == "ACTIVO").first()
        
        if not clase_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Clase no encontrada"}
            )
        
        if request.curso_id is not None:
            clase_model.curso_id = request.curso_id
        if request.seccion_id is not None:
            clase_model.seccion_id = request.seccion_id
        if request.periodo_id is not None:
            clase_model.periodo_id = request.periodo_id
        if request.docente_user_id is not None:
            clase_model.docente_user_id = request.docente_user_id
        
        db.commit()
        db.refresh(clase_model)
        
        return {
            "id": clase_model.id,
            "curso_id": clase_model.curso_id,
            "seccion_id": clase_model.seccion_id,
            "periodo_id": clase_model.periodo_id,
            "docente_user_id": clase_model.docente_user_id,
            "status": clase_model.status,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/clases/{clase_id}")
async def delete_clase(
    clase_id: str,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar clases"}
            )
        
        from app.infrastructure.db.models import ClaseModel
        clase_model = db.query(ClaseModel).filter(ClaseModel.id == clase_id).first()
        
        if not clase_model:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Clase no encontrada"}
            )
        
        clase_model.status = "CANCELADA"  # ENUM: ACTIVA, FINALIZADA, CANCELADA
        db.commit()
        
        return {"message": "Clase eliminada correctamente", "id": clase_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.get("/clases/docente")
async def get_clases_docente(
    periodo_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get("user_id")
        rol = payload.get("rol_nombre")
        
        if rol not in ["DOCENTE", "ADMIN"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo DOCENTE o ADMIN"}
            )
        
        from app.infrastructure.db.repositories import SqlAlchemyClaseRepository
        repo = SqlAlchemyClaseRepository(db)
        clases = repo.find_by_docente(user_id, periodo_id)
        
        return {
            "clases": [
                {
                    "id": c.id,
                    "curso_id": c.curso_id,
                    "seccion_id": c.seccion_id,
                    "periodo_id": c.periodo_id,
                    "status": c.status,
                } for c in clases
            ],
            "total": len(clases),
        }
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": e.code, "message": e.message}
        )


@router.get("/escalas")
async def list_escalas(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Listar escalas de calificación"""
    try:
        from app.infrastructure.db.repositories import SqlAlchemyEscalaCalificacionRepository
        repo = SqlAlchemyEscalaCalificacionRepository(db)
        escalas = repo.find_all(offset=offset, limit=limit)
        return {
            "escalas": [
                {
                    "id": e.id,
                    "nombre": e.nombre,
                    "tipo": e.tipo.value if hasattr(e.tipo, 'value') else e.tipo,
                    "valor_minimo": float(e.valor_minimo) if e.valor_minimo else None,
                    "valor_maximo": float(e.valor_maximo) if e.valor_maximo else None,
                    "status": e.status,
                } for e in escalas
            ],
            "total": len(escalas),
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )
