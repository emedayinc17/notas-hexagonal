# IAM Service - Domain Models
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum


class UserStatus(str, Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"
    BLOQUEADO = "BLOQUEADO"


@dataclass
class Rol:
    """Entidad de dominio: Rol"""
    id: str
    nombre: str
    descripcion: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class Usuario:
    """Entidad de dominio: Usuario"""
    id: str
    username: str
    email: str
    rol_id: str
    password_hash: Optional[str] = None  # No se expone en responses
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    status: UserStatus = UserStatus.ACTIVO
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Relación
    rol: Optional[Rol] = None
    
    def to_dict_safe(self) -> dict:
        """Convierte a dict sin password_hash"""
        data = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "rol_id": self.rol_id,
            "nombres": self.nombres,
            "apellidos": self.apellidos,
            "status": self.status.value if isinstance(self.status, UserStatus) else self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if self.rol:
            data["rol"] = {
                "id": self.rol.id,
                "nombre": self.rol.nombre,
                "descripcion": self.rol.descripcion,
            }
        return data


@dataclass
class Sesion:
    """Entidad de dominio: Sesión"""
    id: str
    usuario_id: str
    token_jti: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    expires_at: Optional[datetime] = None
    revoked: bool = False
    created_at: Optional[datetime] = None
