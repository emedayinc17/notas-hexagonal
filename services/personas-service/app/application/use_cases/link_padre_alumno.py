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
        
        # Verificar si existe una relación (incluyendo eliminadas) entre este padre y alumno
        relacion_existente = self.relacion_repository.find_by_padre_and_alumno_including_deleted(
            padre_id, alumno_id
        )
        
        if relacion_existente:
            # Si la relación existe pero está eliminada, reactivarla
            if relacion_existente.is_deleted:
                relacion_existente.is_deleted = False
                relacion_existente.tipo_relacion = tipo_relacion
                relacion_existente.es_contacto_principal = es_contacto_principal
                return self.relacion_repository.update(relacion_existente)
            else:
                # Si la relación existe y está activa, lanzar error
                raise RelacionAlreadyExistsException(
                    f"Ya existe una relación activa entre el padre {padre_id} y el alumno {alumno_id}"
                )
        
        # Verificar que este ALUMNO específico no tenga ya una relación del mismo tipo
        relaciones_existentes = self.relacion_repository.find_by_alumno(alumno_id)
        for relacion in relaciones_existentes:
            if relacion.tipo_relacion == tipo_relacion and not relacion.is_deleted:
                raise TipoRelacionDuplicadaException(
                    f"El alumno ya tiene un {tipo_relacion.lower()} asignado. Solo puede tener uno de cada tipo."
                )
        
        # Crear nueva relación
        nueva_relacion = RelacionPadreAlumno(
            id=generate_uuid(),
            padre_id=padre_id,
            alumno_id=alumno_id,
            tipo_relacion=tipo_relacion,
            es_contacto_principal=es_contacto_principal,
        )
        
        return self.relacion_repository.create(nueva_relacion)
