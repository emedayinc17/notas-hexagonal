# Notas Service - Domain Models
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class TipoEvaluacion:
    id: str
    nombre: str
    codigo: str
    peso_default: Optional[float] = None
    descripcion: Optional[str] = None
    status: str = "ACTIVO"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class Nota:
    id: str
    matricula_clase_id: str
    tipo_evaluacion_id: str
    periodo_id: str
    escala_id: str
    fecha_registro: date
    registrado_por_user_id: str
    valor_literal: Optional[str] = None
    valor_numerico: Optional[float] = None
    peso: Optional[float] = None
    observaciones: Optional[str] = None
    columna_nota: str = "N1"
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class AlertaNotificacion:
    id: str
    nota_id: str
    alumno_id: str
    padre_id: Optional[str]
    tipo_alerta: str  # NOTA_BAJA, PROMEDIO_BAJO
    mensaje: str
    leida: bool = False
    fecha_lectura: Optional[datetime] = None
    created_at: Optional[datetime] = None


@dataclass
class OutboxNotificacion:
    id: str
    tipo: str  # EMAIL, SMS, PUSH
    destinatario: str
    mensaje: str
    alerta_id: Optional[str] = None
    asunto: Optional[str] = None
    metadata: Optional[str] = None
    estado: str = "PENDIENTE"  # PENDIENTE, PROCESANDO, ENVIADO, FALLIDO
    intentos: int = 0
    ultimo_error: Optional[str] = None
    fecha_envio: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
