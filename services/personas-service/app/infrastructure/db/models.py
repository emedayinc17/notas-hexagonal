# Personas Service - Infrastructure DB Models
from sqlalchemy import Column, String, Integer, Boolean, TIMESTAMP, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from shared.common import Base


class AlumnoModel(Base):
    __tablename__ = "alumnos"
    __table_args__ = {"schema": "sga_personas"}
    
    id = Column(String(36), primary_key=True)
    codigo_alumno = Column(String(20), unique=True, nullable=False, index=True)
    nombres = Column(String(100), nullable=False)
    apellido_paterno = Column(String(100), nullable=False)
    apellido_materno = Column(String(100))
    fecha_nacimiento = Column(Date, nullable=False)
    genero = Column(String(10), nullable=False)
    dni = Column(String(20), index=True)
    direccion = Column(Text)
    telefono = Column(String(20))
    email = Column(String(100))
    foto_url = Column(String(255))
    status = Column(String(20), nullable=False, default="ACTIVO", index=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    relaciones = relationship("RelacionPadreAlumnoModel", back_populates="alumno", foreign_keys="RelacionPadreAlumnoModel.alumno_id")
    matriculas = relationship("MatriculaClaseModel", back_populates="alumno")


class PadreModel(Base):
    __tablename__ = "padres"
    __table_args__ = {"schema": "sga_personas"}
    
    id = Column(String(36), primary_key=True)
    nombres = Column(String(100), nullable=False)
    apellido_paterno = Column(String(100), nullable=False)
    apellido_materno = Column(String(100))
    email = Column(String(100), nullable=False, index=True)
    dni = Column(String(20), index=True)
    telefono = Column(String(20))
    celular = Column(String(20))
    direccion = Column(Text)
    ocupacion = Column(String(100))
    status = Column(String(20), nullable=False, default="ACTIVO", index=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    relaciones = relationship("RelacionPadreAlumnoModel", back_populates="padre", foreign_keys="RelacionPadreAlumnoModel.padre_id")


class RelacionPadreAlumnoModel(Base):
    __tablename__ = "relaciones_padre_alumno"
    __table_args__ = {"schema": "sga_personas"}
    
    id = Column(String(36), primary_key=True)
    padre_id = Column(String(36), ForeignKey("sga_personas.padres.id"), nullable=False, index=True)
    alumno_id = Column(String(36), ForeignKey("sga_personas.alumnos.id"), nullable=False, index=True)
    tipo_relacion = Column(String(20), nullable=False)
    es_contacto_principal = Column(Boolean, nullable=False, default=False)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    padre = relationship("PadreModel", back_populates="relaciones", foreign_keys=[padre_id])
    alumno = relationship("AlumnoModel", back_populates="relaciones", foreign_keys=[alumno_id])


class MatriculaClaseModel(Base):
    __tablename__ = "matriculas_clase"
    __table_args__ = {"schema": "sga_personas"}
    
    id = Column(String(36), primary_key=True)
    alumno_id = Column(String(36), ForeignKey("sga_personas.alumnos.id"), nullable=False, index=True)
    clase_id = Column(String(36), nullable=False, index=True)
    fecha_matricula = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="ACTIVO", index=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    alumno = relationship("AlumnoModel", back_populates="matriculas")
