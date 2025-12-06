# Personas Service - Infrastructure DB Repositories
from typing import Optional, List
from sqlalchemy.orm import Session
from app.domain import *
from .models import *


def alumno_model_to_domain(model: AlumnoModel) -> Alumno:
    return Alumno(
        id=model.id,
        codigo_alumno=model.codigo_alumno,
        nombres=model.nombres,
        apellido_paterno=model.apellido_paterno,
        apellido_materno=model.apellido_materno,
        fecha_nacimiento=model.fecha_nacimiento,
        genero=model.genero,
        dni=model.dni,
        direccion=model.direccion,
        telefono=model.telefono,
        email=model.email,
        foto_url=model.foto_url,
        status=model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def padre_model_to_domain(model: PadreModel) -> Padre:
    return Padre(
        id=model.id,
        nombres=model.nombres,
        apellido_paterno=model.apellido_paterno,
        apellido_materno=model.apellido_materno,
        email=model.email,
        dni=model.dni,
        telefono=model.telefono,
        celular=model.celular,
        direccion=model.direccion,
        ocupacion=model.ocupacion,
        status=model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def relacion_model_to_domain(model: RelacionPadreAlumnoModel) -> RelacionPadreAlumno:
    return RelacionPadreAlumno(
        id=model.id,
        padre_id=model.padre_id,
        alumno_id=model.alumno_id,
        tipo_relacion=model.tipo_relacion,
        es_contacto_principal=model.es_contacto_principal,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def matricula_model_to_domain(model: MatriculaClaseModel) -> MatriculaClase:
    return MatriculaClase(
        id=model.id,
        alumno_id=model.alumno_id,
        clase_id=model.clase_id,
        fecha_matricula=model.fecha_matricula,
        status=model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


class SqlAlchemyAlumnoRepository(AlumnoRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, alumno: Alumno) -> Alumno:
        model = AlumnoModel(
            id=alumno.id,
            codigo_alumno=alumno.codigo_alumno,
            nombres=alumno.nombres,
            apellido_paterno=alumno.apellido_paterno,
            apellido_materno=alumno.apellido_materno,
            fecha_nacimiento=alumno.fecha_nacimiento,
            genero=alumno.genero,
            dni=alumno.dni,
            direccion=alumno.direccion,
            telefono=alumno.telefono,
            email=alumno.email,
            foto_url=alumno.foto_url,
            status=alumno.status,
            is_deleted=alumno.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return alumno_model_to_domain(model)
    
    def find_by_id(self, alumno_id: str) -> Optional[Alumno]:
        model = self.session.query(AlumnoModel).filter(
            AlumnoModel.id == alumno_id,
            AlumnoModel.is_deleted == False
        ).first()
        return alumno_model_to_domain(model) if model else None
    
    def find_by_codigo(self, codigo: str) -> Optional[Alumno]:
        model = self.session.query(AlumnoModel).filter(
            AlumnoModel.codigo_alumno == codigo,
            AlumnoModel.is_deleted == False
        ).first()
        return alumno_model_to_domain(model) if model else None
    
    def find_all(self, offset: int = 0, limit: int = 20) -> List[Alumno]:
        models = self.session.query(AlumnoModel).filter(
            AlumnoModel.is_deleted == False
        ).offset(offset).limit(limit).all()
        return [alumno_model_to_domain(m) for m in models]


class SqlAlchemyPadreRepository(PadreRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, padre: Padre) -> Padre:
        model = PadreModel(
            id=padre.id,
            nombres=padre.nombres,
            apellido_paterno=padre.apellido_paterno,
            apellido_materno=padre.apellido_materno,
            email=padre.email,
            dni=padre.dni,
            telefono=padre.telefono,
            celular=padre.celular,
            direccion=padre.direccion,
            ocupacion=padre.ocupacion,
            status=padre.status,
            is_deleted=padre.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return padre_model_to_domain(model)
    
    def find_by_id(self, padre_id: str) -> Optional[Padre]:
        model = self.session.query(PadreModel).filter(
            PadreModel.id == padre_id,
            PadreModel.is_deleted == False
        ).first()
        return padre_model_to_domain(model) if model else None
    
    def find_all(self, offset: int = 0, limit: int = 20) -> List[Padre]:
        models = self.session.query(PadreModel).filter(
            PadreModel.is_deleted == False
        ).offset(offset).limit(limit).all()
        return [padre_model_to_domain(m) for m in models]


class SqlAlchemyRelacionPadreAlumnoRepository(RelacionPadreAlumnoRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, relacion: RelacionPadreAlumno) -> RelacionPadreAlumno:
        model = RelacionPadreAlumnoModel(
            id=relacion.id,
            padre_id=relacion.padre_id,
            alumno_id=relacion.alumno_id,
            tipo_relacion=relacion.tipo_relacion,
            es_contacto_principal=relacion.es_contacto_principal,
            is_deleted=relacion.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return relacion_model_to_domain(model)
    
    def find_by_padre(self, padre_id: str) -> List[RelacionPadreAlumno]:
        models = self.session.query(RelacionPadreAlumnoModel).filter(
            RelacionPadreAlumnoModel.padre_id == padre_id,
            RelacionPadreAlumnoModel.is_deleted == False
        ).all()
        return [relacion_model_to_domain(m) for m in models]
    
    def find_by_alumno(self, alumno_id: str) -> List[RelacionPadreAlumno]:
        models = self.session.query(RelacionPadreAlumnoModel).filter(
            RelacionPadreAlumnoModel.alumno_id == alumno_id,
            RelacionPadreAlumnoModel.is_deleted == False
        ).all()
        return [relacion_model_to_domain(m) for m in models]
    
    def find_by_padre_and_alumno_including_deleted(self, padre_id: str, alumno_id: str) -> Optional[RelacionPadreAlumno]:
        """Busca una relación específica entre padre y alumno, incluyendo las eliminadas (soft deleted)"""
        model = self.session.query(RelacionPadreAlumnoModel).filter(
            RelacionPadreAlumnoModel.padre_id == padre_id,
            RelacionPadreAlumnoModel.alumno_id == alumno_id
        ).first()
        return relacion_model_to_domain(model) if model else None
    
    def update(self, relacion: RelacionPadreAlumno) -> RelacionPadreAlumno:
        """Actualiza una relación existente"""
        model = self.session.query(RelacionPadreAlumnoModel).filter(
            RelacionPadreAlumnoModel.id == relacion.id
        ).first()
        
        if model:
            model.tipo_relacion = relacion.tipo_relacion
            model.es_contacto_principal = relacion.es_contacto_principal
            model.is_deleted = relacion.is_deleted
            self.session.commit()
            self.session.refresh(model)
            return relacion_model_to_domain(model)
        return relacion


class SqlAlchemyMatriculaClaseRepository(MatriculaClaseRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, matricula: MatriculaClase) -> MatriculaClase:
        model = MatriculaClaseModel(
            id=matricula.id,
            alumno_id=matricula.alumno_id,
            clase_id=matricula.clase_id,
            fecha_matricula=matricula.fecha_matricula,
            status=matricula.status,
            is_deleted=matricula.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return matricula_model_to_domain(model)
    
    def find_by_id(self, matricula_id: str) -> Optional[MatriculaClase]:
        model = self.session.query(MatriculaClaseModel).filter(
            MatriculaClaseModel.id == matricula_id,
            MatriculaClaseModel.is_deleted == False
        ).first()
        return matricula_model_to_domain(model) if model else None
    
    def find_by_clase(self, clase_id: str) -> List[MatriculaClase]:
        models = self.session.query(MatriculaClaseModel).filter(
            MatriculaClaseModel.clase_id == clase_id,
            MatriculaClaseModel.is_deleted == False
        ).all()
        return [matricula_model_to_domain(m) for m in models]
    
    def find_by_alumno(self, alumno_id: str) -> List[MatriculaClase]:
        models = self.session.query(MatriculaClaseModel).filter(
            MatriculaClaseModel.alumno_id == alumno_id,
            MatriculaClaseModel.is_deleted == False
        ).all()
        return [matricula_model_to_domain(m) for m in models]
    
    def find_all(self, alumno_id: Optional[str] = None, clase_id: Optional[str] = None,
                 offset: int = 0, limit: int = 20) -> List[MatriculaClase]:
        query = self.session.query(MatriculaClaseModel).filter(
            MatriculaClaseModel.is_deleted == False
        )
        if alumno_id:
            query = query.filter(MatriculaClaseModel.alumno_id == alumno_id)
        if clase_id:
            query = query.filter(MatriculaClaseModel.clase_id == clase_id)
        models = query.offset(offset).limit(limit).all()
        return [matricula_model_to_domain(m) for m in models]
