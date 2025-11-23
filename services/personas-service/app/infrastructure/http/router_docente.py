# Personas Service - HTTP Router Docente
from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import JSONResponse
from typing import Optional
from shared.common import DomainException, extract_bearer_token, decode_jwt_token
from app.infrastructure.http.dependencies import get_settings
from sqlalchemy.orm import Session
from app.infrastructure.http.dependencies import get_db


router = APIRouter(prefix="/v1/docente", tags=["docente"])


@router.get("/clases/{clase_id}/alumnos")
async def get_alumnos_por_clase(
    clase_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    """Obtener alumnos matriculados en una clase específica - Solo DOCENTE"""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get("user_id")
        rol = payload.get("rol_nombre")
        
        if not rol or rol.upper() != "DOCENTE":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": f"Solo DOCENTE puede ver alumnos de clases. Rol: {rol}"}
            )
        
        # Verificar que la clase pertenece al docente (llamada al servicio académico)
        import httpx
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": authorization} if authorization else {}
            academico_url = f"http://localhost:8002/v1/docente/clases/{clase_id}/verificar"
            
            verification_response = await client.get(academico_url, headers=headers)
            
            if verification_response.status_code != 200:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": "Forbidden", "message": "No tienes acceso a esta clase"}
                )
        
        # Obtener alumnos matriculados en la clase
        from app.infrastructure.db.models import AlumnoModel, MatriculaClaseModel
        results = db.query(AlumnoModel, MatriculaClaseModel).join(
            MatriculaClaseModel,
            AlumnoModel.id == MatriculaClaseModel.alumno_id
        ).filter(
            MatriculaClaseModel.clase_id == clase_id,
            MatriculaClaseModel.status == 'ACTIVO',
            MatriculaClaseModel.is_deleted == False,
            AlumnoModel.status == 'ACTIVO',
            AlumnoModel.is_deleted == False
        ).all()
        
        return {
            "alumnos": [
                {
                    "id": a.id,
                    "matricula_clase_id": m.id,
                    "codigo_alumno": a.codigo_alumno,
                    "nombres": a.nombres,
                    "apellidos": f"{a.apellido_paterno} {a.apellido_materno or ''}".strip(),
                    "dni": a.dni,
                    "status": a.status
                } for a, m in results
            ],
            "total": len(results),
            "clase_id": clase_id
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )