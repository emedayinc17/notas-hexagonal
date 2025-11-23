# Académico Service - Infrastructure DB Repositories
from typing import Optional, List
from sqlalchemy.orm import Session
from app.domain import *
from .models import *


def grado_model_to_domain(model: GradoModel) -> Grado:
    return Grado(
        id=model.id,
        nombre=model.nombre,
        nivel=GradoNivel(model.nivel.value if hasattr(model.nivel, 'value') else model.nivel),
        orden=model.orden,
        descripcion=model.descripcion,
        status=model.status.value if hasattr(model.status, 'value') else model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def curso_model_to_domain(model: CursoModel) -> Curso:
    return Curso(
        id=model.id,
        codigo=model.codigo,
        nombre=model.nombre,
        descripcion=model.descripcion,
        horas_semanales=model.horas_semanales,
        status=model.status.value if hasattr(model.status, 'value') else model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def seccion_model_to_domain(model: SeccionModel) -> Seccion:
    return Seccion(
        id=model.id,
        grado_id=model.grado_id,
        nombre=model.nombre,
        año_escolar=model.año_escolar,
        capacidad_maxima=model.capacidad_maxima,
        status=model.status.value if hasattr(model.status, 'value') else model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def periodo_model_to_domain(model: PeriodoModel) -> Periodo:
    return Periodo(
        id=model.id,
        año_escolar=model.año_escolar,
        tipo_id=model.tipo_id,
        numero=model.numero,
        nombre=model.nombre,
        fecha_inicio=model.fecha_inicio,
        fecha_fin=model.fecha_fin,
        status=model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def clase_model_to_domain(model: ClaseModel) -> Clase:
    clase = Clase(
        id=model.id,
        curso_id=model.curso_id,
        seccion_id=model.seccion_id,
        periodo_id=model.periodo_id,
        docente_user_id=model.docente_user_id,
        status=model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )
    if model.curso:
        clase.curso = curso_model_to_domain(model.curso)
    if model.seccion:
        clase.seccion = seccion_model_to_domain(model.seccion)
    if model.periodo:
        clase.periodo = periodo_model_to_domain(model.periodo)
    return clase


def escala_model_to_domain(model: EscalaCalificacionModel) -> EscalaCalificacion:
    return EscalaCalificacion(
        id=model.id,
        nombre=model.nombre,
        tipo=TipoEscala(model.tipo.value if hasattr(model.tipo, 'value') else model.tipo),
        valor_minimo=float(model.valor_minimo) if model.valor_minimo else None,
        valor_maximo=float(model.valor_maximo) if model.valor_maximo else None,
        descripcion=model.descripcion,
        status=model.status.value if hasattr(model.status, 'value') else model.status,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def umbral_model_to_domain(model: UmbralAlertaModel) -> UmbralAlerta:
    return UmbralAlerta(
        id=model.id,
        escala_id=model.escala_id,
        grado_id=model.grado_id,
        curso_id=model.curso_id,
        valor_minimo_numerico=float(model.valor_minimo_numerico) if model.valor_minimo_numerico else None,
        valor_minimo_literal=model.valor_minimo_literal,
        descripcion=model.descripcion,
        activo=model.activo,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def periodo_tipo_model_to_domain(model: PeriodoTipoModel) -> PeriodoTipo:
    return PeriodoTipo(
        id=model.id,
        nombre=model.nombre,
        num_periodos=model.num_periodos,
        descripcion=model.descripcion,
        status=model.status,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


class SqlAlchemyPeriodoTipoRepository(PeriodoTipoRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, tipo: PeriodoTipo) -> PeriodoTipo:
        model = PeriodoTipoModel(
            id=tipo.id,
            nombre=tipo.nombre,
            num_periodos=tipo.num_periodos,
            descripcion=tipo.descripcion,
            status=tipo.status,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return periodo_tipo_model_to_domain(model)
    
    def find_by_id(self, tipo_id: str) -> Optional[PeriodoTipo]:
        model = self.session.query(PeriodoTipoModel).filter(
            PeriodoTipoModel.id == tipo_id
        ).first()
        return periodo_tipo_model_to_domain(model) if model else None
    
    def find_all(self, offset: int = 0, limit: int = 20) -> List[PeriodoTipo]:
        models = self.session.query(PeriodoTipoModel).offset(offset).limit(limit).all()
        return [periodo_tipo_model_to_domain(m) for m in models]


class SqlAlchemyGradoRepository(GradoRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, grado: Grado) -> Grado:
        model = GradoModel(
            id=grado.id,
            nombre=grado.nombre,
            nivel=grado.nivel.value if isinstance(grado.nivel, GradoNivel) else grado.nivel,
            orden=grado.orden,
            descripcion=grado.descripcion,
            status=grado.status,
            is_deleted=grado.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return grado_model_to_domain(model)
    
    def find_by_id(self, grado_id: str) -> Optional[Grado]:
        model = self.session.query(GradoModel).filter(
            GradoModel.id == grado_id,
            GradoModel.is_deleted == False
        ).first()
        return grado_model_to_domain(model) if model else None
    
    def find_all(self, nivel: Optional[str] = None, offset: int = 0, limit: int = 20) -> List[Grado]:
        query = self.session.query(GradoModel).filter(GradoModel.is_deleted == False)
        if nivel:
            query = query.filter(GradoModel.nivel == nivel)
        models = query.offset(offset).limit(limit).all()
        return [grado_model_to_domain(m) for m in models]


class SqlAlchemySeccionRepository(SeccionRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, seccion: Seccion) -> Seccion:
        model = SeccionModel(
            id=seccion.id,
            grado_id=seccion.grado_id,
            nombre=seccion.nombre,
            año_escolar=seccion.año_escolar,
            capacidad_maxima=seccion.capacidad_maxima,
            status=seccion.status,
            is_deleted=seccion.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return seccion_model_to_domain(model)
    
    def find_by_id(self, seccion_id: str) -> Optional[Seccion]:
        model = self.session.query(SeccionModel).filter(
            SeccionModel.id == seccion_id,
            SeccionModel.is_deleted == False
        ).first()
        return seccion_model_to_domain(model) if model else None
    
    def find_all(self, grado_id: Optional[str] = None, año: Optional[int] = None, offset: int = 0, limit: int = 20) -> List[Seccion]:
        query = self.session.query(SeccionModel).filter(SeccionModel.is_deleted == False)
        if grado_id:
            query = query.filter(SeccionModel.grado_id == grado_id)
        if año:
            query = query.filter(SeccionModel.año_escolar == año)
        models = query.offset(offset).limit(limit).all()
        return [seccion_model_to_domain(m) for m in models]


class SqlAlchemyCursoRepository(CursoRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, curso: Curso) -> Curso:
        model = CursoModel(
            id=curso.id,
            codigo=curso.codigo,
            nombre=curso.nombre,
            descripcion=curso.descripcion,
            horas_semanales=curso.horas_semanales,
            status=curso.status,
            is_deleted=curso.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return curso_model_to_domain(model)
    
    def find_by_id(self, curso_id: str) -> Optional[Curso]:
        model = self.session.query(CursoModel).filter(
            CursoModel.id == curso_id,
            CursoModel.is_deleted == False
        ).first()
        return curso_model_to_domain(model) if model else None
    
    def find_by_codigo(self, codigo: str) -> Optional[Curso]:
        model = self.session.query(CursoModel).filter(
            CursoModel.codigo == codigo,
            CursoModel.is_deleted == False
        ).first()
        return curso_model_to_domain(model) if model else None
    
    def find_all(self, offset: int = 0, limit: int = 20) -> List[Curso]:
        models = self.session.query(CursoModel).filter(
            CursoModel.is_deleted == False
        ).offset(offset).limit(limit).all()
        return [curso_model_to_domain(m) for m in models]


class SqlAlchemyPeriodoRepository(PeriodoRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, periodo: Periodo) -> Periodo:
        model = PeriodoModel(
            id=periodo.id,
            año_escolar=periodo.año_escolar,
            tipo_id=periodo.tipo_id,
            numero=periodo.numero,
            nombre=periodo.nombre,
            fecha_inicio=periodo.fecha_inicio,
            fecha_fin=periodo.fecha_fin,
            status=periodo.status,
            is_deleted=periodo.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return periodo_model_to_domain(model)
    
    def find_by_id(self, periodo_id: str) -> Optional[Periodo]:
        model = self.session.query(PeriodoModel).filter(
            PeriodoModel.id == periodo_id,
            PeriodoModel.is_deleted == False
        ).first()
        return periodo_model_to_domain(model) if model else None
    
    def find_all(self, año_escolar: Optional[int] = None, offset: int = 0, limit: int = 20) -> List[Periodo]:
        query = self.session.query(PeriodoModel).filter(PeriodoModel.is_deleted == False)
        if año_escolar:
            query = query.filter(PeriodoModel.año_escolar == año_escolar)
        models = query.offset(offset).limit(limit).all()
        return [periodo_model_to_domain(m) for m in models]


class SqlAlchemyClaseRepository(ClaseRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, clase: Clase) -> Clase:
        model = ClaseModel(
            id=clase.id,
            curso_id=clase.curso_id,
            seccion_id=clase.seccion_id,
            periodo_id=clase.periodo_id,
            docente_user_id=clase.docente_user_id,
            status=clase.status,
            is_deleted=clase.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return clase_model_to_domain(model)
    
    def find_by_id(self, clase_id: str) -> Optional[Clase]:
        model = self.session.query(ClaseModel).filter(
            ClaseModel.id == clase_id,
            ClaseModel.is_deleted == False
        ).first()
        return clase_model_to_domain(model) if model else None
    
    def find_by_docente(self, docente_user_id: str, periodo_id: Optional[str] = None) -> List[Clase]:
        query = self.session.query(ClaseModel).filter(
            ClaseModel.docente_user_id == docente_user_id,
            ClaseModel.is_deleted == False
        )
        if periodo_id:
            query = query.filter(ClaseModel.periodo_id == periodo_id)
        models = query.all()
        return [clase_model_to_domain(m) for m in models]
    
    def find_all(self, curso_id: Optional[str] = None, seccion_id: Optional[str] = None, 
                 periodo_id: Optional[str] = None, offset: int = 0, limit: int = 20) -> List[Clase]:
        query = self.session.query(ClaseModel).filter(ClaseModel.is_deleted == False)
        
        if curso_id:
            query = query.filter(ClaseModel.curso_id == curso_id)
        if seccion_id:
            query = query.filter(ClaseModel.seccion_id == seccion_id)
        if periodo_id:
            query = query.filter(ClaseModel.periodo_id == periodo_id)
            
        models = query.offset(offset).limit(limit).all()
        return [clase_model_to_domain(m) for m in models]


class SqlAlchemyEscalaCalificacionRepository(EscalaCalificacionRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, escala: EscalaCalificacion) -> EscalaCalificacion:
        model = EscalaCalificacionModel(
            id=escala.id,
            nombre=escala.nombre,
            tipo=escala.tipo.value if isinstance(escala.tipo, TipoEscala) else escala.tipo,
            valor_minimo=escala.valor_minimo,
            valor_maximo=escala.valor_maximo,
            descripcion=escala.descripcion,
            status=escala.status,
            is_deleted=escala.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return escala_model_to_domain(model)
    
    def find_by_id(self, escala_id: str) -> Optional[EscalaCalificacion]:
        model = self.session.query(EscalaCalificacionModel).filter(
            EscalaCalificacionModel.id == escala_id,
            EscalaCalificacionModel.is_deleted == False
        ).first()
        return escala_model_to_domain(model) if model else None
    
    def find_all(self, offset: int = 0, limit: int = 20) -> List[EscalaCalificacion]:
        models = self.session.query(EscalaCalificacionModel).filter(
            EscalaCalificacionModel.is_deleted == False
        ).offset(offset).limit(limit).all()
        return [escala_model_to_domain(m) for m in models]


class SqlAlchemyUmbralAlertaRepository(UmbralAlertaRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, umbral: UmbralAlerta) -> UmbralAlerta:
        model = UmbralAlertaModel(
            id=umbral.id,
            escala_id=umbral.escala_id,
            grado_id=umbral.grado_id,
            curso_id=umbral.curso_id,
            valor_minimo_numerico=umbral.valor_minimo_numerico,
            valor_minimo_literal=umbral.valor_minimo_literal,
            descripcion=umbral.descripcion,
            activo=umbral.activo,
            is_deleted=umbral.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return umbral_model_to_domain(model)
    
    def find_by_id(self, umbral_id: str) -> Optional[UmbralAlerta]:
        model = self.session.query(UmbralAlertaModel).filter(
            UmbralAlertaModel.id == umbral_id,
            UmbralAlertaModel.is_deleted == False
        ).first()
        return umbral_model_to_domain(model) if model else None
    
    def find_by_escala(self, escala_id: str, curso_id: Optional[str] = None, grado_id: Optional[str] = None) -> Optional[UmbralAlerta]:
        query = self.session.query(UmbralAlertaModel).filter(
            UmbralAlertaModel.escala_id == escala_id,
            UmbralAlertaModel.activo == True,
            UmbralAlertaModel.is_deleted == False
        )
        
        # Buscar primero específico, luego general
        if curso_id and grado_id:
            specific = query.filter(
                UmbralAlertaModel.curso_id == curso_id,
                UmbralAlertaModel.grado_id == grado_id
            ).first()
            if specific:
                return umbral_model_to_domain(specific)
        
        if curso_id:
            specific = query.filter(UmbralAlertaModel.curso_id == curso_id).first()
            if specific:
                return umbral_model_to_domain(specific)
        
        if grado_id:
            specific = query.filter(UmbralAlertaModel.grado_id == grado_id).first()
            if specific:
                return umbral_model_to_domain(specific)
        
        # Global
        global_umbral = query.filter(
            UmbralAlertaModel.curso_id == None,
            UmbralAlertaModel.grado_id == None
        ).first()
        
        return umbral_model_to_domain(global_umbral) if global_umbral else None
    
    def find_all(self, activo: Optional[bool] = None, offset: int = 0, limit: int = 20) -> List[UmbralAlerta]:
        query = self.session.query(UmbralAlertaModel).filter(UmbralAlertaModel.is_deleted == False)
        if activo is not None:
            query = query.filter(UmbralAlertaModel.activo == activo)
        models = query.offset(offset).limit(limit).all()
        return [umbral_model_to_domain(m) for m in models]
