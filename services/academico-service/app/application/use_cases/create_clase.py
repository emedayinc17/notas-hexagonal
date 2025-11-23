# Académico Service - Use Case: Create Clase
from shared.common import generate_uuid
from app.domain import (
    Clase,
    ClaseRepository,
    CursoRepository,
    SeccionRepository,
    PeriodoRepository,
    CursoNotFoundException,
    SeccionNotFoundException,
    PeriodoNotFoundException,
)


class CreateClaseUseCase:
    def __init__(
        self,
        clase_repository: ClaseRepository,
        curso_repository: CursoRepository,
        seccion_repository: SeccionRepository,
        periodo_repository: PeriodoRepository,
    ):
        self.clase_repository = clase_repository
        self.curso_repository = curso_repository
        self.seccion_repository = seccion_repository
        self.periodo_repository = periodo_repository
    
    def execute(
        self,
        curso_id: str,
        seccion_id: str,
        periodo_id: str,
        docente_user_id: str,
    ) -> Clase:
        # Validar que curso existe
        curso = self.curso_repository.find_by_id(curso_id)
        if not curso:
            raise CursoNotFoundException(f"Curso {curso_id} no encontrado")
        
        # Validar que sección exists
        seccion = self.seccion_repository.find_by_id(seccion_id)
        if not seccion:
            raise SeccionNotFoundException(f"Sección {seccion_id} no encontrada")
        
        # Validar que periodo existe
        periodo = self.periodo_repository.find_by_id(periodo_id)
        if not periodo:
            raise PeriodoNotFoundException(f"Periodo {periodo_id} no encontrado")
        
        # TODO: Validar que docente_user_id existe (podría llamar a IAM service)
        
        # Crear clase
        nueva_clase = Clase(
            id=generate_uuid(),
            curso_id=curso_id,
            seccion_id=seccion_id,
            periodo_id=periodo_id,
            docente_user_id=docente_user_id,
            status="ACTIVA",
        )
        
        clase_creada = self.clase_repository.create(nueva_clase)
        clase_creada.curso = curso
        clase_creada.seccion = seccion
        clase_creada.periodo = periodo
        
        return clase_creada
