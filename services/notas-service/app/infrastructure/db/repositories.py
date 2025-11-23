# Notas Service - Infrastructure DB Repositories
from typing import Optional, List
from sqlalchemy.orm import Session
from app.domain import *
from .models import *


def nota_model_to_domain(model: NotaModel) -> Nota:
    return Nota(
        id=model.id,
        matricula_clase_id=model.matricula_clase_id,
        tipo_evaluacion_id=model.tipo_evaluacion_id,
        periodo_id=model.periodo_id,
        escala_id=model.escala_id,
        fecha_registro=model.fecha_registro,
        registrado_por_user_id=model.registrado_por_user_id,
        valor_literal=model.valor_literal,
        valor_numerico=model.valor_numerico,
        peso=model.peso,
        observaciones=model.observaciones,
        is_deleted=model.is_deleted,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def tipo_evaluacion_model_to_domain(model: TipoEvaluacionModel) -> TipoEvaluacion:
    return TipoEvaluacion(
        id=model.id,
        nombre=model.nombre,
        codigo=model.codigo,
        peso_default=model.peso_default,
        descripcion=model.descripcion,
        status=model.status,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def alerta_model_to_domain(model: AlertaNotificacionModel) -> AlertaNotificacion:
    return AlertaNotificacion(
        id=model.id,
        nota_id=model.nota_id,
        alumno_id=model.alumno_id,
        padre_id=model.padre_id,
        tipo_alerta=model.tipo_alerta,
        mensaje=model.mensaje,
        leida=model.leida,
        fecha_lectura=model.fecha_lectura,
        created_at=model.created_at,
    )


def outbox_model_to_domain(model: OutboxNotificacionModel) -> OutboxNotificacion:
    return OutboxNotificacion(
        id=model.id,
        tipo=model.tipo,
        destinatario=model.destinatario,
        mensaje=model.mensaje,
        alerta_id=model.alerta_id,
        asunto=model.asunto,
        metadata=str(model.metadata) if model.metadata else None,
        estado=model.estado,
        intentos=model.intentos,
        ultimo_error=model.ultimo_error,
        fecha_envio=model.fecha_envio,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


class SqlAlchemyNotaRepository(NotaRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, nota: Nota) -> Nota:
        model = NotaModel(
            id=nota.id,
            matricula_clase_id=nota.matricula_clase_id,
            tipo_evaluacion_id=nota.tipo_evaluacion_id,
            periodo_id=nota.periodo_id,
            escala_id=nota.escala_id,
            fecha_registro=nota.fecha_registro,
            registrado_por_user_id=nota.registrado_por_user_id,
            valor_literal=nota.valor_literal,
            valor_numerico=nota.valor_numerico,
            peso=nota.peso,
            observaciones=nota.observaciones,
            is_deleted=nota.is_deleted,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return nota_model_to_domain(model)
    
    def find_by_id(self, nota_id: str) -> Optional[Nota]:
        model = self.session.query(NotaModel).filter(
            NotaModel.id == nota_id,
            NotaModel.is_deleted == False
        ).first()
        return nota_model_to_domain(model) if model else None
    
    def find_all(self, offset: int = 0, limit: int = 20) -> List[Nota]:
        models = self.session.query(NotaModel).filter(
            NotaModel.is_deleted == False
        ).offset(offset).limit(limit).all()
        return [nota_model_to_domain(m) for m in models]
    
    def find_by_alumno(self, alumno_id: str) -> List[Nota]:
        # Esta consulta requeriría un join con matriculas si no tenemos el alumno_id directo en notas
        # Por ahora asumimos que se filtra por matricula o se implementará lógica adicional
        # Simplificación: buscar por matriculas asociadas (requeriría paso extra)
        # Ojo: NotaModel tiene matricula_clase_id. 
        # Para buscar por alumno necesitamos saber sus matriculas.
        # Esto se haría mejor en un query service o pasando las matriculas IDs.
        return []

    def find_by_clase(self, clase_id: str) -> List[Nota]:
        # Similar al anterior, necesitamos filtrar por matriculas de esa clase
        return []


class SqlAlchemyTipoEvaluacionRepository(TipoEvaluacionRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def find_by_id(self, tipo_id: str) -> Optional[TipoEvaluacion]:
        model = self.session.query(TipoEvaluacionModel).filter(
            TipoEvaluacionModel.id == tipo_id
        ).first()
        return tipo_evaluacion_model_to_domain(model) if model else None
    
    def find_all(self) -> List[TipoEvaluacion]:
        models = self.session.query(TipoEvaluacionModel).filter(
            TipoEvaluacionModel.status == "ACTIVO"
        ).all()
        return [tipo_evaluacion_model_to_domain(m) for m in models]


class SqlAlchemyAlertaRepository(AlertaRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, alerta: AlertaNotificacion) -> AlertaNotificacion:
        model = AlertaNotificacionModel(
            id=alerta.id,
            nota_id=alerta.nota_id,
            alumno_id=alerta.alumno_id,
            padre_id=alerta.padre_id,
            tipo_alerta=alerta.tipo_alerta,
            mensaje=alerta.mensaje,
            leida=alerta.leida,
            fecha_lectura=alerta.fecha_lectura,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return alerta_model_to_domain(model)
    
    def find_by_padre(self, padre_id: str) -> List[AlertaNotificacion]:
        models = self.session.query(AlertaNotificacionModel).filter(
            AlertaNotificacionModel.padre_id == padre_id
        ).all()
        return [alerta_model_to_domain(m) for m in models]


class SqlAlchemyOutboxRepository(OutboxRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, outbox: OutboxNotificacion) -> OutboxNotificacion:
        model = OutboxNotificacionModel(
            id=outbox.id,
            tipo=outbox.tipo,
            destinatario=outbox.destinatario,
            mensaje=outbox.mensaje,
            alerta_id=outbox.alerta_id,
            asunto=outbox.asunto,
            metadata=outbox.metadata, # JSON handling might need adjustment depending on DB
            estado=outbox.estado,
            intentos=outbox.intentos,
        )
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return outbox_model_to_domain(model)
    
    def find_pendientes(self, limit: int = 10) -> List[OutboxNotificacion]:
        models = self.session.query(OutboxNotificacionModel).filter(
            OutboxNotificacionModel.estado == "PENDIENTE"
        ).limit(limit).all()
        return [outbox_model_to_domain(m) for m in models]
