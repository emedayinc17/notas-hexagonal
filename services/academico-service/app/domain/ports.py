# Académico Service - Domain Ports
from abc import ABC, abstractmethod
from typing import Optional, List
from .models import Grado, Seccion, Curso, Clase, Periodo, PeriodoTipo, EscalaCalificacion, UmbralAlerta


class GradoRepository(ABC):
    @abstractmethod
    def create(self, grado: Grado) -> Grado:
        pass
    
    @abstractmethod
    def find_by_id(self, grado_id: str) -> Optional[Grado]:
        pass
    
    @abstractmethod
    def find_all(self, nivel: Optional[str] = None, offset: int = 0, limit: int = 20) -> List[Grado]:
        pass


class SeccionRepository(ABC):
    @abstractmethod
    def create(self, seccion: Seccion) -> Seccion:
        pass
    
    @abstractmethod
    def find_by_id(self, seccion_id: str) -> Optional[Seccion]:
        pass
    
    @abstractmethod
    def find_all(self, grado_id: Optional[str] = None, año: Optional[int] = None, offset: int = 0, limit: int = 20) -> List[Seccion]:
        pass


class CursoRepository(ABC):
    @abstractmethod
    def create(self, curso: Curso) -> Curso:
        pass
    
    @abstractmethod
    def find_by_id(self, curso_id: str) -> Optional[Curso]:
        pass
    
    @abstractmethod
    def find_by_codigo(self, codigo: str) -> Optional[Curso]:
        pass
    
    @abstractmethod
    def find_all(self, offset: int = 0, limit: int = 20) -> List[Curso]:
        pass


class PeriodoRepository(ABC):
    @abstractmethod
    def create(self, periodo: Periodo) -> Periodo:
        pass
    
    @abstractmethod
    def find_by_id(self, periodo_id: str) -> Optional[Periodo]:
        pass
    
    @abstractmethod
    def find_all(self, año: Optional[int] = None, offset: int = 0, limit: int = 20) -> List[Periodo]:
        pass


class PeriodoTipoRepository(ABC):
    @abstractmethod
    def create(self, tipo: 'PeriodoTipo') -> 'PeriodoTipo':
        pass
    
    @abstractmethod
    def find_by_id(self, tipo_id: str) -> Optional['PeriodoTipo']:
        pass
    
    @abstractmethod
    def find_all(self, offset: int = 0, limit: int = 20) -> List['PeriodoTipo']:
        pass


class ClaseRepository(ABC):
    @abstractmethod
    def create(self, clase: Clase) -> Clase:
        pass
    
    @abstractmethod
    def find_by_id(self, clase_id: str) -> Optional[Clase]:
        pass
    
    @abstractmethod
    def find_by_docente(self, docente_user_id: str, periodo_id: Optional[str] = None) -> List[Clase]:
        pass
    
    @abstractmethod
    def find_all(self, offset: int = 0, limit: int = 20) -> List[Clase]:
        pass


class EscalaCalificacionRepository(ABC):
    @abstractmethod
    def create(self, escala: EscalaCalificacion) -> EscalaCalificacion:
        pass
    
    @abstractmethod
    def find_by_id(self, escala_id: str) -> Optional[EscalaCalificacion]:
        pass
    
    @abstractmethod
    def find_all(self, offset: int = 0, limit: int = 20) -> List[EscalaCalificacion]:
        pass


class UmbralAlertaRepository(ABC):
    @abstractmethod
    def create(self, umbral: UmbralAlerta) -> UmbralAlerta:
        pass
    
    @abstractmethod
    def find_by_id(self, umbral_id: str) -> Optional[UmbralAlerta]:
        pass
    
    @abstractmethod
    def find_by_escala(self, escala_id: str, curso_id: Optional[str] = None, grado_id: Optional[str] = None) -> Optional[UmbralAlerta]:
        pass
    
    @abstractmethod
    def find_all(self, activo: Optional[bool] = None, offset: int = 0, limit: int = 20) -> List[UmbralAlerta]:
        pass
