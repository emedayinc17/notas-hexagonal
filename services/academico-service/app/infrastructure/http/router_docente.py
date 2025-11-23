# Académico Service - HTTP Router Docente
from fastapi import APIRouter, Depends, Header, status, Query
from fastapi.responses import JSONResponse
from typing import Optional
from shared.common import DomainException, extract_bearer_token, decode_jwt_token
from app.infrastructure.http.dependencies import get_settings
from sqlalchemy.orm import Session
from app.infrastructure.http.dependencies import get_db


router = APIRouter(prefix="/v1/docente", tags=["docente"])


@router.get("/clases")
async def get_mis_clases(
    periodo_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    """Obtener clases asignadas al docente autenticado"""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get("user_id")
        rol = payload.get("rol_nombre")
        
        if rol != "DOCENTE":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo DOCENTE puede ver sus clases"}
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
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.get("/clases/{clase_id}/verificar")
async def verificar_acceso_clase(
    clase_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    """Verificar que el docente tiene acceso a una clase específica"""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get("user_id")
        rol = payload.get("rol_nombre")
        
        if rol != "DOCENTE":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo DOCENTE"}
            )
        
        from app.infrastructure.db.models import ClaseModel
        clase = db.query(ClaseModel).filter(
            ClaseModel.id == clase_id,
            ClaseModel.docente_user_id == user_id,
            ClaseModel.status == "ACTIVA"
        ).first()
        
        if not clase:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "No tienes acceso a esta clase"}
            )
        
        return {
            "verified": True,
            "clase_id": clase_id,
            "docente_id": user_id
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.get("/clases/{clase_id}/alumnos")
async def get_alumnos_clase_docente(
    clase_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    """Obtener alumnos de una clase específica del docente"""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get("user_id")
        rol = payload.get("rol_nombre")
        
        if rol != "DOCENTE":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo DOCENTE puede ver alumnos"}
            )
        
        # Verificar que la clase pertenece al docente
        from app.infrastructure.db.models import ClaseModel
        clase = db.query(ClaseModel).filter(
            ClaseModel.id == clase_id,
            ClaseModel.docente_user_id == user_id,
            ClaseModel.status == "ACTIVA"
        ).first()
        
        if not clase:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "No tienes acceso a esta clase"}
            )
        
        # Hacer llamada al servicio de personas
        import httpx
        async with httpx.AsyncClient() as client:
            personas_url = f"http://localhost:8003/v1/docente/clases/{clase_id}/alumnos"
            headers = {"Authorization": authorization} if authorization else {}
            
            response = await client.get(personas_url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"error": "NotFound", "message": "Clase no encontrada o sin alumnos matriculados"}
                )
            else:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={"error": "INTERNAL_ERROR", "message": "Error al obtener alumnos"}
                )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )