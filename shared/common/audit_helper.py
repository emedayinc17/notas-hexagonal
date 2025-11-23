# Shared Common - Audit Helper
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from .audit import AuditoriaLog, AccionAuditoria
from .utils import generate_uuid
from datetime import datetime


class AuditHelper:
    """Helper para facilitar el registro de auditoría"""
    
    @staticmethod
    def log_action(
        session: Session,
        user_id: Optional[str],
        username: Optional[str],
        rol_nombre: Optional[str],
        accion: AccionAuditoria,
        entidad: str,
        entidad_id: Optional[str] = None,
        descripcion: Optional[str] = None,
        datos_anteriores: Optional[Dict[str, Any]] = None,
        datos_nuevos: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        metodo_http: Optional[str] = None,
        exitoso: bool = True,
        codigo_respuesta: Optional[int] = None,
        mensaje_error: Optional[str] = None,
    ) -> AuditoriaLog:
        """
        Registra una acción en la tabla de auditoría
        
        Args:
            session: Sesión de SQLAlchemy
            user_id: ID del usuario que realiza la acción
            username: Nombre de usuario
            rol_nombre: Rol del usuario
            accion: Tipo de acción (AccionAuditoria)
            entidad: Nombre de la entidad afectada
            entidad_id: ID de la entidad afectada
            descripcion: Descripción legible de la acción
            datos_anteriores: Estado anterior (para UPDATE/DELETE)
            datos_nuevos: Estado nuevo (para CREATE/UPDATE)
            ip_address: IP del cliente
            user_agent: User agent del cliente
            endpoint: Endpoint HTTP
            metodo_http: Método HTTP
            exitoso: Si la operación fue exitosa
            codigo_respuesta: Código de respuesta HTTP
            mensaje_error: Mensaje de error si falló
            
        Returns:
            AuditoriaLog creado
        """
        from .database import Base
        
        # Crear modelo SQLAlchemy dinámicamente
        # Nota: Esto asume que cada servicio tiene su tabla auditoria_logs
        log = AuditoriaLog(
            id=generate_uuid(),
            user_id=user_id,
            username=username,
            rol_nombre=rol_nombre,
            accion=accion.value if isinstance(accion, AccionAuditoria) else accion,
            entidad=entidad,
            entidad_id=entidad_id,
            descripcion=descripcion,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            metodo_http=metodo_http,
            exitoso=exitoso,
            codigo_respuesta=codigo_respuesta,
            mensaje_error=mensaje_error,
            created_at=datetime.utcnow(),
        )
        
        # Insertar en BD usando SQL directo para evitar problemas de modelo
        import json
        
        sql = """
        INSERT INTO auditoria_logs (
            id, user_id, username, rol_nombre, accion, entidad, entidad_id,
            descripcion, datos_anteriores, datos_nuevos, ip_address, user_agent,
            endpoint, metodo_http, exitoso, codigo_respuesta, mensaje_error, created_at
        ) VALUES (
            :id, :user_id, :username, :rol_nombre, :accion, :entidad, :entidad_id,
            :descripcion, :datos_anteriores, :datos_nuevos, :ip_address, :user_agent,
            :endpoint, :metodo_http, :exitoso, :codigo_respuesta, :mensaje_error, :created_at
        )
        """
        
        session.execute(
            sql,
            {
                "id": log.id,
                "user_id": log.user_id,
                "username": log.username,
                "rol_nombre": log.rol_nombre,
                "accion": log.accion,
                "entidad": log.entidad,
                "entidad_id": log.entidad_id,
                "descripcion": log.descripcion,
                "datos_anteriores": json.dumps(log.datos_anteriores) if log.datos_anteriores else None,
                "datos_nuevos": json.dumps(log.datos_nuevos) if log.datos_nuevos else None,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "endpoint": log.endpoint,
                "metodo_http": log.metodo_http,
                "exitoso": log.exitoso,
                "codigo_respuesta": log.codigo_respuesta,
                "mensaje_error": log.mensaje_error,
                "created_at": log.created_at,
            }
        )
        session.commit()
        
        return log
    
    @staticmethod
    def log_login(
        session: Session,
        user_id: str,
        username: str,
        rol_nombre: str,
        exitoso: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        mensaje_error: Optional[str] = None,
    ):
        """Registra un intento de login"""
        return AuditHelper.log_action(
            session=session,
            user_id=user_id if exitoso else None,
            username=username,
            rol_nombre=rol_nombre if exitoso else None,
            accion=AccionAuditoria.LOGIN if exitoso else AccionAuditoria.LOGIN_FAILED,
            entidad="Usuario",
            entidad_id=user_id if exitoso else None,
            descripcion=f"Login {'exitoso' if exitoso else 'fallido'} para {username}",
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint="/v1/auth/login",
            metodo_http="POST",
            exitoso=exitoso,
            codigo_respuesta=200 if exitoso else 401,
            mensaje_error=mensaje_error,
        )
    
    @staticmethod
    def log_create(
        session: Session,
        user_id: str,
        username: str,
        rol_nombre: str,
        entidad: str,
        entidad_id: str,
        datos_nuevos: Dict[str, Any],
        descripcion: Optional[str] = None,
    ):
        """Registra la creación de una entidad"""
        return AuditHelper.log_action(
            session=session,
            user_id=user_id,
            username=username,
            rol_nombre=rol_nombre,
            accion=AccionAuditoria.CREATE,
            entidad=entidad,
            entidad_id=entidad_id,
            descripcion=descripcion or f"{entidad} creado",
            datos_nuevos=datos_nuevos,
            exitoso=True,
            codigo_respuesta=201,
        )
