# Personas Service - Domain Models
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class Alumno:
    id: str
    codigo_alumno: str
    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str]
    fecha_nacimiento: date
    genero: str  # M, F, OTRO
    dni: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    foto_url: Optional[str] = None
    status: str = "ACTIVO"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class Padre:
    id: str
    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str]
    email: str
    dni: Optional[str] = None
    telefono: Optional[str] = None
    celular: Optional[str] = None
    direccion: Optional[str] = None
    ocupacion: Optional[str] = None
    status: str = "ACTIVO"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class RelacionPadreAlumno:
    id: str
    padre_id: str
    alumno_id: str
    tipo_relacion: str  # PADRE, MADRE, TUTOR, APODERADO
    es_contacto_principal: bool = False
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class MatriculaClase:
    id: str
    alumno_id: str
    clase_id: str
    fecha_matricula: date
    status: str = "ACTIVO"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
