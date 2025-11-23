# IAM Service - HTTP Router Admin
from fastapi import APIRouter, Depends, Header, status, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from shared.common import (
    DomainException,
    extract_bearer_token,
    decode_jwt_token,
)
from app.infrastructure.http.dependencies import (
    get_list_users_use_case,
    get_register_user_use_case,
    get_settings,
)


router = APIRouter(prefix="/v1/admin", tags=["admin"])


# Request Models
class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    rol_nombre: str
    nombres: Optional[str] = None
    apellidos: Optional[str] = None


class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    rol_nombre: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    status: Optional[str] = None


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    request: CreateUserRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_register_user_use_case),
    settings = Depends(get_settings),
):
    """Crear nuevo usuario (solo ADMIN)"""
    try:
        # Extraer y decodificar token
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        current_user_rol = payload.get("rol_nombre")
        
        # Validar que sea ADMIN
        if current_user_rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear usuarios"}
            )
        
        # Ejecutar caso de uso
        usuario = use_case.execute(
            username=request.username,
            email=request.email,
            password=request.password,
            rol_nombre=request.rol_nombre,
            nombres=request.nombres,
            apellidos=request.apellidos,
        )
        
        return {
            "id": usuario.id,
            "message": "Usuario creado exitosamente",
            "username": usuario.username,
            "email": usuario.email,
            "rol": usuario.rol.nombre if usuario.rol else None,
            "nombres": usuario.nombres,
            "apellidos": usuario.apellidos,
            "status": usuario.status,
        }
        
    except DomainException as e:
        status_code = status.HTTP_403_FORBIDDEN if "Forbidden" in e.__class__.__name__ else status.HTTP_400_BAD_REQUEST
        return JSONResponse(
            status_code=status_code,
            content={"error": e.code, "message": e.message}
        )


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
):
    """Actualizar usuario existente (solo ADMIN)"""
    try:
        from app.infrastructure.db.repositories import SqlAlchemyUsuarioRepository, SqlAlchemyRolRepository
        from app.infrastructure.db.models import UsuarioModel
        from shared.common import hash_password
        from app.main import SessionLocal
        
        # Extraer y decodificar token
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        current_user_rol = payload.get("rol_nombre")
        
        # Validar que sea ADMIN
        if current_user_rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar usuarios"}
            )
        
        # Obtener sesión de base de datos
        db = SessionLocal()
        
        try:
            # Buscar el modelo directamente
            usuario_model = db.query(UsuarioModel).filter(
                UsuarioModel.id == user_id,
                UsuarioModel.is_deleted == False
            ).first()
            
            if not usuario_model:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"error": "NotFound", "message": "Usuario no encontrado"}
                )
            
            # Actualizar campos si se proporcionan
            if request.email is not None:
                usuario_model.email = request.email
            
            if request.password is not None and request.password.strip():
                usuario_model.password_hash = hash_password(request.password)
            
            if request.rol_nombre is not None:
                rol_repo = SqlAlchemyRolRepository(db)
                rol = rol_repo.find_by_nombre(request.rol_nombre)
                if rol:
                    usuario_model.rol_id = rol.id
            
            if request.nombres is not None:
                usuario_model.nombres = request.nombres
            
            if request.apellidos is not None:
                usuario_model.apellidos = request.apellidos
            
            if request.status is not None:
                usuario_model.status = request.status
            
            # Guardar cambios
            db.commit()
            db.refresh(usuario_model)
            
            # Cargar el rol para la respuesta
            rol_nombre = usuario_model.rol.nombre if usuario_model.rol else None
            
            return {
                "message": "Usuario actualizado exitosamente",
                "user": {
                    "id": usuario_model.id,
                    "username": usuario_model.username,
                    "email": usuario_model.email,
                    "rol": {"nombre": rol_nombre} if rol_nombre else None,
                    "nombres": usuario_model.nombres,
                    "apellidos": usuario_model.apellidos,
                    "status": usuario_model.status,
                }
            }
            
        finally:
            db.close()
        
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "InternalError", "message": str(e)}
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
):
    """Eliminar usuario (soft delete, solo ADMIN)"""
    try:
        from app.infrastructure.db.models import UsuarioModel
        from app.main import SessionLocal
        
        # Extraer y decodificar token
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        current_user_rol = payload.get("rol_nombre")
        
        # Validar que sea ADMIN
        if current_user_rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar usuarios"}
            )
        
        # Obtener sesión de base de datos
        db = SessionLocal()
        
        try:
            # Buscar el modelo directamente
            usuario_model = db.query(UsuarioModel).filter(
                UsuarioModel.id == user_id,
                UsuarioModel.is_deleted == False
            ).first()
            
            if not usuario_model:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"error": "NotFound", "message": "Usuario no encontrado"}
                )
            
            # Soft delete
            usuario_model.is_deleted = True
            usuario_model.status = "INACTIVO"
            
            db.commit()
            
            return {
                "message": "Usuario eliminado exitosamente"
            }
            
        finally:
            db.close()
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "InternalError", "message": str(e)}
        )


@router.get("/users")
async def list_users(
    rol_nombre: Optional[str] = Query(None),
    user_status: Optional[str] = Query(None, alias="status"),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_list_users_use_case),
    settings = Depends(get_settings),
):
    """Listar usuarios (solo ADMIN)"""
    try:
        # Extraer y decodificar token
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        current_user_rol = payload.get("rol_nombre")
        
        # Ejecutar caso de uso
        result = use_case.execute(
            current_user_rol=current_user_rol,
            rol_nombre=rol_nombre,
            status=user_status,
            offset=offset,
            limit=limit,
        )
        return result
    except DomainException as e:
        status_code = status.HTTP_403_FORBIDDEN if "Forbidden" in e.__class__.__name__ else status.HTTP_400_BAD_REQUEST
        return JSONResponse(
            status_code=status_code,
            content={"error": e.code, "message": e.message}
        )
