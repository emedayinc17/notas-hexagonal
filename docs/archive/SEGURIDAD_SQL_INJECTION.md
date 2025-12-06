# 🔒 ANÁLISIS DE SEGURIDAD: SQL INJECTION

## ✅ ESTADO ACTUAL: PROTEGIDO

### Resumen Ejecutivo:
Todos los servicios están **PROTEGIDOS contra SQL Injection** porque utilizan **SQLAlchemy ORM** con consultas parametrizadas.

---

## 1. 🛡️ PROTECCIONES IMPLEMENTADAS

### A. **SQLAlchemy ORM (Consultas Parametrizadas)**

Todos los repositorios usan el ORM de SQLAlchemy, que **automáticamente** previene SQL Injection:

```python
# ✅ SEGURO - SQLAlchemy ORM
def find_by_id(self, alumno_id: str) -> Optional[Alumno]:
    model = self.session.query(AlumnoModel).filter(
        AlumnoModel.id == alumno_id,  # ← Parametrizado automáticamente
        AlumnoModel.is_deleted == False
    ).first()
    return alumno_model_to_domain(model) if model else None
```

**Por qué es seguro:**
- SQLAlchemy convierte esto a una consulta parametrizada
- El valor de `alumno_id` se pasa como parámetro, NO se concatena en el SQL
- Ejemplo de SQL generado: `SELECT * FROM alumnos WHERE id = ? AND is_deleted = 0`

### B. **Sin SQL Directo (text())**

✅ **Verificado**: No se encontró ningún uso de `text()` de SQLAlchemy en todo el proyecto
✅ **Verificado**: No se encontró ningún `.execute()` con SQL crudo

---

## 2. 🔍 ENDPOINTS ANALIZADOS

### Personas Service (`/v1/alumnos`):

```python
@router.get("/alumnos")
async def list_alumnos(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    repo = SqlAlchemyAlumnoRepository(db)
    alumnos = repo.find_all(offset=offset, limit=limit)  # ← Usa ORM
    # ...
```

**Análisis**:
- ✅ No acepta parámetro `search` (el endpoint probado no existe)
- ✅ `offset` y `limit` son validados por Pydantic (`ge=0`, `le=100`)
- ✅ Usa ORM para consultas

### Todos los Repositorios:

| Servicio | Repositorio | Método de Consulta | Estado |
|----------|-------------|-------------------|--------|
| Personas | AlumnoRepository | SQLAlchemy ORM | ✅ Seguro |
| Personas | PadreRepository | SQLAlchemy ORM | ✅ Seguro |
| Personas | RelacionRepository | SQLAlchemy ORM | ✅ Seguro |
| Personas | MatriculaRepository | SQLAlchemy ORM | ✅ Seguro |
| Académico | GradoRepository | SQLAlchemy ORM | ✅ Seguro |
| Académico | CursoRepository | SQLAlchemy ORM | ✅ Seguro |
| Académico | SeccionRepository | SQLAlchemy ORM | ✅ Seguro |
| Académico | PeriodoRepository | SQLAlchemy ORM | ✅ Seguro |
| Académico | ClaseRepository | SQLAlchemy ORM | ✅ Seguro |
| IAM | UsuarioRepository | SQLAlchemy ORM | ✅ Seguro |
| Notas | NotaRepository | SQLAlchemy ORM | ✅ Seguro |

---

## 3. 🧪 PRUEBAS DE PENETRACIÓN

### Prueba 1: SQL Injection en Query Parameter

**Intento**:
```bash
curl "http://127.0.0.1:8003/v1/alumnos?search='; DROP TABLE alumnos; --"
```

**Resultado Esperado**:
- ❌ El endpoint `/v1/alumnos` NO acepta parámetro `search`
- ✅ Si existiera, SQLAlchemy lo parametrizaría automáticamente

### Prueba 2: SQL Injection en Path Parameter

