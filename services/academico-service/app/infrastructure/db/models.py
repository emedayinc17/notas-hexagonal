# Académico Service - Infrastructure DB Models
from sqlalchemy import Column, String, Integer, Enum, Boolean, TIMESTAMP, ForeignKey, Date, DECIMAL, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from shared.common import Base
import enum


class GradoNivelEnum(str, enum.Enum):
    INICIAL = "INICIAL"
    PRIMARIA = "PRIMARIA"
    SECUNDARIA = "SECUNDARIA"


class StatusEnum(str, enum.Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"


class TipoEscalaEnum(str, enum.Enum):
    NUMERICA = "NUMERICA"
    LITERAL = "LITERAL"


class GradoModel(Base):
    __tablename__ = "grados"
    __table_args__ = {"schema": "sga_academico"}
    
    id = Column(String(36), primary_key=True)
    nombre = Column(String(100), nullable=False)
    nivel = Column(Enum(GradoNivelEnum), nullable=False, index=True)
    orden = Column(Integer, nullable=False)
    descripcion = Column(Text)
    status = Column(Enum(StatusEnum), nullable=False, default=StatusEnum.ACTIVO, index=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    secciones = relationship("SeccionModel", back_populates="grado")


class SeccionModel(Base):
    __tablename__ = "secciones"
    __table_args__ = {"schema": "sga_academico"}
    
    id = Column(String(36), primary_key=True)
    grado_id = Column(String(36), ForeignKey("sga_academico.grados.id"), nullable=False, index=True)
    nombre = Column(String(10), nullable=False)
    año_escolar = Column(Integer, nullable=False, index=True)
    capacidad_maxima = Column(Integer)
    status = Column(Enum(StatusEnum), nullable=False, default=StatusEnum.ACTIVO)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    grado = relationship("GradoModel", back_populates="secciones")
    clases = relationship("ClaseModel", back_populates="seccion")


class CursoModel(Base):
    __tablename__ = "cursos"
    __table_args__ = {"schema": "sga_academico"}
    
    id = Column(String(36), primary_key=True)
    codigo = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    horas_semanales = Column(Integer)
    status = Column(Enum(StatusEnum), nullable=False, default=StatusEnum.ACTIVO, index=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    clases = relationship("ClaseModel", back_populates="curso")




class PeriodoTipoModel(Base):
    __tablename__ = "periodo_tipos"
    __table_args__ = {"schema": "sga_academico"}
    
    id = Column(String(36), primary_key=True)
    nombre = Column(String(50), unique=True, nullable=False)
    num_periodos = Column(Integer, nullable=False)
    descripcion = Column(Text)
    status = Column(String(20), nullable=False, default="ACTIVO")
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    periodos = relationship("PeriodoModel", back_populates="tipo")


class PeriodoModel(Base):
    __tablename__ = "periodos"
    __table_args__ = {"schema": "sga_academico"}
    
    id = Column(String(36), primary_key=True)
    año_escolar = Column(Integer, nullable=False, index=True)
    tipo_id = Column(String(36), ForeignKey("sga_academico.periodo_tipos.id"), nullable=False)
    numero = Column(Integer, nullable=False)
    nombre = Column(String(50), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="ACTIVO")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    tipo = relationship("PeriodoTipoModel", back_populates="periodos")
    clases = relationship("ClaseModel", back_populates="periodo")


class ClaseModel(Base):
    __tablename__ = "clases"
    __table_args__ = {"schema": "sga_academico"}
    
    id = Column(String(36), primary_key=True)
    curso_id = Column(String(36), ForeignKey("sga_academico.cursos.id"), nullable=False, index=True)
    seccion_id = Column(String(36), ForeignKey("sga_academico.secciones.id"), nullable=False, index=True)
    periodo_id = Column(String(36), ForeignKey("sga_academico.periodos.id"), nullable=False, index=True)
    docente_user_id = Column(String(36), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="ACTIVA")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    curso = relationship("CursoModel", back_populates="clases")
    seccion = relationship("SeccionModel", back_populates="clases")
    periodo = relationship("PeriodoModel", back_populates="clases")


class EscalaCalificacionModel(Base):
    __tablename__ = "escalas_calificacion"
    __table_args__ = {"schema": "sga_academico"}
    
    id = Column(String(36), primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    tipo = Column(Enum(TipoEscalaEnum), nullable=False, index=True)
    valor_minimo = Column(DECIMAL(5, 2))
    valor_maximo = Column(DECIMAL(5, 2))
    descripcion = Column(Text)
    status = Column(Enum(StatusEnum), nullable=False, default=StatusEnum.ACTIVO, index=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


class UmbralAlertaModel(Base):
    __tablename__ = "umbrales_alerta"
    __table_args__ = {"schema": "sga_academico"}
    
    id = Column(String(36), primary_key=True)
    grado_id = Column(String(36), index=True)
    curso_id = Column(String(36), index=True)
    escala_id = Column(String(36), nullable=False, index=True)
    valor_minimo_literal = Column(String(10))
    valor_minimo_numerico = Column(DECIMAL(5, 2))
    descripcion = Column(Text)
    activo = Column(Boolean, nullable=False, default=True, index=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
