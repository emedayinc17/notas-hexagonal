# Personas Service - Use Case: Create Padre
from shared.common import generate_uuid
from app.domain import Padre, PadreRepository


class CreatePadreUseCase:
    def __init__(self, padre_repository: PadreRepository):
        self.padre_repository = padre_repository
    
    def execute(
        self,
        nombres: str,
        apellido_paterno: str,
        apellido_materno: str,
        email: str,
        dni: str = None,
        celular: str = None,
    ) -> Padre:
        # Crear padre
        nuevo_padre = Padre(
            id=generate_uuid(),
            nombres=nombres,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            email=email,
            dni=dni,
            celular=celular,
            status="ACTIVO",
        )
        
        return self.padre_repository.create(nuevo_padre)
