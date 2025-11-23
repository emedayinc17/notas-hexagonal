# IAM Service - Use Case: List Users
from typing import List
from shared.common import ForbiddenException
from app.domain import UsuarioRepository


class ListUsersUseCase:
    """Caso de uso: Listar usuarios (solo ADMIN)"""
    
    def __init__(self, usuario_repository: UsuarioRepository):
        self.usuario_repository = usuario_repository
    
    def execute(
        self,
        current_user_rol: str,
        rol_nombre: str = None,
        status: str = None,
        offset: int = 0,
        limit: int = 20,
    ) -> dict:
        """
        Lista usuarios con filtros opcionales
        
        Args:
            current_user_rol: Rol del usuario actual (debe ser ADMIN)
            rol_nombre: Filtro opcional por rol
            status: Filtro opcional por status
            offset: Offset para paginación
            limit: Límite de resultados
        
        Returns:
            Dict con: {users: List[], total: int, offset: int, limit: int}
        
        Raises:
            ForbiddenException: Si el usuario no es ADMIN
        """
        # Validar que el usuario actual sea ADMIN
        if current_user_rol != "ADMIN":
            raise ForbiddenException("Solo los administradores pueden listar usuarios")
        
        # Obtener usuarios
        usuarios = self.usuario_repository.find_all(
            rol_nombre=rol_nombre,
            status=status,
            offset=offset,
            limit=limit,
        )
        
        # Convertir a dict safe
        usuarios_dict = [u.to_dict_safe() for u in usuarios]
        
        return {
            "users": usuarios_dict,
            "total": len(usuarios_dict),
            "offset": offset,
            "limit": limit,
        }
