# Personas Service - Use Case: Matricular Alumno
from datetime import date as dt_date
from shared.common import generate_uuid
from app.domain import (
    MatriculaClase,
    MatriculaClaseRepository,
   AlumnoRepository,
    AlumnoNotFoundException,
    MatriculaAlreadyExistsException,
)


class MatricularAlumnoUseCase:
    def __init__(
        self,
        matricula_repository: MatriculaClaseRepository,
        alumno_repository: AlumnoRepository,
    ):
        self.matricula_repository = matricula_repository
        self.alumno_repository = alumno_repository
    
    def execute(
        self,
        alumno_id: str,
        clase_id: str,
        fecha_matricula: dt_date = None,
    ) -> MatriculaClase:
        # Validar que alumno existe
        alumno = self.alumno_repository.find_by_id(alumno_id)
        if not alumno:
            raise AlumnoNotFoundException(f"Alumno {alumno_id} no encontrado")
        
        # Crear matrícula
        nueva_matricula = MatriculaClase(
            id=generate_uuid(),
            alumno_id=alumno_id,
            clase_id=clase_id,
            fecha_matricula=fecha_matricula or dt_date.today(),
            status="ACTIVO",
        )
        
        return self.matricula_repository.create(nueva_matricula)
