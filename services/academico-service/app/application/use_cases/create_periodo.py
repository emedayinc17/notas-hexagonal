from shared.common import generate_uuid, AlreadyExistsException
from app.domain import Periodo, PeriodoTipo, PeriodoRepository, PeriodoTipoRepository

class CreatePeriodoTipoUseCase:
    def __init__(self, repository: PeriodoTipoRepository):
        self.repository = repository
        
    def execute(self, nombre: str, num_periodos: int, descripcion: str = None) -> PeriodoTipo:
        nuevo_tipo = PeriodoTipo(
            id=generate_uuid(),
            nombre=nombre,
            num_periodos=num_periodos,
            descripcion=descripcion,
            status="ACTIVO"
        )
        return self.repository.create(nuevo_tipo)

class CreatePeriodoUseCase:
    def __init__(self, periodo_repository: PeriodoRepository, tipo_repository: PeriodoTipoRepository):
        self.periodo_repository = periodo_repository
        self.tipo_repository = tipo_repository
        
    def execute(self, año_escolar: int, tipo_id: str, numero: int, nombre: str, fecha_inicio, fecha_fin) -> Periodo:
        # Validar tipo
        tipo = self.tipo_repository.find_by_id(tipo_id)
        if not tipo:
            raise Exception(f"Tipo periodo {tipo_id} no encontrado")
            
        nuevo_periodo = Periodo(
            id=generate_uuid(),
            año_escolar=año_escolar,
            tipo_id=tipo_id,
            numero=numero,
            nombre=nombre,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            status="ACTIVO"
        )
        return self.periodo_repository.create(nuevo_periodo)