**Intento**:
```bash
curl "http://127.0.0.1:8003/v1/alumnos/'; DROP TABLE alumnos; --"
```

**Resultado**:
```python
# El código hace:
alumno_id = "'; DROP TABLE alumnos; --"
model = self.session.query(AlumnoModel).filter(
    AlumnoModel.id == alumno_id  # ← Tratado como STRING, no como SQL
).first()
```

**SQL Generado** (seguro):
```sql
SELECT * FROM alumnos WHERE id = ?
-- Parámetro: "'; DROP TABLE alumnos; --"
```

**Resultado**: ✅ No encuentra ningún alumno con ese ID (string literal), no ejecuta DROP

### Prueba 3: SQL Injection en Body (JSON)

**Intento**:
```json
{
  "nombres": "'; DROP TABLE alumnos; --",
  "apellido_paterno": "Test"
}
```

**Resultado**:
```python
# El código hace:
model = AlumnoModel(
    nombres="'; DROP TABLE alumnos; --"  # ← Tratado como STRING
)
self.session.add(model)
```

**SQL Generado** (seguro):
```sql
INSERT INTO alumnos (nombres, ...) VALUES (?, ...)
-- Parámetro: "'; DROP TABLE alumnos; --"
```

**Resultado**: ✅ Se inserta como texto literal, no se ejecuta como SQL

---

## 4. ⚠️ RECOMENDACIONES ADICIONALES

Aunque el sistema está protegido, aquí hay mejoras adicionales:

### A. **Validación de Entrada (Input Validation)**

Agregar validaciones en los modelos Pydantic:

```python
from pydantic import BaseModel, validator, constr
import re

class CreateAlumnoRequest(BaseModel):
    codigo_alumno: constr(min_length=1, max_length=20, regex=r'^[A-Z0-9]+$')
    nombres: constr(min_length=1, max_length=100)
    dni: Optional[constr(regex=r'^\d{8}$')] = None
    
    @validator('nombres', 'apellido_paterno', 'apellido_materno')
    def validate_names(cls, v):
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', v):
            raise ValueError('Solo se permiten letras y espacios')
        return v
```

### B. **Rate Limiting**

Implementar límite de peticiones para prevenir ataques de fuerza bruta:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("/alumnos")
@limiter.limit("100/minute")  # ← Máximo 100 peticiones por minuto
async def list_alumnos(...):
    # ...
```

### C. **Logging de Intentos Sospechosos**

Detectar y registrar intentos de SQL Injection:

```python
import logging

SQLI_PATTERNS = [
    r"(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b)",
    r"(--|#|/\*|\*/)",
    r"(\bUNION\b.*\bSELECT\b)",
    r"(\bOR\b.*=.*)",
]

def detect_sqli_attempt(value: str) -> bool:
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            return True
    return False

# En el endpoint:
if detect_sqli_attempt(search_param):
    logging.warning(f"SQL Injection attempt detected: {search_param}")
    raise HTTPException(status_code=400, detail="Invalid input")
```

### D. **Sanitización de Salida**

Aunque no previene SQLi, previene XSS en el frontend:

```python
import html

def sanitize_output(data: dict) -> dict:
    """Escapa HTML en todos los strings"""
    for key, value in data.items():
        if isinstance(value, str):
            data[key] = html.escape(value)
    return data
```

---

## 5. 📋 CHECKLIST DE SEGURIDAD

### SQL Injection:
- [x] Usar ORM (SQLAlchemy) en lugar de SQL crudo
- [x] No usar `text()` de SQLAlchemy
- [x] No concatenar strings para formar SQL
- [x] Validar tipos de datos con Pydantic
- [ ] **PENDIENTE**: Agregar validaciones de formato (regex)
- [ ] **PENDIENTE**: Implementar rate limiting
- [ ] **PENDIENTE**: Logging de intentos sospechosos

### Otras Vulnerabilidades:
- [x] Autenticación JWT implementada
- [x] Autorización por roles (ADMIN, DOCENTE, PADRE)
- [ ] **PENDIENTE**: HTTPS en producción
- [ ] **PENDIENTE**: CORS configurado correctamente
- [ ] **PENDIENTE**: Headers de seguridad (CSP, X-Frame-Options, etc.)

---

## 6. 🔧 IMPLEMENTACIÓN DE MEJORAS

### Paso 1: Agregar Validaciones Estrictas

Crear archivo `services/shared/validators.py`:

```python
import re
from pydantic import validator

