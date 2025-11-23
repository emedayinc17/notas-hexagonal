# Personas Service - Use Case: Link Padre Alumno
from shared.common import generate_uuid
from app.domain import (
    RelacionPadreAlumno,
    RelacionPadreAlumnoRepository,
    AlumnoRepository,
    PadreRepository,
    AlumnoNotFoundException,
    PadreNotFoundException,
)


class RelacionAlreadyExistsException(Exception):
    """Excepción cuando la relación ya existe"""
    pass


class TipoRelacionDuplicadaException(Exception):
    """Excepción cuando ya existe una relación del mismo tipo para el alumno"""
    pass


class LinkPadreAlumnoUseCase:
    def __init__(
        self,
        relacion_repository: RelacionPadreAlumnoRepository,
        alumno_repository: AlumnoRepository,
        padre_repository: PadreRepository,
    ):
        self.relacion_repository = relacion_repository
        self.alumno_repository = alumno_repository
        self.padre_repository = padre_repository
    
    def execute(
        self,
        padre_id: str,
        alumno_id: str,
        tipo_relacion: str,
        es_contacto_principal: bool = False,
    ) -> RelacionPadreAlumno:
        # Validar que padre existe
        padre = self.padre_repository.find_by_id(padre_id)
        if not padre:
            raise PadreNotFoundException(f"Padre {padre_id} no encontrado")
        
        # Validar que alumno existe
        alumno = self.alumno_repository.find_by_id(alumno_id)
        if not alumno:
            raise AlumnoNotFoundException(f"Alumno {alumno_id} no encontrado")
        
        # Verificar si la relación ya existe (mismo padre y mismo alumno)
        # Nota: el repositorio expone `find_by_alumno`, no `find_by_alumno_id`
        relaciones_existentes = self.relacion_repository.find_by_alumno(alumno_id)
        for relacion in relaciones_existentes:
            # Validar que no exista la misma relación padre-alumno
            if relacion.padre_id == padre_id and not relacion.is_deleted:
                raise RelacionAlreadyExistsException(
                    f"Ya existe una relación entre el padre {padre_id} y el alumno {alumno_id}"
                )
            
            # Validar que este ALUMNO específico no tenga ya una relación del mismo tipo
            # NOTA: Diferentes alumnos SÍ pueden tener el mismo padre (hermanos, primos)
            if relacion.tipo_relacion == tipo_relacion and not relacion.is_deleted:
                raise TipoRelacionDuplicadaException(
                    f"El alumno ya tiene un {tipo_relacion.lower()} asignado. Solo puede tener uno de cada tipo."
                )
        
        # Crear relación
        nueva_relacion = RelacionPadreAlumno(
            id=generate_uuid(),
            padre_id=padre_id,
            alumno_id=alumno_id,
            tipo_relacion=tipo_relacion,
            es_contacto_principal=es_contacto_principal,
        )
        
        return self.relacion_repository.create(nueva_relacion)
