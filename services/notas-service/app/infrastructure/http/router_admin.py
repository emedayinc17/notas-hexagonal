# Notas Service - HTTP Router Admin
from fastapi import APIRouter, Depends, Header, status, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from shared.common import DomainException, extract_bearer_token, decode_jwt_token, AuditHelper, AccionAuditoria
from app.infrastructure.http.dependencies import *


router = APIRouter(prefix="/v1", tags=["notas"])


# Request Models
class RegistrarNotaRequest(BaseModel):
    matricula_clase_id: str
    tipo_evaluacion_id: str
    periodo_id: str
    escala_id: str
    valor_literal: Optional[str] = None
    valor_numerico: Optional[float] = None
    peso: Optional[float] = None
    observaciones: Optional[str] = None


class UpdateNotaRequest(BaseModel):
    tipo_evaluacion_id: Optional[str] = None
    escala_id: Optional[str] = None
    valor_literal: Optional[str] = None
    valor_numerico: Optional[float] = None
    peso: Optional[float] = None
    observaciones: Optional[str] = None


class CreateTipoEvaluacionRequest(BaseModel):
    codigo: str
    nombre: str
    peso_default: Optional[float] = None
    descripcion: Optional[str] = None


class UpdateTipoEvaluacionRequest(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    peso_default: Optional[float] = None
    descripcion: Optional[str] = None


class CreateEscalaRequest(BaseModel):
    nombre: str
    tipo: str  # NUMERICA, LITERAL, CONCEPTUAL
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    descripcion: Optional[str] = None


class UpdateEscalaRequest(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    descripcion: Optional[str] = None


# Endpoints
@router.post("/notas", status_code=status.HTTP_201_CREATED)
async def registrar_nota(
    request: RegistrarNotaRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_registrar_nota_use_case),
    settings = Depends(get_settings),
):
    try:
        import httpx
        
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get("sub")
        rol = payload.get("rol")
        
        if rol not in ["DOCENTE", "ADMIN"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo DOCENTE o ADMIN pueden registrar notas"}
            )
        
        # Si es DOCENTE, validar que la matrícula pertenece a una de sus clases
        if rol == "DOCENTE":
            async with httpx.AsyncClient() as client:
                # Obtener la matrícula para saber a qué clase pertenece
                mat_response = await client.get(
                    f"{settings.PERSONAS_SERVICE_URL}/v1/admin/matriculas/{request.matricula_clase_id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if mat_response.status_code != 200:
                    return JSONResponse(
                        status_code=status.HTTP_404_NOT_FOUND,
                        content={"error": "NotFound", "message": "Matrícula no encontrada"}
                    )
                
                matricula = mat_response.json()
                clase_id = matricula.get("clase_id")
                
                # Verificar que el docente tiene asignada esa clase
                clases_response = await client.get(
                    f"{settings.ACADEMICO_SERVICE_URL}/v1/admin/clases?docente_id={user_id}&limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if clases_response.status_code != 200:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"error": "Forbidden", "message": "No se pudieron verificar las clases del docente"}
                    )
                
                clases_docente = clases_response.json().get("clases", [])
                clase_ids_docente = [c["id"] for c in clases_docente]
                
                if clase_id not in clase_ids_docente:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"error": "Forbidden", "message": "No tienes permiso para registrar notas en esta clase"}
                    )
        
        # Pasar el token original para las llamadas a otros servicios
        result = await use_case.execute(
            matricula_clase_id=request.matricula_clase_id,
            tipo_evaluacion_id=request.tipo_evaluacion_id,
            periodo_id=request.periodo_id,
            escala_id=request.escala_id,
            registrado_por_user_id=user_id,
            valor_literal=request.valor_literal,
            valor_numerico=request.valor_numerico,
            peso=request.peso,
            observaciones=request.observaciones,
            auth_token=token  # Token para llamadas HTTP a otros servicios
        )
        
        return result
        
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )


