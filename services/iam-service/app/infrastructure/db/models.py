# IAM Service - Infrastructure Database Models
from sqlalchemy import Column, String, Enum, Boolean, TIMESTAMP, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from shared.common import Base
import enum


class UserStatusEnum(str, enum.Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"
    BLOQUEADO = "BLOQUEADO"


class RolModel(Base):
    """Modelo SQLAlchemy para tabla roles"""
    __tablename__ = "roles"
    __table_args__ = {"schema": "sga_iam"}
    
    id = Column(String(36), primary_key=True)
    nombre = Column(String(50), unique=True, nullable=False, index=True)
    descripcion = Column(String(255))
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relaciones
    usuarios = relationship("UsuarioModel", back_populates="rol")


class UsuarioModel(Base):
    """Modelo SQLAlchemy para tabla usuarios"""
    __tablename__ = "usuarios"
    __table_args__ = {"schema": "sga_iam"}
    
    id = Column(String(36), primary_key=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol_id = Column(String(36), ForeignKey("sga_iam.roles.id"), nullable=False, index=True)
    nombres = Column(String(100))
    apellidos = Column(String(100))
    status = Column(Enum(UserStatusEnum), nullable=False, default=UserStatusEnum.ACTIVO, index=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relaciones
    rol = relationship("RolModel", back_populates="usuarios")
    sesiones = relationship("SesionModel", back_populates="usuario")


class SesionModel(Base):
    """Modelo SQLAlchemy para tabla sesiones"""
    __tablename__ = "sesiones"
    __table_args__ = {"schema": "sga_iam"}
    
    id = Column(String(36), primary_key=True)
    usuario_id = Column(String(36), ForeignKey("sga_iam.usuarios.id"), nullable=False, index=True)
    token_jti = Column(String(255), unique=True, nullable=False, index=True)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    expires_at = Column(TIMESTAMP, nullable=False, index=True)
    revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    
    # Relaciones
    usuario = relationship("UsuarioModel", back_populates="sesiones")
