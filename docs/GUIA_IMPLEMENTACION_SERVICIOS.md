# Guía de Implementación - Servicios Restantes

Este documento proporciona la plantilla y guía para implementar los 3 servicios restantes (Académico, Personas y Notas) siguiendo exactamente el mismo patrón que IAM Service.

## 🏗️ PATRÓN ARQUITECTÓNICO A SEGUIR

Todos los servicios deben seguir esta estructura idéntica:

###```
{servicio}-service/
├── app/
│   ├── __init__.py
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── models.py           # Entidades (dataclasses)
│   │   ├── ports.py            # Interfaces (ABC)
│   │   └── exceptions.py       # Excepciones de dominio
│   ├── application/
│   │   ├── __init__.py
│   │   └── use_cases/
│   │       ├── __init__.py
│   │       ├── {use_case_1}.py
│   │       ├── {use_case_2}.py
│   │       └── ...
│   ├── infrastructure/
│   │   ├── __init__.py
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── models.py       # SQLAlchemy models
│   │   │   └── repositories.py # Implementación de ports
│   │   ├── http/
│   │   │   ├── __init__.py
│   │   │   ├── router_public.py
│   │   │   ├── router_admin.py
│   │   │   └── dependencies.py
│   │   └── clients/            # HTTP clients (opcional)
│   │       └── __init__.py
│   └── main.py
├── requirements.txt
└── .env.example
```

---

## 2. ACADÉMICO SERVICE

### 2.1. Entidades de Dominio (domain/models.py)

```python
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional
from enum import Enum

class GradoNivel(str, Enum):
    INICIAL = "INICIAL"
    PRIMARIA = "PRIMARIA"
    SECUNDARIA = "SECUNDARIA"

@dataclass
class Grado:
    id: str
    nombre: str
    nivel: GradoNivel
    orden: int
    descripcion: Optional[str] = None
    status: str = "ACTIVO"
    # ... campos de auditoría

@dataclass
class Seccion:
    id: str
    grado_id: str
    nombre: str
    año_escolar: int
    capacidad_maxima: Optional[int] = None
    status: str = "ACTIVO"
    # ...

@dataclass
class Curso:
    id: str
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    horas_semanales: Optional[int] = None
    status: str = "ACTIVO"
    # ...

@dataclass
class Clase:
    id: str
    curso_id: str
    seccion_id: str
    periodo_id: str
    docente_user_id: str
    status: str = "ACTIVA"
    # ...
    # Relaciones opcionales
    curso: Optional[Curso] = None
    seccion: Optional[Seccion] = None

@dataclass
class EscalaCalificacion:
    id: str
    nombre: str
    tipo: str  # NUMERICA / LITERAL
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    status: str = "ACTIVO"
    # ...

@dataclass
class UmbralAlerta:
    id: str
    grado_id: Optional[str]
    curso_id: Optional[str]
    escala_id: str
    valor_minimo_numerico: Optional[float]
    valor_minimo_literal: Optional[str]
    activo: bool = True
    # ...
```

### 2.2. Ports (domain/ports.py)

```python
from abc import ABC, abstractmethod
from typing import Optional, List
from .models import Grado, Seccion, Curso, Clase, EscalaCalificacion, UmbralAlerta

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

class UmbralAlertaRepository(ABC):
    @abstractmethod
    def create(self, umbral: UmbralAlerta) -> UmbralAlerta:
        pass
    
    @abstractmethod
    def find_by_escala(self, escala_id: str, curso_id: Optional[str] = None, grado_id: Optional[str] = None) -> Optional[UmbralAlerta]:
        pass
```

### 2.3. Ejemplos de Use Cases

**CreateGradoUseCase**:
```python
from shared.common import generate_uuid, ValidationException, AlreadyExistsException
from app.domain import Grado, GradoRepository, GradoNivel

class CreateGradoUseCase:
    def __init__(self, grado_repository: GradoRepository):
        self.grado_repository = grado_repository
    
    def execute(self, nombre: str, nivel: str, orden: int, descripcion: str = None) -> Grado:
        # Validar nivel
        if nivel not in [e.value for e in GradoNivel]:
            raise ValidationException(f"Nivel inválido: {nivel}")
        
        # Crear grado
        nuevo_grado = Grado(
            id=generate_uuid(),
            nombre=nombre,
            nivel=GradoNivel(nivel),
            orden=orden,
            descripcion=descripcion,
            status="ACTIVO",
        )
        
        return self.grado_repository.create(nuevo_grado)
```

**CreateClaseUseCase**:
```python
from shared.common import generate_uuid, ValidationException, NotFoundException
from app.domain import Clase, ClaseRepository, CursoRepository, SeccionRepository

