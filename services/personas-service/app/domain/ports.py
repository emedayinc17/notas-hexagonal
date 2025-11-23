# Personas Service - Domain Ports
from abc import ABC, abstractmethod
from typing import Optional, List
from .models import Alumno, Padre, RelacionPadreAlumno, MatriculaClase


class AlumnoRepository(ABC):
    @abstractmethod
    def create(self, alumno: Alumno) -> Alumno:
        pass
    
    @abstractmethod
    def find_by_id(self, alumno_id: str) -> Optional[Alumno]:
        pass
    
    @abstractmethod
    def find_by_codigo(self, codigo: str) -> Optional[Alumno]:
        pass
    
    @abstractmethod
    def find_all(self, offset: int = 0, limit: int = 20) -> List[Alumno]:
        pass


class PadreRepository(ABC):
    @abstractmethod
    def create(self, padre: Padre) -> Padre:
        pass
    
    @abstractmethod
    def find_by_id(self, padre_id: str) -> Optional[Padre]:
        pass
    
    @abstractmethod
    def find_all(self, offset: int = 0, limit: int = 20) -> List[Padre]:
        pass


class RelacionPadreAlumnoRepository(ABC):
    @abstractmethod
    def create(self, relacion: RelacionPadreAlumno) -> RelacionPadreAlumno:
        pass
    
    @abstractmethod
    def find_by_padre(self, padre_id: str) -> List[RelacionPadreAlumno]:
        pass
    
    @abstractmethod
    def find_by_alumno(self, alumno_id: str) -> List[RelacionPadreAlumno]:
        pass


class MatriculaClaseRepository(ABC):
    @abstractmethod
    def create(self, matricula: MatriculaClase) -> MatriculaClase:
        pass
    
    @abstractmethod
    def find_by_id(self, matricula_id: str) -> Optional[MatriculaClase]:
        pass
    
    @abstractmethod
    def find_by_clase(self, clase_id: str) -> List[MatriculaClase]:
        pass
    
    @abstractmethod
    def find_by_alumno(self, alumno_id: str) -> List[MatriculaClase]:
        pass
