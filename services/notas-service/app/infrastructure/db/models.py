# Notas Service - Infrastructure DB Models
from sqlalchemy import Column, String, Integer, Boolean, TIMESTAMP, ForeignKey, Date, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from shared.common import Base


class TipoEvaluacionModel(Base):
    __tablename__ = "tipos_evaluacion"
    __table_args__ = {"schema": "sga_notas"}
    
    id = Column(String(36), primary_key=True)
    nombre = Column(String(50), nullable=False)
    codigo = Column(String(20), unique=True, nullable=False)
    peso_default = Column(Float)
    descripcion = Column(String(255))
    status = Column(String(20), nullable=False, default="ACTIVO")
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


class NotaModel(Base):
    __tablename__ = "notas"
    __table_args__ = (
        # Unique key to avoid duplicate logical notes (incluye is_deleted para permitir reinsertar tras soft-delete)
        {'schema': 'sga_notas'}
    )
    
    id = Column(String(36), primary_key=True)
    matricula_clase_id = Column(String(36), nullable=False, index=True)
    tipo_evaluacion_id = Column(String(36), ForeignKey("sga_notas.tipos_evaluacion.id"), nullable=False)
    periodo_id = Column(String(36), nullable=False, index=True)
    escala_id = Column(String(36), nullable=False)
    fecha_registro = Column(Date, nullable=False)
    registrado_por_user_id = Column(String(36), nullable=False)
    valor_literal = Column(String(5))
    valor_numerico = Column(Float)
    peso = Column(Float)
    observaciones = Column(Text)
    columna_nota = Column(String(20), default='N1')
    metadata_json = Column("metadata_json", JSON)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    tipo_evaluacion = relationship("TipoEvaluacionModel")
    alertas = relationship("AlertaNotificacionModel", back_populates="nota")


class AlertaNotificacionModel(Base):
    __tablename__ = "alertas_notificacion"
    __table_args__ = {"schema": "sga_notas"}
    
    id = Column(String(36), primary_key=True)
    nota_id = Column(String(36), ForeignKey("sga_notas.notas.id"), nullable=False)
    alumno_id = Column(String(36), nullable=False, index=True)
    padre_id = Column(String(36), index=True)
    tipo_alerta = Column(String(50), nullable=False)
    mensaje = Column(Text, nullable=False)
    leida = Column(Boolean, nullable=False, default=False)
    fecha_lectura = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    
    nota = relationship("NotaModel", back_populates="alertas")
    outbox = relationship("OutboxNotificacionModel", back_populates="alerta")


class OutboxNotificacionModel(Base):
    __tablename__ = "outbox_notificaciones"
    __table_args__ = {"schema": "sga_notas"}
    
    id = Column(String(36), primary_key=True)
    tipo = Column(String(20), nullable=False)  # EMAIL, SMS
    destinatario = Column(String(255), nullable=False)
    mensaje = Column(Text, nullable=False)
    alerta_id = Column(String(36), ForeignKey("sga_notas.alertas_notificacion.id"))
    asunto = Column(String(255))
    meta_data = Column("metadata", JSON)
    estado = Column(String(20), nullable=False, default="PENDIENTE", index=True)
    intentos = Column(Integer, nullable=False, default=0)
    ultimo_error = Column(Text)
    fecha_envio = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    alerta = relationship("AlertaNotificacionModel", back_populates="outbox")