class CreateClaseUseCase:
    def __init__(
        self,
        clase_repository: ClaseRepository,
        curso_repository: CursoRepository,
        seccion_repository: SeccionRepository,
    ):
        self.clase_repository = clase_repository
        self.curso_repository = curso_repository
        self.seccion_repository = seccion_repository
    
    def execute(
        self,
        curso_id: str,
        seccion_id: str,
        periodo_id: str,
        docente_user_id: str,
    ) -> Clase:
        # Validar que curso existe
        curso = self.curso_repository.find_by_id(curso_id)
        if not curso:
            raise NotFoundException(f"Curso {curso_id} no encontrado")
        
        # Validar que sección existe
        seccion = self.seccion_repository.find_by_id(seccion_id)
        if not seccion:
            raise NotFoundException(f"Sección {seccion_id} no encontrada")
        
        # Crear clase
        nueva_clase = Clase(
            id=generate_uuid(),
            curso_id=curso_id,
            seccion_id=seccion_id,
            periodo_id=periodo_id,
            docente_user_id=docente_user_id,
            status="ACTIVA",
        )
        
        return self.clase_repository.create(nueva_clase)
```

### 2.4. Configuración main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.common import get_settings, create_db_engine, create_session_factory
from app.infrastructure.http import dependencies
from app.infrastructure.http.router_admin import router as admin_router

settings = get_settings()
settings.APP_NAME = "Académico Service"
settings.DB_NAME = "sga_academico"

engine = create_db_engine(settings.DATABASE_URL, echo=settings.DEBUG)
session_factory = create_session_factory(engine)
dependencies.set_session_factory(session_factory)

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)

@app.get("/")
async def root():
    return {"service": settings.APP_NAME, "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
```

---

## 3. PERSONAS SERVICE

### 3.1. Entidades de Dominio

```python
@dataclass
class Alumno:
    id: str
    codigo_alumno: str
    dni: Optional[str]
    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str]
    fecha_nacimiento: date
    genero: str  # M, F, OTRO
    email: Optional[str]
    status: str = "ACTIVO"
    # ...

@dataclass
class Padre:
    id: str
    dni: Optional[str]
    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str]
    email: str
    celular: Optional[str]
    status: str = "ACTIVO"
    # ...

@dataclass
class RelacionPadreAlumno:
    id: str
    padre_id: str
    alumno_id: str
    tipo_relacion: str  # PADRE, MADRE, TUTOR, APODERADO
    es_contacto_principal: bool = False
    # ...

@dataclass
class MatriculaClase:
    id: str
    alumno_id: str
    clase_id: str
    fecha_matricula: date
    status: str = "ACTIVO"
    # ...
```

### 3.2. Use Cases Claves

- `CreateAlumnoUseCase`: Validar código único y DNI
- `CreatePadreUseCase`: Validar email único
- `LinkPadreAlumnoUseCase`: Validar que ambos existen, evitar duplicados
- `MatricularAlumnoClaseUseCase`: Validar alumno activo, clase válida
- `GetHijosPadreUseCase`: Resolver padre_id desde user_id (puede requerir join con IAM)

---

## 4. NOTAS SERVICE

### 4.1. Entidades de Dominio

```python
@dataclass
class Nota:
    id: str
    matricula_clase_id: str
    tipo_evaluacion_id: str
    periodo_id: str
    escala_id: str
    valor_literal: Optional[str]
    valor_numerico: Optional[float]
    peso: Optional[float]
    observaciones: Optional[str]
    fecha_registro: date
    registrado_por_user_id: str
    # ...

@dataclass
class AlertaNotificacion:
    id: str
    nota_id: str
    alumno_id: str
    padre_id: Optional[str]
    tipo_alerta: str  # NOTA_BAJA, PROMEDIO_BAJO, etc.
    mensaje: str
    leida: bool = False
    # ...

@dataclass
class OutboxNotificacion:
    id: str
    alerta_id: Optional[str]
    tipo: str  # EMAIL, SMS, PUSH
    destinatario: str
    asunto: Optional[str]
    mensaje: str
    estado: str = "PENDIENTE"  # PENDIENTE, PROCESANDO, ENVIADO, FALLIDO
    intentos: int = 0
    # ...
```

### 4.2. Use Case Crítico: RegistrarNotaUseCase

