# IAM Service - Domain Ports (Interfaces)
from abc import ABC, abstractmethod
from typing import Optional, List
from .models import Usuario, Rol, Sesion


class RolRepository(ABC):
    """Puerto para repositorio de roles"""
    
    @abstractmethod
    def find_by_id(self, rol_id: str) -> Optional[Rol]:
        pass
    
    @abstractmethod
    def find_by_nombre(self, nombre: str) -> Optional[Rol]:
        pass
    
    @abstractmethod
    def find_all(self) -> List[Rol]:
        pass


class UsuarioRepository(ABC):
    """Puerto para repositorio de usuarios"""
    
    @abstractmethod
    def create(self, usuario: Usuario) -> Usuario:
        pass
    
    @abstractmethod
    def find_by_id(self, usuario_id: str) -> Optional[Usuario]:
        pass
    
    @abstractmethod
    def find_by_email(self, email: str) -> Optional[Usuario]:
        pass
    
    @abstractmethod
    def find_by_username(self, username: str) -> Optional[Usuario]:
        pass
    
    @abstractmethod
    def find_all(
        self, 
        rol_nombre: Optional[str] = None,
        status: Optional[str] = None,
        offset: int = 0,
        limit: int = 20
    ) -> List[Usuario]:
        pass
    
    @abstractmethod
    def update_status(self, usuario_id: str, status: str) -> Usuario:
        pass
    
    @abstractmethod
    def find_by_id_with_rol(self, usuario_id: str) -> Optional[Usuario]:
        """Obtiene usuario con información del rol cargada"""
        pass


class SesionRepository(ABC):
    """Puerto para repositorio de sesiones"""
    
    @abstractmethod
    def create(self, sesion: Sesion) -> Sesion:
        pass
    
    @abstractmethod
    def find_by_token_jti(self, token_jti: str) -> Optional[Sesion]:
        pass
    
    @abstractmethod
    def revoke(self, token_jti: str) -> bool:
        pass
