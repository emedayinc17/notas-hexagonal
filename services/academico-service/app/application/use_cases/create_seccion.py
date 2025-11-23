from shared.common import generate_uuid, AlreadyExistsException, NotFoundException
from app.domain import Seccion, SeccionRepository, GradoRepository

class CreateSeccionUseCase:
    def __init__(self, seccion_repository: SeccionRepository, grado_repository: GradoRepository):
        self.seccion_repository = seccion_repository
        self.grado_repository = grado_repository
    
    def execute(self, grado_id: str, nombre: str, año_escolar: int, capacidad_maxima: int = 30) -> Seccion:
        # Validar grado
        grado = self.grado_repository.find_by_id(grado_id)
        if not grado:
            raise NotFoundException(f"Grado {grado_id} no encontrado")
            
        # Validar duplicado
        # TODO: Implementar find_by_grado_nombre_año en repositorio si es necesario, 
        # por ahora confiamos en la restricción de BD o capturamos error de integridad.
        
        nueva_seccion = Seccion(
            id=generate_uuid(),
            grado_id=grado_id,
            nombre=nombre,
            año_escolar=año_escolar,
            capacidad_maxima=capacidad_maxima,
            status="ACTIVO"
        )
        
        return self.seccion_repository.create(nueva_seccion)