```python
from shared.common import generate_uuid, ValidationException, NotFoundException
from datetime import date as dt_date
from app.domain import (
    Nota,
    NotaRepository,
    AlertaNotificacion,
    AlertaRepository,
    OutboxNotificacion,
    OutboxRepository,
    # Necesitarás también UmbralAlertaRepository (cross-service)
)

class RegistrarNotaUseCase:
    def __init__(
        self,
        nota_repository: NotaRepository,
        alerta_repository: AlertaRepository,
        outbox_repository: OutboxRepository,
        umbral_repository: UmbralAlertaRepository,
        # Podría necesitar un client HTTP para obtener padres del alumno
    ):
        self.nota_repository = nota_repository
        self.alerta_repository = alerta_repository
        self.outbox_repository = outbox_repository
        self.umbral_repository = umbral_repository
    
    def execute(
        self,
        matricula_clase_id: str,
        tipo_evaluacion_id: str,
        periodo_id: str,
        escala_id: str,
        valor_literal: str = None,
        valor_numerico: float = None,
        peso: float = None,
        observaciones: str = None,
        registrado_por_user_id: str = None,
        current_user_rol: str = None,
    ) -> dict:
        # Validaciones
        if not valor_literal and not valor_numerico:
            raise ValidationException("Debe proporcionar valor_literal o valor_numerico")
        
        # TODO Si el usuario es DOCENTE, validar que la clase le pertenece
        
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
            fecha_registro=dt_date.today(),
            registrado_por_user_id=registrado_por_user_id,
        )
        
        nota_creada = self.nota_repository.create(nueva_nota)
        
        # Evaluar umbrales
        alerta_generada = False
        # TODO: Obtener curso_id y grado_id desde matricula/clase
        # umbral = self.umbral_repository.find_by_escala(escala_id, curso_id, grado_id)
        # if umbral and nota_por_debajo_del_umbral(nota_creada, umbral):
        #     alerta = crear_alerta(...)
        #     self.alerta_repository.create(alerta)
        #     # Obtener padres del alumno (HTTP call a personas-service)
        #     # Para cada padre, crear outbox
        #     outbox = OutboxNotificacion(...)
        #     self.outbox_repository.create(outbox)
        #     alerta_generada = True
        
        return {
            "nota": nota_creada,
            "alerta_generada": alerta_generada,
        }
```

---

## 5. COMUNICACIÓN ENTRE SERVICIOS

### 5.1. HTTP Clients

Cuando un servicio necesita información de otro, crea un client HTTP en `infrastructure/clients/`:

```python
# infrastructure/clients/personas_client.py
import httpx
from typing import List, Optional

class PersonasServiceClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    async def get_padres_by_alumno(self, alumno_id: str, token: str) -> List[dict]:
        """Obtiene los padres de un alumno"""
        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/v1/relaciones/alumno/{alumno_id}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
```

### 5.2. Validación de JWT Cross-Service

Todos los servicios (excepto IAM) deben validar el JWT usando la misma secret key:

```python
# En cada router que requiera auth:
from shared.common import extract_bearer_token, decode_jwt_token

token = extract_bearer_token(authorization)
payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
user_id = payload.get("user_id")
rol_nombre = payload.get("rol_nombre")

# Validar permisos según rol
if rol_nombre != "ADMIN":
    raise ForbiddenException("Solo ADMIN puede ejecutar esta acción")
```

---

## 6. REQUIREMENTS.TXT PARA TODOS LOS SERVICIOS

El mismo `requirements.txt` que IAM service, todos usan las mismas dependencias.

---

## 7. VARIABLES DE ENTORNO POR SERVICIO

### Académico Service (.env.example):
```
DB_NAME=sga_academico
DB_USER=app_academico
DB_PASSWORD=academico_pass_2025
APP_NAME=Académico Service
# ... resto igual
```

### Personas Service (.env.example):
```
DB_NAME=sga_personas
DB_USER=app_personas
DB_PASSWORD=personas_pass_2025
APP_NAME=Personas Service
# ... resto igual  
# Opcional: URLs de otros servicios
ACADEMICO_SERVICE_URL=http://localhost:8002
```

### Notas Service (.env.example):
```
DB_NAME=sga_notas
DB_USER=app_notas
DB_PASSWORD=notas_pass_2025
APP_NAME=Notas Service
# URLs de otros servicios
ACADEMICO_SERVICE_URL=http://localhost:8002
PERSONAS_SERVICE_URL=http://localhost:8003
```

---

## 8. CHECKLIST DE IMPLEMENTACIÓN POR SERVICIO

Para cada servicio (Académico, Personas, Notas):

### ✅ Domain Layer
- [ ] Crear `domain/models.py` con todas las entidades como dataclasses
- [ ] Crear `domain/ports.py` con todas las interfaces (ABC) de repositorios
- [ ] Crear `domain/exceptions.py` con excepciones específicas del dominio
- [ ] Crear `domain/__init__.py` exportando todo

