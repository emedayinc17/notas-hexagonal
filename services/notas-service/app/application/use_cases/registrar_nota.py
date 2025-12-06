# Notas Service - Use Case: Registrar Nota (⭐ CRÍTICO - CON INTEGRACIÓN)
from datetime import date as dt_date
from sqlalchemy.orm import Session
from shared.common import (
    generate_uuid, 
    ValidationException,
    AuditHelper,
    AccionAuditoria,
)
from app.domain import (
    Nota,
    AlertaNotificacion,
    OutboxNotificacion,
    NotaRepository,
    AlertaRepository,
    OutboxRepository,
)
from app.infrastructure.clients.personas_client import PersonasServiceClient
from app.infrastructure.clients.academico_client import AcademicoServiceClient


class RegistrarNotaUseCase:
    """
    Caso de uso para registrar una nota.
    
    1. Crea la nota en la BD
    2. Evalúa si está por debajo del umbral definido
    3. Si está por debajo:
       a. Crea alerta
       b. Obtiene padres del alumno (HTTP call a Personas Service)
       c. Crea outbox para cada padre
    """
    
    def __init__(
        self,
        nota_repository: NotaRepository,
        alerta_repository: AlertaRepository,
        outbox_repository: OutboxRepository,
        personas_client: PersonasServiceClient,
        academico_client: AcademicoServiceClient,
        db_session: Session,
    ):
        self.nota_repository = nota_repository
        self.alerta_repository = alerta_repository
        self.outbox_repository = outbox_repository
        self.personas_client = personas_client
        self.academico_client = academico_client
        self.db_session = db_session
    
    async def execute(
        self,
        matricula_clase_id: str,
        tipo_evaluacion_id: str,
        periodo_id: str,
        escala_id: str,
        registrado_por_user_id: str,
        valor_literal: str = None,
        valor_numerico: float = None,
        peso: float = None,
        observaciones: str = None,
        columna_nota: str = "N1",
        auth_token: str = None,
        # Argumentos opcionales para optimización (cache)
        matricula_info_cache: dict = None,
        umbral_cache: dict = None,
    ) -> dict:
        # Validaciones
        if not valor_literal and valor_numerico is None:
            raise ValidationException("Debe proporcionar valor_literal o valor_numerico")
        
        # Crear nota
        nueva_nota = Nota(
            id=generate_uuid(),
            matricula_clase_id=matricula_clase_id,
            tipo_evaluacion_id=tipo_evaluacion_id,
            periodo_id=periodo_id,
            escala_id=escala_id,
            valor_literal=valor_literal,
            valor_numerico=valor_numerico,
            peso=peso,
            observaciones=observaciones,
            columna_nota=columna_nota,
            fecha_registro=dt_date.today(),
            registrado_por_user_id=registrado_por_user_id,
        )
        
        nota_creada = self.nota_repository.create(nueva_nota)
        # Log simple para depuración: confirmar creación/actualización en stdout
        try:
            print(f"[DEBUG NOTA] nota creada/actualizada id={nota_creada.id} matricula_clase_id={nota_creada.matricula_clase_id} valor_numerico={nota_creada.valor_numerico}")
        except Exception:
            pass
        
        # Evaluar umbrales y generar alertas
        alerta_generada = False
        alertas_enviadas = 0
        
        # Obtener información de matrícula (alumno_id, clase_id)
        if matricula_info_cache:
            matricula_info = matricula_info_cache
        else:
            matricula_info = await self.personas_client.get_matricula_info(
                matricula_clase_id, 
                auth_token
            )
        
        if matricula_info and matricula_info.get("alumno_id"):
            alumno_id = matricula_info["alumno_id"]
            
            # Obtener umbral (podría ser específico del curso/grado o global)
            if umbral_cache:
                umbral = umbral_cache
            else:
                umbral = await self.academico_client.get_umbral_alerta(
                    escala_id=escala_id,
                    token=auth_token
                )
            
            # Verificar si la nota está por debajo del umbral
            if umbral and self._nota_por_debajo_umbral(nota_creada, umbral):
                # Crear alerta
                alerta = AlertaNotificacion(
                    id=generate_uuid(),
                    nota_id=nota_creada.id,
                    alumno_id=alumno_id,
                    padre_id=None,  # Se asigna al recorrer padres
                    tipo_alerta="NOTA_BAJA",
                    mensaje=f"Nota por debajo del umbral: {valor_numerico or valor_literal}",
                )
                alerta_creada = self.alerta_repository.create(alerta)
                alerta_generada = True
                
                # Obtener padres del alumno (HTTP call a Personas Service)
                padres = await self.personas_client.get_padres_by_alumno(
                    alumno_id, 
                    auth_token
                )
                
                if not padres:
                    raise ValidationException("El alumno no tiene padres asignados. No se puede registrar la nota.")
                
                # Crear outbox para cada padre
                for padre in padres:
                    if padre.get("email"):
                        outbox = OutboxNotificacion(
                            id=generate_uuid(),
                            alerta_id=alerta_creada.id,
                            tipo="EMAIL",
                            destinatario=padre["email"],
                            asunto="⚠️ Alerta de Nota Baja",
                            mensaje=self._generar_mensaje_email(
                                padre,
                                alumno_id,
                                valor_numerico or valor_literal,
                                umbral
                            ),
                            estado="PENDIENTE",
                            intentos=0,
                        )
                        self.outbox_repository.create(outbox)
                        alertas_enviadas += 1
        
        # AUDITORÍA: Registro de nota (CRÍTICO)
        try:
            AuditHelper.log_action(
                session=self.db_session,
                user_id=registrado_por_user_id,
                username=None,  # No tenemos username aquí
                rol_nombre=None,  # No tenemos rol aquí
                accion=AccionAuditoria.CREATE_NOTA,
                entidad="Nota",
                entidad_id=nota_creada.id,
                descripcion=f"Nota registrada: {valor_numerico or valor_literal}",
                datos_nuevos={
                    "matricula_clase_id": matricula_clase_id,
                    "tipo_evaluacion_id": tipo_evaluacion_id,
                    "periodo_id": periodo_id,
                    "escala_id": escala_id,
                    "valor_numerico": valor_numerico,
                    "valor_literal": valor_literal,
                    "peso": peso,
                    "alerta_generada": alerta_generada,
                },
                endpoint="/v1/notas",
                metodo_http="POST",
                exitoso=True,
                codigo_respuesta=201,
            )
        except:
            pass  # No fallar si falla la auditoría
        
        return {
            "nota": {
                "id": nota_creada.id,
                "valor_literal": nota_creada.valor_literal,
                "valor_numerico": nota_creada.valor_numerico,
                "fecha_registro": nota_creada.fecha_registro.isoformat(),
            },
            "alerta_generada": alerta_generada,
            "notificaciones_pendientes": alertas_enviadas,
        }
    
    def _nota_por_debajo_umbral(self, nota: Nota, umbral: dict) -> bool:
        """Evalúa si la nota está por debajo del umbral definido"""
        if nota.valor_numerico is not None and umbral.get("valor_minimo_numerico"):
            return nota.valor_numerico < float(umbral["valor_minimo_numerico"])
        
        # TODO: Comparar valores literales (AD > A > B > C)
        if nota.valor_literal and umbral.get("valor_minimo_literal"):
            # Simplificado: asumimos que si tiene un literal diferente está mal
            return nota.valor_literal != umbral["valor_minimo_literal"]
        
        return False
    
    def _generar_mensaje_email(self, padre: dict, alumno_id: str, nota_valor: str, umbral: dict) -> str:
        """Genera el mensaje del email para el padre"""
        return f"""
Estimado(a) {padre.get('nombres', '')} {padre.get('apellido_paterno', '')}:

Le informamos que su hijo(a) ha obtenido una calificación por debajo del umbral establecido.

Calificación obtenida: {nota_valor}
Umbral mínimo: {umbral.get('valor_minimo_numerico') or umbral.get('valor_minimo_literal')}

Por favor, contacte con el docente para más información.

Saludos cordiales,
Sistema de Gestión Académica
        """.strip()
