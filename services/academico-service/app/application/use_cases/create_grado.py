# Académico Service - Use Case: Create Grado
from shared.common import generate_uuid, ValidationException
from app.domain import Grado, GradoNivel, GradoRepository


class CreateGradoUseCase:
    def __init__(self, grado_repository: GradoRepository):
        self.grado_repository = grado_repository
    
    def execute(self, nombre: str, nivel: str, orden: int, descripcion: str = None) -> Grado:
        # Validar nivel
        try:
            nivel_enum = GradoNivel(nivel)
        except ValueError:
            raise ValidationException(f"Nivel inválido: {nivel}. Debe ser: INICIAL, PRIMARIA o SECUNDARIA")
        
        # Crear grado
        nuevo_grado = Grado(
            id=generate_uuid(),
            nombre=nombre,
            nivel=nivel_enum,
            orden=orden,
            descripcion=descripcion,
            status="ACTIVO",
        )
        
        return self.grado_repository.create(nuevo_grado)
