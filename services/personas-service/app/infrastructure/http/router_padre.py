# Personas Service - HTTP Router Padre
from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import JSONResponse
from typing import Optional
from sqlalchemy.orm import Session
from shared.common import extract_bearer_token, decode_jwt_token
from app.infrastructure.http.dependencies import *


router = APIRouter(prefix="/v1/padres", tags=["padres"])


@router.get("/mis-hijos")
async def get_mis_hijos(
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    """
    Obtiene los hijos del padre actual desde su token JWT
    Solo padres pueden acceder
    """
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        
        user_id = payload.get("user_id")
        rol = payload.get("rol_nombre")
        
        if rol != "PADRE":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo padres pueden acceder"}
            )
        
        # Encontrar el padre por user_id
        from app.infrastructure.db.models import PadreModel
        padre = db.query(PadreModel).filter(
            PadreModel.user_id == user_id,
            PadreModel.is_deleted == False
        ).first()
        
        if not padre:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Padre no encontrado"}
            )
        
        # Obtener hijos usando el endpoint existente
        from app.infrastructure.db.repositories import SqlAlchemyRelacionPadreAlumnoRepository, SqlAlchemyAlumnoRepository
        relacion_repo = SqlAlchemyRelacionPadreAlumnoRepository(db)
        alumno_repo = SqlAlchemyAlumnoRepository(db)

        relaciones = relacion_repo.find_by_padre(padre.id)
        hijos_json = []
        
        for rel in relaciones:
            alumno = alumno_repo.find_by_id(rel.alumno_id)
            if not alumno:
                continue
            hijos_json.append({
                "id": alumno.id,  # Para compatibilidad con notas-hijos.js
                "relacion_id": rel.id,
                "alumno_id": alumno.id,
                "nombres": alumno.nombres,
                "apellido_paterno": alumno.apellido_paterno,
                "apellido_materno": alumno.apellido_materno,
                "apellidos": f"{alumno.apellido_paterno} {alumno.apellido_materno}".strip(),
                "dni": alumno.dni,
                "tipo_relacion": rel.tipo_relacion,
                "status": alumno.status,
            })

        return {"hijos": hijos_json}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.get("/perfil")
async def get_mi_perfil(
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    """
    Obtiene el perfil del padre actual
    Solo padres pueden acceder
    """
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        
        user_id = payload.get("user_id")
        rol = payload.get("rol_nombre")
        
        if rol != "PADRE":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo padres pueden acceder"}
            )
        
        # Encontrar el padre por user_id
        from app.infrastructure.db.models import PadreModel
        padre = db.query(PadreModel).filter(
            PadreModel.user_id == user_id,
            PadreModel.is_deleted == False
        ).first()
        
        if not padre:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Padre no encontrado"}
            )
        
        return {
            "id": padre.id,
            "nombres": padre.nombres,
            "apellido_paterno": padre.apellido_paterno,
            "apellido_materno": padre.apellido_materno,
            "apellidos": f"{padre.apellido_paterno} {padre.apellido_materno}".strip(),
            "email": padre.email,
            "dni": padre.dni,
            "celular": padre.celular,
            "direccion": padre.direccion if hasattr(padre, 'direccion') else None,
            "ocupacion": padre.ocupacion if hasattr(padre, 'ocupacion') else None,
            "status": padre.status,
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )