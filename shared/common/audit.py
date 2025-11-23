# Shared Common - Audit Models
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum


class AccionAuditoria(str, Enum):
    # Autenticación
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    
    # Gestión de Usuarios
    REGISTER = "REGISTER"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    ROLE_CHANGE = "ROLE_CHANGE"
    
    # CRUD Genérico
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    READ = "READ"
    
    # Acciones Específicas - Académico
    CREATE_GRADO = "CREATE_GRADO"
    CREATE_CURSO = "CREATE_CURSO"
    CREATE_SECCION = "CREATE_SECCION"
    CREATE_PERIODO = "CREATE_PERIODO"
    CREATE_CLASE = "CREATE_CLASE"
    
    # Acciones Específicas - Personas
    CREATE_ALUMNO = "CREATE_ALUMNO"
    CREATE_PADRE = "CREATE_PADRE"
    LINK_PADRE_ALUMNO = "LINK_PADRE_ALUMNO"
    CREATE_MATRICULA = "CREATE_MATRICULA"
    
    # Acciones Específicas - Notas
    CREATE_NOTA = "CREATE_NOTA"
    UPDATE_NOTA = "UPDATE_NOTA"
    DELETE_NOTA = "DELETE_NOTA"
    CREATE_ALERTA = "CREATE_ALERTA"
    READ_ALERTA = "READ_ALERTA"
    SEND_NOTIFICATION = "SEND_NOTIFICATION"


@dataclass
class AuditoriaLog:
    """Modelo de dominio para logs de auditoría"""
    id: str
    user_id: Optional[str]
    username: Optional[str]
    rol_nombre: Optional[str]
    accion: str  # AccionAuditoria
    entidad: str
    entidad_id: Optional[str] = None
    descripcion: Optional[str] = None
    datos_anteriores: Optional[Dict[str, Any]] = None
    datos_nuevos: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    endpoint: Optional[str] = None
    metodo_http: Optional[str] = None
    exitoso: bool = True
    codigo_respuesta: Optional[int] = None
    mensaje_error: Optional[str] = None
    created_at: Optional[datetime] = None