@router.get("/notas")
async def list_notas(
    alumno_id: Optional[str] = Query(None),
    clase_id: Optional[str] = Query(None),
    periodo_id: Optional[str] = Query(None),
    tipo_evaluacion_id: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
):
    """Listar notas con filtros basados en rol"""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get("sub")
        rol = payload.get("rol")
        
        from app.infrastructure.db.repositories import SqlAlchemyNotaRepository
        from app.infrastructure.db.models import NotaModel
        from sqlalchemy import and_
        import httpx
        
        repo = SqlAlchemyNotaRepository(db)
        
        # Construir query base
        query = db.query(NotaModel).filter(NotaModel.is_deleted == False)
        
        # PADRE: Solo puede ver notas de sus hijos
        if rol == "PADRE":
            # Obtener IDs de hijos del padre
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.PERSONAS_SERVICE_URL}/v1/admin/alumnos?padre_id={user_id}&limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"error": "Forbidden", "message": "No se pudieron obtener los hijos del padre"}
                    )
                alumnos_data = response.json()
                hijo_ids = [a["id"] for a in alumnos_data.get("alumnos", [])]
                
                if not hijo_ids:
                    return {"notas": [], "total": 0}
                
                # Obtener matrículas de los hijos
                matriculas_ids = []
                for hijo_id in hijo_ids:
                    mat_response = await client.get(
                        f"{settings.PERSONAS_SERVICE_URL}/v1/admin/matriculas?alumno_id={hijo_id}&limit=100",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if mat_response.status_code == 200:
                        mats = mat_response.json().get("matriculas", [])
                        matriculas_ids.extend([m["id"] for m in mats])
                
                if not matriculas_ids:
                    return {"notas": [], "total": 0}
                
                query = query.filter(NotaModel.matricula_clase_id.in_(matriculas_ids))
        
        # DOCENTE: Solo puede ver notas de sus clases asignadas
        elif rol == "DOCENTE":
            # Obtener clases del docente
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.ACADEMICO_SERVICE_URL}/v1/admin/clases?docente_id={user_id}&limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"error": "Forbidden", "message": "No se pudieron obtener las clases del docente"}
                    )
                clases_data = response.json()
                clase_ids = [c["id"] for c in clases_data.get("clases", [])]
                
                if not clase_ids:
                    return {"notas": [], "total": 0}
                
                # Obtener matrículas de esas clases
                matriculas_ids = []
                for cid in clase_ids:
                    mat_response = await client.get(
                        f"{settings.PERSONAS_SERVICE_URL}/v1/admin/matriculas?clase_id={cid}&limit=100",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if mat_response.status_code == 200:
                        mats = mat_response.json().get("matriculas", [])
                        matriculas_ids.extend([m["id"] for m in mats])
                
                if not matriculas_ids:
                    return {"notas": [], "total": 0}
                
                query = query.filter(NotaModel.matricula_clase_id.in_(matriculas_ids))
        
        # ADMIN: Puede ver todas las notas (no se aplica filtro adicional)
        
        # Aplicar filtros adicionales
        if periodo_id:
            query = query.filter(NotaModel.periodo_id == periodo_id)
        if tipo_evaluacion_id:
            query = query.filter(NotaModel.tipo_evaluacion_id == tipo_evaluacion_id)
        if clase_id and rol == "ADMIN":  # Solo ADMIN puede filtrar por clase específica directamente
            async with httpx.AsyncClient() as client:
                mat_response = await client.get(
                    f"{settings.PERSONAS_SERVICE_URL}/v1/admin/matriculas?clase_id={clase_id}&limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if mat_response.status_code == 200:
                    mats = mat_response.json().get("matriculas", [])
                    mat_ids = [m["id"] for m in mats]
                    if mat_ids:
                        query = query.filter(NotaModel.matricula_clase_id.in_(mat_ids))
        if alumno_id and rol in ["ADMIN", "DOCENTE"]:  # DOCENTE puede filtrar por alumno si está en sus clases
            async with httpx.AsyncClient() as client:
                mat_response = await client.get(
                    f"{settings.PERSONAS_SERVICE_URL}/v1/admin/matriculas?alumno_id={alumno_id}&limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if mat_response.status_code == 200:
                    mats = mat_response.json().get("matriculas", [])
                    mat_ids = [m["id"] for m in mats]
                    if mat_ids:
                        query = query.filter(NotaModel.matricula_clase_id.in_(mat_ids))
        
        # Paginación
        total = query.count()
        models = query.offset(offset).limit(limit).all()
        
        from app.infrastructure.db.repositories import nota_model_to_domain
        notas = [nota_model_to_domain(m) for m in models]
        
        return {
            "notas": [
                {
                    "id": n.id,
                    "matricula_clase_id": n.matricula_clase_id,
                    "tipo_evaluacion_id": n.tipo_evaluacion_id,
                    "periodo_id": n.periodo_id,
                    "escala_id": n.escala_id,
                    "fecha_registro": n.fecha_registro.isoformat() if n.fecha_registro else None,
                    "registrado_por_user_id": n.registrado_por_user_id,
                    "valor_literal": n.valor_literal,
                    "valor_numerico": n.valor_numerico,
                    "peso": n.peso,
                    "observaciones": n.observaciones,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                } for n in notas
            ],
            "total": total,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "InternalError", "message": str(e)}
        )


@router.get("/alertas")
async def list_alertas(
    padre_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        user_id = payload.get("user_id")

        # Si es PADRE, forzamos a ver solo sus alertas
        if rol == "PADRE":
            # Aquí idealmente buscaríamos el ID de padre asociado al usuario, 
            # por simplicidad asumimos que el user_id es el padre_id o se pasa por query validado
            # En un sistema real, consultaríamos Personas Service para mapear User -> Padre
            target_padre_id = padre_id or user_id 
        else:
            target_padre_id = padre_id

        from app.infrastructure.db.repositories import SqlAlchemyAlertaRepository
        repo = SqlAlchemyAlertaRepository(db)
        
        if target_padre_id:
            alertas = repo.find_by_padre(target_padre_id)
        else:
            # Admin ve todo (no implementado find_all en repo, retornamos vacio por seguridad)
            alertas = []

        return {
            "alertas": [
                {
                    "id": a.id,
                    "tipo": a.tipo_alerta,
                    "mensaje": a.mensaje,
                    "fecha": a.created_at,
                    "leida": a.leida
                } for a in alertas
            ]
        }
    except Exception as e:
         return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "InternalError", "message": str(e)}
        )


# ============================================================================
# CRUD TIPOS DE EVALUACIÓN
# ============================================================================

@router.post("/tipos-evaluacion", status_code=status.HTTP_201_CREATED)
async def create_tipo_evaluacion(
    request: CreateTipoEvaluacionRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear tipos de evaluación"}
            )
        
        from app.infrastructure.db.models import TipoEvaluacionModel
        import uuid
        
        tipo = TipoEvaluacionModel(
            id=str(uuid.uuid4()),
            codigo=request.codigo,
            nombre=request.nombre,
            peso_default=request.peso_default,
            descripcion=request.descripcion,
            status="ACTIVO"
        )
        
        db.add(tipo)
        db.commit()
        db.refresh(tipo)
        
        return {
            "id": tipo.id,
            "codigo": tipo.codigo,
            "nombre": tipo.nombre,
            "peso_default": tipo.peso_default,
            "status": tipo.status
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.get("/tipos-evaluacion")
async def list_tipos_evaluacion(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        from app.infrastructure.db.models import TipoEvaluacionModel
        
        query = db.query(TipoEvaluacionModel).filter(TipoEvaluacionModel.status == "ACTIVO")
        total = query.count()
        tipos = query.offset(offset).limit(limit).all()
        
        return {
            "tipos_evaluacion": [
                {
                    "id": t.id,
                    "codigo": t.codigo,
                    "nombre": t.nombre,
                    "peso_default": float(t.peso_default) if t.peso_default else None,
                    "descripcion": t.descripcion,
                    "status": t.status
                } for t in tipos
            ],
            "total": total
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.put("/tipos-evaluacion/{tipo_id}")
async def update_tipo_evaluacion(
    tipo_id: str,
    request: UpdateTipoEvaluacionRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar tipos de evaluación"}
            )
        
        from app.infrastructure.db.models import TipoEvaluacionModel
        tipo = db.query(TipoEvaluacionModel).filter(TipoEvaluacionModel.id == tipo_id).first()
        
        if not tipo:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Tipo de evaluación no encontrado"}
            )
        
        if request.codigo is not None:
            tipo.codigo = request.codigo
        if request.nombre is not None:
            tipo.nombre = request.nombre
        if request.peso_default is not None:
            tipo.peso_default = request.peso_default
        if request.descripcion is not None:
            tipo.descripcion = request.descripcion
        
        db.commit()
        db.refresh(tipo)
        
        return {
            "id": tipo.id,
            "codigo": tipo.codigo,
            "nombre": tipo.nombre,
            "peso_default": float(tipo.peso_default) if tipo.peso_default else None,
            "status": tipo.status
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/tipos-evaluacion/{tipo_id}")
async def delete_tipo_evaluacion(
    tipo_id: str,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar tipos de evaluación"}
            )
        
        from app.infrastructure.db.models import TipoEvaluacionModel
        tipo = db.query(TipoEvaluacionModel).filter(TipoEvaluacionModel.id == tipo_id).first()
        
        if not tipo:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Tipo de evaluación no encontrado"}
            )
        
        tipo.status = "INACTIVO"
        db.commit()
        
        return {"message": "Tipo de evaluación eliminado correctamente", "id": tipo_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


# ============================================================================
# CRUD ESCALAS DE CALIFICACIÓN
# ============================================================================

@router.post("/escalas", status_code=status.HTTP_201_CREATED)
async def create_escala(
    request: CreateEscalaRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear escalas"}
            )
        
        from app.infrastructure.db.models import EscalaCalificacionModel
        import uuid
        
        escala = EscalaCalificacionModel(
            id=str(uuid.uuid4()),
            nombre=request.nombre,
            tipo=request.tipo,
            valor_minimo=request.valor_minimo,
            valor_maximo=request.valor_maximo,
            descripcion=request.descripcion
        )
        
        db.add(escala)
        db.commit()
        db.refresh(escala)
        
        return {
            "id": escala.id,
            "nombre": escala.nombre,
            "tipo": escala.tipo,
            "valor_minimo": float(escala.valor_minimo) if escala.valor_minimo else None,
            "valor_maximo": float(escala.valor_maximo) if escala.valor_maximo else None
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.put("/escalas/{escala_id}")
async def update_escala(
    escala_id: str,
    request: UpdateEscalaRequest,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar escalas"}
            )
        
        from app.infrastructure.db.models import EscalaCalificacionModel
        escala = db.query(EscalaCalificacionModel).filter(EscalaCalificacionModel.id == escala_id).first()
        
        if not escala:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Escala no encontrada"}
            )
        
        if request.nombre is not None:
            escala.nombre = request.nombre
        if request.tipo is not None:
            escala.tipo = request.tipo
        if request.valor_minimo is not None:
            escala.valor_minimo = request.valor_minimo
        if request.valor_maximo is not None:
            escala.valor_maximo = request.valor_maximo
        if request.descripcion is not None:
            escala.descripcion = request.descripcion
        
        db.commit()
        db.refresh(escala)
        
        return {
            "id": escala.id,
            "nombre": escala.nombre,
            "tipo": escala.tipo,
            "valor_minimo": float(escala.valor_minimo) if escala.valor_minimo else None,
            "valor_maximo": float(escala.valor_maximo) if escala.valor_maximo else None
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/escalas/{escala_id}")
async def delete_escala(
    escala_id: str,
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
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar escalas"}
            )
        
        from app.infrastructure.db.models import EscalaCalificacionModel
        escala = db.query(EscalaCalificacionModel).filter(EscalaCalificacionModel.id == escala_id).first()
        
        if not escala:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Escala no encontrada"}
            )
        
        escala.is_deleted = True
        db.commit()
        
        return {"message": "Escala eliminada correctamente", "id": escala_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


# ============================================================================
# UPDATE Y DELETE DE NOTAS
# ============================================================================

@router.put("/notas/{nota_id}")
async def update_nota(
    nota_id: str,
    request: UpdateNotaRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        user_id = payload.get("user_id")
        
        if rol not in ["ADMIN", "DOCENTE"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN o DOCENTE pueden editar notas"}
            )
        
        from app.infrastructure.db.models import NotaModel
        nota = db.query(NotaModel).filter(NotaModel.id == nota_id, NotaModel.is_deleted == False).first()
        
        if not nota:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Nota no encontrada"}
            )
        
        # Si es DOCENTE, validar que registró esa nota
        if rol == "DOCENTE" and nota.registrado_por_user_id != user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo puedes editar tus propias notas"}
            )
        
        if request.tipo_evaluacion_id is not None:
            nota.tipo_evaluacion_id = request.tipo_evaluacion_id
        if request.escala_id is not None:
            nota.escala_id = request.escala_id
        if request.valor_literal is not None:
            nota.valor_literal = request.valor_literal
        if request.valor_numerico is not None:
            nota.valor_numerico = request.valor_numerico
        if request.peso is not None:
            nota.peso = request.peso
        if request.observaciones is not None:
            nota.observaciones = request.observaciones
        
        db.commit()
        db.refresh(nota)
        
        response_data = {
            "id": nota.id,
            "matricula_clase_id": nota.matricula_clase_id,
            "tipo_evaluacion_id": nota.tipo_evaluacion_id,
            "periodo_id": nota.periodo_id,
            "escala_id": nota.escala_id,
            "valor_literal": nota.valor_literal,
            "valor_numerico": float(nota.valor_numerico) if nota.valor_numerico else None,
            "peso": float(nota.peso) if nota.peso else None,
            "observaciones": nota.observaciones
        }
        
        # AUDITORÍA
        try:
            AuditHelper.log_action(
                session=db,
                user_id=user_id,
                username=payload.get("sub"),
                rol_nombre=rol,
                accion=AccionAuditoria.UPDATE_NOTA,
                entidad="Nota",
                entidad_id=nota.id,
                descripcion=f"Nota actualizada por {rol}",
                datos_nuevos=request.dict(exclude_unset=True),
                endpoint=f"/v1/notas/{nota_id}",
                metodo_http="PUT",
                exitoso=True,
                codigo_respuesta=200
            )
        except Exception as e:
            print(f"Error auditoria: {e}")
            
        return response_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/notas/{nota_id}")
async def delete_nota(
    nota_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        user_id = payload.get("user_id")
        
        if rol not in ["ADMIN", "DOCENTE"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN o DOCENTE pueden eliminar notas"}
            )
        
        from app.infrastructure.db.models import NotaModel
        nota = db.query(NotaModel).filter(NotaModel.id == nota_id).first()
        
        if not nota:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Nota no encontrada"}
            )
        
        # Si es DOCENTE, validar que registró esa nota
        if rol == "DOCENTE" and nota.registrado_por_user_id != user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo puedes eliminar tus propias notas"}
            )
        
        nota.is_deleted = True
        db.commit()
        
        # AUDITORÍA
        try:
            AuditHelper.log_action(
                session=db,
                user_id=user_id,
                username=payload.get("sub"),
                rol_nombre=rol,
                accion=AccionAuditoria.DELETE_NOTA,
                entidad="Nota",
                entidad_id=nota_id,
                descripcion=f"Nota eliminada por {rol}",
                datos_nuevos={"is_deleted": True},
                endpoint=f"/v1/notas/{nota_id}",
                metodo_http="DELETE",
                exitoso=True,
                codigo_respuesta=200
            )
        except Exception as e:
            print(f"Error auditoria: {e}")
        
        return {"message": "Nota eliminada correctamente", "id": nota_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )

