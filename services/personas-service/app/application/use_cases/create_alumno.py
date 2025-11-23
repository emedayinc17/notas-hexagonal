# Personas Service - Use Case: Create Alumno
from datetime import date
from shared.common import generate_uuid, ValidationException
from app.domain import Alumno, AlumnoRepository, AlumnoAlreadyExistsException


class CreateAlumnoUseCase:
    def __init__(self, alumno_repository: AlumnoRepository):
        self.alumno_repository = alumno_repository
    
    def execute(
        self,
        codigo_alumno: str,
        nombres: str,
        apellido_paterno: str,
        apellido_materno: str,
        fecha_nacimiento: date,
        genero: str,
        dni: str = None,
        email: str = None,
        direccion: str = None,
        telefono: str = None,
    ) -> Alumno:
        # Validar código único
        existing = self.alumno_repository.find_by_codigo(codigo_alumno)
        if existing:
            raise AlumnoAlreadyExistsException(f"Alumno con código {codigo_alumno} ya existe")
        
        # Validar género
        if genero not in ["M", "F", "OTRO"]:
            raise ValidationException("Género debe ser M, F o OTRO")
        
        # Crear alumno
        nuevo_alumno = Alumno(
            id=generate_uuid(),
            codigo_alumno=codigo_alumno,
            nombres=nombres,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            fecha_nacimiento=fecha_nacimiento,
            genero=genero,
            dni=dni,
            email=email,
            direccion=direccion,
            telefono=telefono,
            status="ACTIVO",
        )
        
        return self.alumno_repository.create(nuevo_alumno)
