# IAM Service - HTTP Router Docente
from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import JSONResponse
from typing import Optional
from shared.common import (
    extract_bearer_token,
    decode_jwt_token,
)
from app.infrastructure.http.dependencies import get_settings


router = APIRouter(prefix="/v1/docentes", tags=["docentes"])


@router.get("/perfil")
async def get_perfil_docente(
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
):
    """Obtener perfil del docente autenticado"""
    try:
        # Extraer y decodificar token
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        # Verificar que sea DOCENTE
        if rol != "DOCENTE":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo docentes pueden acceder a este endpoint"}
            )
        
        # Retornar información básica del docente desde el token
        return {
            "id": payload.get("user_id"),
            "username": payload.get("username"),
            "email": payload.get("email"),
            "nombres": payload.get("nombres"),
            "apellidos": payload.get("apellidos"),
            "rol": {
                "id": payload.get("rol_id"),
                "nombre": payload.get("rol_nombre")
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Unauthorized", "message": "Token inválido"}
        )


@router.get("/colegas")
async def list_docentes(
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
):
    """Listar otros docentes (información básica para colaboración)"""
    try:
        # Extraer y decodificar token
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        # Verificar que sea DOCENTE
        if rol != "DOCENTE":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo docentes pueden acceder a este endpoint"}
            )
        
        # TODO: Implementar lógica para listar docentes (sin datos sensibles)
        # Por ahora retornamos lista vacía para cumplir con el contrato
        return {
            "docentes": [],
            "total": 0,
            "message": "Funcionalidad en desarrollo"
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Unauthorized", "message": "Token inválido"}
        )