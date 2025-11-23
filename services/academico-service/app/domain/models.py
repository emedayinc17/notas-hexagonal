# Académico Service - Domain Models
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional
from enum import Enum


class GradoNivel(str, Enum):
    INICIAL = "INICIAL"
    PRIMARIA = "PRIMARIA"
    SECUNDARIA = "SECUNDARIA"


class TipoEscala(str, Enum):
    NUMERICA = "NUMERICA"
    LITERAL = "LITERAL"


@dataclass
class Grado:
    id: str
    nombre: str
    nivel: GradoNivel
    orden: int
    descripcion: Optional[str] = None
    status: str = "ACTIVO"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class Seccion:
    id: str
    grado_id: str
    nombre: str
    año_escolar: int
    capacidad_maxima: Optional[int] = None
    status: str = "ACTIVO"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    grado: Optional[Grado] = None


@dataclass
class Curso:
    id: str
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    horas_semanales: Optional[int] = None
    status: str = "ACTIVO"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class PeriodoTipo:
    id: str
    nombre: str
    num_periodos: int
    descripcion: Optional[str] = None
    status: str = "ACTIVO"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class Periodo:
    id: str
    año_escolar: int
    tipo_id: str
    numero: int
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    status: str = "ACTIVO"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tipo: Optional[PeriodoTipo] = None


@dataclass
class Clase:
    id: str
    curso_id: str
    seccion_id: str
    periodo_id: str
    docente_user_id: str
    status: str = "ACTIVA"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    curso: Optional[Curso] = None
    seccion: Optional[Seccion] = None
    periodo: Optional[Periodo] = None


@dataclass
class EscalaCalificacion:
    id: str
    nombre: str
    tipo: TipoEscala
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    descripcion: Optional[str] = None
    status: str = "ACTIVO"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class UmbralAlerta:
    id: str
    escala_id: str
    grado_id: Optional[str] = None
    curso_id: Optional[str] = None
    valor_minimo_numerico: Optional[float] = None
    valor_minimo_literal: Optional[str] = None
    descripcion: Optional[str] = None
    activo: bool = True
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