class SecureStringMixin:
    """Mixin para validar strings contra inyecciones"""
    
    @classmethod
    def validate_secure_string(cls, v: str, field_name: str) -> str:
        if not v:
            return v
            
        # Detectar patrones sospechosos
        dangerous_patterns = [
            r"(\bDROP\b|\bDELETE\b|\bTRUNCATE\b)",
            r"(--|#|/\*|\*/|;)",
            r"(\bUNION\b.*\bSELECT\b)",
            r"(\bOR\b\s+\d+\s*=\s*\d+)",
            r"(\bAND\b\s+\d+\s*=\s*\d+)",
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError(f"{field_name} contains suspicious content")
        
        return v
```

### Paso 2: Aplicar en Modelos Pydantic

```python
class CreateAlumnoRequest(BaseModel, SecureStringMixin):
    nombres: str
    apellido_paterno: str
    
    @validator('nombres', 'apellido_paterno', 'apellido_materno')
    def validate_names(cls, v, field):
        return cls.validate_secure_string(v, field.name)
```

### Paso 3: Implementar Rate Limiting

```bash
pip install slowapi
```

```python
# En main.py de cada servicio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# En endpoints críticos
@router.post("/alumnos")
@limiter.limit("10/minute")  # Máximo 10 creaciones por minuto
async def create_alumno(...):
    # ...
```

---

## 7. 🎯 CONCLUSIÓN

### Estado Actual:
✅ **El sistema está PROTEGIDO contra SQL Injection** gracias al uso correcto de SQLAlchemy ORM

### Nivel de Seguridad:
- **SQL Injection**: 🟢 PROTEGIDO (ORM parametrizado)
- **Input Validation**: 🟡 BÁSICO (solo tipos de Pydantic)
- **Rate Limiting**: 🔴 NO IMPLEMENTADO
- **Logging de Seguridad**: 🔴 NO IMPLEMENTADO

### Próximos Pasos:
1. ✅ **Inmediato**: Confirmar que NO hay endpoints con parámetro `search` vulnerable
2. 🟡 **Corto Plazo**: Implementar validaciones estrictas de entrada
3. 🟡 **Corto Plazo**: Agregar rate limiting
4. 🟢 **Mediano Plazo**: Implementar logging de seguridad
5. 🟢 **Largo Plazo**: Auditoría de seguridad completa

---

## 8. 📞 RESPUESTA AL REPORTE

**Endpoint Reportado**: `http://127.0.0.1:8003/v1/alumnos?search='; DROP TABLE alumnos; --`

**Análisis**:
1. ✅ El endpoint `/v1/alumnos` NO acepta parámetro `search`
2. ✅ Si se agregara, SQLAlchemy lo parametrizaría automáticamente
3. ✅ No hay riesgo de SQL Injection

**Recomendación**:
- Si planeas agregar búsqueda, hazlo con ORM:
  ```python
  # ✅ SEGURO
  query = session.query(AlumnoModel).filter(
      AlumnoModel.nombres.ilike(f"%{search}%")  # ← Parametrizado
  )
  ```
  
- **NUNCA** hagas esto:
  ```python
  # ❌ VULNERABLE
  query = f"SELECT * FROM alumnos WHERE nombres LIKE '%{search}%'"
  session.execute(text(query))
  ```

**Estado**: ✅ **SISTEMA SEGURO** - No se requiere acción inmediata
