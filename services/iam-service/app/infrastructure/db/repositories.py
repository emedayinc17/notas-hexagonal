# IAM Service - Infrastructure Repositories
from typing import Optional, List
from sqlalchemy.orm import Session
from app.domain import (
    Usuario,
    Rol,
    Sesion,
    UsuarioRepository,
    RolRepository,
    SesionRepository,
    UserStatus,
)
from .models import UsuarioModel, RolModel, SesionModel


def rol_model_to_domain(model: RolModel) -> Rol:
    """Convierte RolModel a entidad de dominio Rol"""
    return Rol(
        id=model.id,
        nombre=model.nombre,
        descripcion=model.descripcion,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def usuario_model_to_domain(model: UsuarioModel) -> Usuario:
    """Convierte UsuarioModel a entidad de dominio Usuario"""
    usuario = Usuario(
        id=model.id,
        username=model.username,
        email=model.email,
        password_hash=model.password_hash,
        rol_id=model.rol_id,
        nombres=model.nombres,
        apellidos=model.apellidos,
        status=UserStatus(model.status.value) if hasattr(model.status, 'value') else UserStatus(model.status),
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )
    
    # Cargar rol si está disponible
    if model.rol:
        usuario.rol = rol_model_to_domain(model.rol)
    
    return usuario


def sesion_model_to_domain(model: SesionModel) -> Sesion:
    """Convierte SesionModel a entidad de dominio Sesion"""
    return Sesion(
        id=model.id,
        usuario_id=model.usuario_id,
        token_jti=model.token_jti,
        ip_address=model.ip_address,
        user_agent=model.user_agent,
        expires_at=model.expires_at,
        revoked=model.revoked,
        created_at=model.created_at,
    )


class SqlAlchemyRolRepository(RolRepository):
    """Implementación de RolRepository usando SQLAlchemy"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def find_by_id(self, rol_id: str) -> Optional[Rol]:
        model = self.session.query(RolModel).filter(RolModel.id == rol_id).first()
        return rol_model_to_domain(model) if model else None
    
    def find_by_nombre(self, nombre: str) -> Optional[Rol]:
        model = self.session.query(RolModel).filter(RolModel.nombre == nombre).first()
        return rol_model_to_domain(model) if model else None
    
    def find_all(self) -> List[Rol]:
        models = self.session.query(RolModel).all()
        return [rol_model_to_domain(m) for m in models]


class SqlAlchemyUsuarioRepository(UsuarioRepository):
    """Implementación de UsuarioRepository usando SQLAlchemy"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, usuario: Usuario) -> Usuario:
        model = UsuarioModel(
            id=usuario.id,
            username=usuario.username,
            email=usuario.email,
            password_hash=usuario.password_hash,
            rol_id=usuario.rol_id,
            nombres=usuario.nombres,
            apellidos=usuario.apellidos,
            status=usuario.status.value if isinstance(usuario.status, UserStatus) else usuario.status,
            is_deleted=usuario.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return usuario_model_to_domain(model)
    
    def find_by_id(self, usuario_id: str) -> Optional[Usuario]:
        model = self.session.query(UsuarioModel).filter(
            UsuarioModel.id == usuario_id,
            UsuarioModel.is_deleted == False
        ).first()
        return usuario_model_to_domain(model) if model else None
    
    def find_by_email(self, email: str) -> Optional[Usuario]:
        model = self.session.query(UsuarioModel).filter(
            UsuarioModel.email == email,
            UsuarioModel.is_deleted == False
        ).first()
        return usuario_model_to_domain(model) if model else None
    
    def find_by_username(self, username: str) -> Optional[Usuario]:
        model = self.session.query(UsuarioModel).filter(
            UsuarioModel.username == username,
            UsuarioModel.is_deleted == False
        ).first()
        return usuario_model_to_domain(model) if model else None
    
    def find_all(
        self,
        rol_nombre: Optional[str] = None,
        status: Optional[str] = None,
        offset: int = 0,
        limit: int = 20
    ) -> List[Usuario]:
        query = self.session.query(UsuarioModel).filter(UsuarioModel.is_deleted == False)
        
        # Aplicar filtros
        if rol_nombre:
            query = query.join(RolModel).filter(RolModel.nombre == rol_nombre)
        if status:
            query = query.filter(UsuarioModel.status == status)
        
        # Paginación
        models = query.offset(offset).limit(limit).all()
        return [usuario_model_to_domain(m) for m in models]
    
    def update_status(self, usuario_id: str, status: str) -> Usuario:
        model = self.session.query(UsuarioModel).filter(UsuarioModel.id == usuario_id).first()
        if model:
            model.status = status
            self.session.commit()
            self.session.refresh(model)
            return usuario_model_to_domain(model)
        return None
    
    def update(self, usuario: Usuario) -> Usuario:
        """Actualiza un usuario existente"""
        model = self.session.query(UsuarioModel).filter(UsuarioModel.id == usuario.id).first()
        if model:
            # No permitir cambiar el username
            model.email = usuario.email
            model.password_hash = usuario.password_hash
            model.rol_id = usuario.rol_id
            model.nombres = usuario.nombres
            model.apellidos = usuario.apellidos
            model.status = usuario.status
            # updated_at se actualiza automáticamente
            return usuario_model_to_domain(model)
        return None
    
    def find_by_id_with_rol(self, usuario_id: str) -> Optional[Usuario]:
        model = self.session.query(UsuarioModel).filter(
            UsuarioModel.id == usuario_id,
            UsuarioModel.is_deleted == False
        ).first()
        
        if model:
            # Cargar explícitamente el rol
            if not model.rol:
                self.session.refresh(model)
            return usuario_model_to_domain(model)
        return None


class SqlAlchemySesionRepository(SesionRepository):
    """Implementación de SesionRepository usando SQLAlchemy"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, sesion: Sesion) -> Sesion:
        model = SesionModel(
            id=sesion.id,
            usuario_id=sesion.usuario_id,
            token_jti=sesion.token_jti,
            ip_address=sesion.ip_address,
            user_agent=sesion.user_agent,
            expires_at=sesion.expires_at,
            revoked=sesion.revoked,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return sesion_model_to_domain(model)
    
    def find_by_token_jti(self, token_jti: str) -> Optional[Sesion]:
        model = self.session.query(SesionModel).filter(SesionModel.token_jti == token_jti).first()
        return sesion_model_to_domain(model) if model else None
    
    def revoke(self, token_jti: str) -> bool:
        model = self.session.query(SesionModel).filter(SesionModel.token_jti == token_jti).first()
        if model:
            model.revoked = True
            self.session.commit()
            return True
        return False
