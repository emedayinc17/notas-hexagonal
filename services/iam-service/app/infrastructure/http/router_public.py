# IAM Service - HTTP Router Public
from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from shared.common import (
    DomainException,
    extract_bearer_token,
    decode_jwt_token,
)
from app.infrastructure.http.dependencies import (
    get_register_user_use_case,
    get_login_use_case,
    get_current_user_use_case,
    get_settings,
)


router = APIRouter(prefix="/v1", tags=["auth"])


# Schemas
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    rol_nombre: str  # ADMIN, DOCENTE, PADRE
    nombres: Optional[str] = None
    apellidos: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Endpoints
@router.post("/auth/register",status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    use_case = Depends(get_register_user_use_case),
):
    """Registrar nuevo usuario"""
    try:
        usuario = use_case.execute(
            username=request.username,
            email=request.email,
            password=request.password,
            rol_nombre=request.rol_nombre,
            nombres=request.nombres,
            apellidos=request.apellidos,
        )
        return usuario.to_dict_safe()
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )


@router.post("/auth/login")
async def login(
    request: LoginRequest,
    use_case = Depends(get_login_use_case),
):
    """Login y obtener JWT token"""
    try:
        result = use_case.execute(
            email=request.email,
            password=request.password,
        )
        return result
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": e.code, "message": e.message}
        )


@router.get("/users/me")
async def get_current_user(
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_current_user_use_case),
    settings = Depends(get_settings),
):
    """Obtener información del usuario actual"""
    try:
        # Extraer y decodificar token
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get("user_id")
        
        # Obtener usuario
        usuario = use_case.execute(user_id)
        return usuario
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": e.code, "message": e.message}
        )
