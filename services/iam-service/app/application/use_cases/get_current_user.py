# IAM Service - Use Case: Get Current User
from app.domain import UsuarioRepository, UserNotFoundException


class GetCurrentUserUseCase:
    """Caso de uso: Obtener información del usuario actual"""
    
    def __init__(self, usuario_repository: UsuarioRepository):
        self.usuario_repository = usuario_repository
    
    def execute(self, user_id: str) -> dict:
        """
        Obtiene la información completa del usuario actual
        
        Args:
            user_id: ID del usuario (extraído del JWT)
        
        Returns:
            Dict con información del usuario y su rol
        
        Raises:
            UserNotFoundException: Si el usuario no existe
        """
        usuario = self.usuario_repository.find_by_id_with_rol(user_id)
        
        if not usuario:
            raise UserNotFoundException(f"Usuario con ID {user_id} no encontrado")
        
        return usuario.to_dict_safe()
