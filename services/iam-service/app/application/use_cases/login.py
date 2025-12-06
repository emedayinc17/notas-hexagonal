# IAM Service - Use Case: Login
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from shared.common import (
    verify_password, 
    create_jwt_token, 
    generate_uuid,
    AuditHelper,
    AccionAuditoria,
)
from app.domain import (
    UsuarioRepository,
    SesionRepository,
    InvalidCredentialsException,
    UserInactiveException,
    Sesion,
)


class LoginUseCase:
    """Caso de uso: Login de usuario"""
    
    def __init__(
        self,
        usuario_repository: UsuarioRepository,
        sesion_repository: SesionRepository,
        db_session: Session,
        jwt_secret: str,
        jwt_algorithm: str = "HS256",
        jwt_expiration_minutes: int = 1440,
    ):
        self.usuario_repository = usuario_repository
        self.sesion_repository = sesion_repository
        self.db_session = db_session
        self.jwt_secret = jwt_secret
        self.jwt_algorithm = jwt_algorithm
        self.jwt_expiration_minutes = jwt_expiration_minutes
    
    def execute(
        self,
        email: str,
        password: str,
        ip_address: str = None,
        user_agent: str = None,
    ) -> dict:

        # Buscar usuario por email
        usuario = self.usuario_repository.find_by_email(email)
        if not usuario:
            # AUDITORÍA: Login fallido - usuario no existe
            try:
                AuditHelper.log_action(
                    session=self.db_session,
                    user_id=None,
                    username=email,
                    rol_nombre=None,
                    accion=AccionAuditoria.LOGIN_FAILED,
                    entidad="Usuario",
                    descripcion=f"Login fallido: usuario {email} no encontrado",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    endpoint="/v1/auth/login",
                    metodo_http="POST",
                    exitoso=False,
                    codigo_respuesta=401,
                    mensaje_error="Usuario no encontrado",
                )
            except:
                pass  # No fallar si falla la auditoría
            
            raise InvalidCredentialsException("Credenciales inválidas")
        
        # Verificar password
        if not verify_password(password, usuario.password_hash):
            # AUDITORÍA: Login fallido - contraseña incorrecta
            try:
                AuditHelper.log_action(
                    session=self.db_session,
                    user_id=usuario.id,
                    username=usuario.username,
                    rol_nombre=None,
                    accion=AccionAuditoria.LOGIN_FAILED,
                    entidad="Usuario",
                    entidad_id=usuario.id,
                    descripcion=f"Login fallido: contraseña incorrecta para {usuario.username}",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    endpoint="/v1/auth/login",
                    metodo_http="POST",
                    exitoso=False,
                    codigo_respuesta=401,
                    mensaje_error="Contraseña incorrecta",
                )
            except:
                pass
            
            raise InvalidCredentialsException("Credenciales inválidas")
        
        # Verificar que el usuario esté activo
        if usuario.status != "ACTIVO":
            # AUDITORÍA: Login fallido - usuario inactivo
            try:
                AuditHelper.log_action(
                    session=self.db_session,
                    user_id=usuario.id,
                    username=usuario.username,
                    rol_nombre=None,
                    accion=AccionAuditoria.LOGIN_FAILED,
                    entidad="Usuario",
                    entidad_id=usuario.id,
                    descripcion=f"Login fallido: usuario {usuario.username} está {usuario.status}",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    endpoint="/v1/auth/login",
                    metodo_http="POST",
                    exitoso=False,
                    codigo_respuesta=403,
                    mensaje_error=f"Usuario {usuario.status.lower()}",
                )
            except:
                pass
            
            raise UserInactiveException(f"Usuario {usuario.status.lower()}")
        
        # Cargar información del rol
        usuario_con_rol = self.usuario_repository.find_by_id_with_rol(usuario.id)
        
        # Generar JTI (JWT ID) único
        jti = generate_uuid()
        
        # Crear payload del JWT
        payload = {
            "user_id": usuario.id,
            "username": usuario.username,
            "email": usuario.email,
            "rol_nombre": usuario_con_rol.rol.nombre if usuario_con_rol.rol else None,
            "jti": jti,
        }
        
        # Crear token
        token = create_jwt_token(
            payload=payload,
            secret_key=self.jwt_secret,
            algorithm=self.jwt_algorithm,
            expiration_minutes=self.jwt_expiration_minutes,
        )
        
        # Registrar sesión
        expires_at = datetime.utcnow() + timedelta(minutes=self.jwt_expiration_minutes)
        sesion = Sesion(
            id=generate_uuid(),
            usuario_id=usuario.id,
            token_jti=jti,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at,
            revoked=False,
        )
        self.sesion_repository.create(sesion)
        
        # AUDITORÍA: Login exitoso
        try:
            AuditHelper.log_action(
                session=self.db_session,
                user_id=usuario.id,
                username=usuario.username,
                rol_nombre=usuario_con_rol.rol.nombre if usuario_con_rol.rol else None,
                accion=AccionAuditoria.LOGIN,
                entidad="Usuario",
                entidad_id=usuario.id,
                descripcion=f"Login exitoso para {usuario.username}",
                ip_address=ip_address,
                user_agent=user_agent,
                endpoint="/v1/auth/login",
                metodo_http="POST",
                exitoso=True,
                codigo_respuesta=200,
            )
        except:
            pass  # No fallar si falla la auditoría
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": usuario_con_rol.to_dict_safe(),
        }
