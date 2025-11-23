# Notas Service - Domain Ports
from abc import ABC, abstractmethod
from typing import Optional, List
from .models import Nota, TipoEvaluacion, AlertaNotificacion, OutboxNotificacion


class NotaRepository(ABC):
    @abstractmethod
    def create(self, nota: Nota) -> Nota:
        pass
    
    @abstractmethod
    def find_by_id(self, nota_id: str) -> Optional[Nota]:
        pass
    
    @abstractmethod
    def find_by_alumno(self, alumno_id: str) -> List[Nota]:
        pass
    
    @abstractmethod
    def find_by_clase(self, clase_id: str) -> List[Nota]:
        pass


class TipoEvaluacionRepository(ABC):
    @abstractmethod
    def find_by_id(self, tipo_id: str) -> Optional[TipoEvaluacion]:
        pass
    
    @abstractmethod
    def find_all(self) -> List[TipoEvaluacion]:
        pass


class AlertaRepository(ABC):
    @abstractmethod
    def create(self, alerta: AlertaNotificacion) -> AlertaNotificacion:
        pass
    
    @abstractmethod
    def find_by_padre(self, padre_id: str) -> List[AlertaNotificacion]:
        pass


class OutboxRepository(ABC):
    @abstractmethod
    def create(self, outbox: OutboxNotificacion) -> OutboxNotificacion:
        pass
    
    @abstractmethod
    def find_pendientes(self, limit: int = 10) -> List[OutboxNotificacion]:
        pass
