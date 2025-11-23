# IAM Service - Use Case: Register User
from sqlalchemy.orm import Session
from shared.common import (
    generate_uuid, 
    hash_password, 
    validate_password_strength,
    AuditHelper,
    AccionAuditoria,
)
from app.domain import (
    Usuario,
    UserStatus,
    UsuarioRepository,
    RolRepository,
    UserAlreadyExistsException,
    RolNotFoundException,
    WeakPasswordException,
)


class RegisterUserUseCase:
    """Caso de uso: Registrar nuevo usuario"""
    
    def __init__(
        self,
        usuario_repository: UsuarioRepository,
        rol_repository: RolRepository,
        db_session: Session,
    ):
        self.usuario_repository = usuario_repository
        self.rol_repository = rol_repository
        self.db_session = db_session
    
    def execute(
        self,
        username: str,
        email: str,
        password: str,
        rol_nombre: str,
        nombres: str = None,
        apellidos: str = None,
        ip_address: str = None,
        user_agent: str = None,
    ) -> Usuario:
        """
        Registra un nuevo usuario en el sistema
        
        Args:
            username: Nombre de usuario único
            email: Email único
            password: Contraseña en texto plano
            rol_nombre: Nombre del rol (ADMIN, DOCENTE, PADRE)
            nombres: Nombres opcionales
            apellidos: Apellidos opcionales
            ip_address: IP del cliente (opcional)
            user_agent: User agent (opcional)
        
        Returns:
            Usuario creado (sin password_hash)
        
        Raises:
            UserAlreadyExistsException: Si el email o username ya existe
            RolNotFoundException: Si el rol no existe
            WeakPasswordException: Si la contraseña es débil
        """
        # Validar que no exista el email
        existing_by_email = self.usuario_repository.find_by_email(email)
        if existing_by_email:
            raise UserAlreadyExistsException(f"El email {email} ya está registrado")
        
        # Validar que no exista el username
        existing_by_username = self.usuario_repository.find_by_username(username)
        if existing_by_username:
            raise UserAlreadyExistsException(f"El username {username} ya está registrado")
        
        # Validar fortaleza de contraseña
        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            raise WeakPasswordException(error_msg)
        
        # Obtener el rol
        rol = self.rol_repository.find_by_nombre(rol_nombre)
        if not rol:
            raise RolNotFoundException(f"El rol {rol_nombre} no existe")
        
        # Hash de contraseña
        password_hash = hash_password(password)
        
        # Crear usuario
        nuevo_usuario = Usuario(
            id=generate_uuid(),
            username=username,
            email=email,
            password_hash=password_hash,
            rol_id=rol.id,
            nombres=nombres,
            apellidos=apellidos,
            status=UserStatus.ACTIVO,
            is_deleted=False,
        )
        
        # Persistir
        usuario_creado = self.usuario_repository.create(nuevo_usuario)
        usuario_creado.rol = rol
        
        # AUDITORÍA: Registro de usuario
        try:
            AuditHelper.log_action(
                session=self.db_session,
                user_id=usuario_creado.id,
                username=usuario_creado.username,
                rol_nombre=rol_nombre,
                accion=AccionAuditoria.REGISTER,
                entidad="Usuario",
                entidad_id=usuario_creado.id,
                descripcion=f"Usuario {username} registrado con rol {rol_nombre}",
                datos_nuevos={
                    "username": username,
                    "email": email,
                    "rol": rol_nombre,
                    "nombres": nombres,
                    "apellidos": apellidos,
                },
                ip_address=ip_address,
                user_agent=user_agent,
                endpoint="/v1/auth/register",
                metodo_http="POST",
                exitoso=True,
                codigo_respuesta=201,
            )
        except:
            pass  # No fallar si falla la auditoría
        
        return usuario_creado