### ✅ Application Layer
- [ ] Para cada caso de uso, crear un archivo en `application/use_cases/`
- [ ] Cada use case recibe ports en el constructor
- [ ] Implementar lógica de negocio en método `execute()`
- [ ] Lanzar excepciones de dominio cuando corresponda

### ✅ Infrastructure - Database
- [ ] Crear `infrastructure/db/models.py` con SQLAlchemy models
  - Usar `__table_args__ ={"schema": "sga_{servicio}"}`
- [ ] Crear `infrastructure/db/repositories.py` implementando los ports
  - Funciones helper: `{entity}_model_to_domain`
  - Clases: `SqlAlchemy{Entity}Repository`

### ✅ Infrastructure - HTTP
- [ ] Crear `infrastructure/http/router_admin.py` con endpoints ADMIN
- [ ] Crear `infrastructure/http/router_public.py` si hay endpoints públicos
- [ ] Crear `infrastructure/http/dependencies.py`:
  - `set_session_factory()` y `get_db()`
  - Factories para cada use case: `get_{use_case}_use_case()`
- [ ] Opcional: `infrastructure/clients/` para HTTP calls a otros servicios

### ✅ Main Application
- [ ] Crear `main.py`:
  - Configurar settings con DB_NAME correcto
  - Crear engine y session factory
  - Inyectar session_factory
  - Crear FastAPI app
  - Registrar routers
  - Definir puerto único (8002, 8003, 8004)

### ✅ Configuration
- [ ] Copiar `requirements.txt` de IAM service
- [ ] Crear `.env.example` con variables específicas del servicio
- [ ] Crear todos los `__init__.py` en cada paquete

---

## 9. EJEMPLO DE FLUJO COMPLETO: REGISTRAR NOTA

1. **Request HTTP** → `POST /v1/notas` (Notas Service, puerto 8004)
2. **Router** extrae JWT, obtiene `user_id` y `rol_nombre`
3. **Use Case** (`RegistrarNotaUseCase`):
   - Valida permisos (DOCENTE solo sus clases)
   - Crea la nota en BD
   - Consulta umbral de alerta (lectura cross-schema a `sga_academico.umbrales_alerta`)
   - Si nota < umbral:
     - Crea alerta en `sga_notas.alertas_notificacion`
     - **HTTP Call** a Personas Service para obtener padres del alumno
     - Para cada padre, crea registro en `sga_notas.outbox_notificaciones`
4. **Worker externo** (cron job):
   - Lee `outbox_notificaciones` con estado PENDIENTE
   - Envía emails/SMS
   - Actualiza estado a ENVIADO

---

## 10. CONSIDERACIONES FINALES

### 🔥 Puntos Críticos

1. **Mismo JWT_SECRET_KEY** en todos los servicios para validación
2. **Cross-schema queries**: Notas Service puede leer (solo SELECT) de `sga_academico`
3. **Transacciones**: Cada servicio maneja sus propias transacciones
4. **Idempotencia**: Validar duplicados en creates (unique constraints)
5. **Paginación**: Siempre aplicar offset/limit

### 🚀 Deployment

```bash
# Iniciar todos los servicios
cd services/iam-service && uvicorn app.main:app --reload --port 8001 &
cd services/academico-service && uvicorn app.main:app --reload --port 8002 &
cd services/personas-service && uvicorn app.main:app --reload --port 8003 &
cd services/notas-service && uvicorn app.main:app --reload --port 8004 &
```

### 📊 Testing

1. Crear base de datos: `mysql -u root -p < database/bootstrap.sql`
2. Login como admin: `POST localhost:8001/v1/auth/login`
3. Usar el JWT token en todos los demás requests
4. Crear estructura académica (Académico Service)
5. Crear alumnos y padres (Personas Service)
6. Matricular alumnos (Personas Service)
7. Registrar notas (Notas Service)
8. Verificar alertas generadas

---

## 🎯 RESUMEN

Cada servicio sigue **exactamente** el mismo patrón que IAM Service:
- **Domain**: Entidades puras + Ports (interfaces) + Excepciones
- **Application**: 1 use case = 1 archivo, recibe ports
- **Infrastructure**: SQLAlchemy models + Repositorios + Routers + Dependencies
- **Main**: FastAPI app con DI

**El código de IAM Service es tu plantilla completa**. Replica la estructura cambiando solo:
- Nombres de entidades
- Lógica de negocio específica
- Esquema de BD (`sga_iam` → `sga_academico`, etc.)
- Puerto de escucha (8001 → 8002, etc.)

Esta arquitectura garantiza:
- ✅ Separación de responsabilidades
- ✅ Testabilidad (domain sin dependencias)
- ✅ Escalabilidad (servicios independientes)
- ✅ Mantenibilidad (código limpio y organizado)
