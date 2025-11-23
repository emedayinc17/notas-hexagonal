# Shared Common - JWT Utils
from datetime import datetime, timedelta
from typing import Dict, Optional
from jose import JWTError, jwt
from .exceptions import UnauthorizedException


def create_jwt_token(
    payload: Dict,
    secret_key: str,
    algorithm: str = "HS256",
    expiration_minutes: int = 1440
) -> str:
    """Crea un JWT token"""
    to_encode = payload.copy()
    expire = datetime.utcnow() + timedelta(minutes=expiration_minutes)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def decode_jwt_token(
    token: str,
    secret_key: str,
    algorithm: str = "HS256"
) -> Dict:
    """Decodifica y valida un JWT token"""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except JWTError as e:
        raise UnauthorizedException(f"Token inválido: {str(e)}")


def extract_bearer_token(authorization: Optional[str]) -> str:
    """Extrae el token del header Authorization"""
    if not authorization:
        raise UnauthorizedException("Header Authorization no proporcionado")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Formato de Authorization inválido. Use: Bearer <token>")
    
    return parts[1]
