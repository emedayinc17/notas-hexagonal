# Casos de Uso y Endpoints - Sistema de Gestión de Notas

## 📋 CASOS DE USO POR SERVICIO

---

## 1. IAM SERVICE

### Casos de Uso

#### `RegisterUserUseCase`
**Parámetros:**
- username: str
- email: str
- password: str
- rol_nombre: str ('ADMIN', 'DOCENTE', 'PADRE')
- nombres: str (opcional)
- apellidos: str (opcional)

**Puertos:**
- `UserRepository`: Para crear usuario
- `RoleRepository`: Para obtener rol por nombre

**Validaciones:**
- Email único
- Username único
- Password cumple requisitos mínimos (8+ caracteres, mayúscula, número)
- Rol existe

**Retorna:** Usuario creado (sin password_hash)

---

#### `LoginUseCase`
**Parámetros:**
- email: str
- password: str

**Puertos:**
- `UserRepository`: Para obtener usuario por email
- `SessionRepository`: Para registrar sesión

**Validaciones:**
- Usuario existe
- Usuario está activo
- Password es correcto

**Retorna:** JWT token con payload {user_id, username, rol_nombre, exp}

---

#### `GetCurrentUserUseCase`
**Parámetros:**
- user_id: str (del JWT)

**Puertos:**
- `UserRepository`: Para obtener usuario con rol

**Retorna:** Información completa del usuario con rol

---

#### `ListUsersUseCase` (ADMIN)
**Parámetros:**
- rol_nombre: str (opcional, filtro)
- status: str (opcional, filtro)
- offset: int
- limit: int

**Puertos:**
- `UserRepository`: Para listar con paginación

**Validaciones:**
- Requiere rol ADMIN

**Retorna:** Lista paginada de usuarios

---

### Endpoints

| Método | Path | Descripción | Rol | Use Case |
|--------|------|-------------|-----|----------|
| POST | `/v1/auth/register` | Registrar nuevo usuario | Público | RegisterUserUseCase |
| POST | `/v1/auth/login` | Login y obtener JWT | Público | LoginUseCase |
| GET | `/v1/users/me` | Info del usuario actual | Autenticado | GetCurrentUserUseCase |
| GET | `/v1/users` | Listar usuarios (admin) | ADMIN | ListUsersUseCase |
| PATCH | `/v1/users/{id}/status` | Cambiar status usuario | ADMIN | UpdateUserStatusUseCase |

---

## 2. ACADÉMICO SERVICE

### Casos de Uso

#### `CreateGradoUseCase` (ADMIN)
**Parámetros:**
- nombre: str
- nivel: str ('INICIAL', 'PRIMARIA', 'SECUNDARIA')
- orden: int
- descripcion: str (opcional)

**Puertos:**
- `GradoRepository`

**Validaciones:**
- Nivel válido
- Orden único para el nivel

**Retorna:** Grado creado

---

#### `CreateSeccionUseCase` (ADMIN)
**Parámetros:**
- grado_id: str
- nombre: str
- año_escolar: int
- capacidad_maxima: int (opcional)

**Puertos:**
- `SeccionRepository`
- `GradoRepository`

**Validaciones:**
- Grado existe
- Combinación grado+nombre+año única

**Retorna:** Sección creada

---

#### `CreateCursoUseCase` (ADMIN)
**Parámetros:**
- codigo: str
- nombre: str
- descripcion: str (opcional)
- horas_semanales: int (opcional)

**Puertos:**
- `CursoRepository`

**Validaciones:**
- Código único

**Retorna:** Curso creado

---

#### `CreateClaseUseCase` (ADMIN)
**Parámetros:**
- curso_id: str
- seccion_id: str
- periodo_id: str
- docente_user_id: str

**Puertos:**
- `ClaseRepository`
- `CursoRepository`
- `SeccionRepository`
- `PeriodoRepository`

**Validaciones:**
- Curso, sección y periodo existen
- Docente existe (podría validar con IAM service)
- Combinación curso+sección+periodo única

**Retorna:** Clase creada

---

#### `CreateEscalaCalificacionUseCase` (ADMIN)
**Parámetros:**
- nombre: str
- tipo: str ('NUMERICA', 'LITERAL')
- valor_minimo: Decimal (si numérica)
- valor_maximo: Decimal (si numérica)
- valores: List[ValorEscala] (si literal)

**Puertos:**
- `EscalaRepository`
- `ValorEscalaRepository`

**Validaciones:**
- Si numérica: valor_max > valor_min
- Si literal: valores no vacíos

**Retorna:** Escala con sus valores

---

#### `CreateUmbralAlertaUseCase` (ADMIN)
**Parámetros:**
- grado_id: str (opcional, None = global)
- curso_id: str (opcional, None = global)
- escala_id: str
- valor_minimo_numerico: Decimal (opcional)
- valor_minimo_literal: str (opcional)
- descripcion: str

**Puertos:**
- `UmbralAlertaRepository`
- `EscalaRepository`

**Validaciones:**
- Escala existe
- Valor mínimo corresponde con tipo de escala

**Retorna:** Umbral creado

---

#### `ListClasesDocenteUseCase` (DOCENTE)
**Parámetros:**
- docente_user_id: str (del JWT)
- periodo_id: str (opcional)
- año_escolar: int (opcional)
- offset: int
- limit: int

**Puertos:**
- `ClaseRepository`

**Retorna:** Lista de clases del docente con detalles (vista v_clases_detalle)

---

### Endpoints

| Método | Path | Descripción | Rol | Use Case |
|--------|------|-------------|-----|----------|
| GET/POST | `/v1/grados` | Listar/Crear grados | ADMIN | ListGradosUseCase / CreateGradoUseCase |
| GET/POST | `/v1/secciones` | Listar/Crear secciones | ADMIN | ListSeccionesUseCase / CreateSeccionUseCase |
| GET/POST | `/v1/cursos` | Listar/Crear cursos | ADMIN | ListCursosUseCase / CreateCursoUseCase |
| GET/POST | `/v1/clases` | Listar/Crear clases | ADMIN | ListClasesUseCase / CreateClaseUseCase |
| POST | `/v1/clases/{id}/assign-docente` | Asignar docente a clase | ADMIN | AssignDocenteToClaseUseCase |
| GET | `/v1/docente/clases` | Clases del docente actual | DOCENTE | ListClasesDocenteUseCase |
| GET/POST | `/v1/escalas` | Listar/Crear escalas | ADMIN | ListEscalasUseCase / CreateEscalaCalificacionUseCase |
| GET/POST | `/v1/umbrales` | Listar/Crear umbrales | ADMIN | ListUmbralesUseCase / CreateUmbralAlertaUseCase |
| GET/POST | `/v1/periodos` | Listar/Crear periodos | ADMIN | ListPeriodosUseCase / CreatePeriodoUseCase |

---

## 3. PERSONAS SERVICE

### Casos de Uso

#### `CreateAlumnoUseCase` (ADMIN)
**Parámetros:**
- codigo_alumno: str
- dni: str (opcional)
- nombres: str
- apellido_paterno: str
- apellido_materno: str (opcional)
- fecha_nacimiento: date
- genero: str ('M', 'F', 'OTRO')
- direccion: str (opcional)
- telefono: str (opcional)
- email: str (opcional)

**Puertos:**
- `AlumnoRepository`

**Validaciones:**
- Código alumno único
- DNI único (si se proporciona)
- Fecha nacimiento válida (no futuro)

**Retorna:** Alumno creado

---

#### `CreatePadreUseCase` (ADMIN)
**Parámetros:**
- dni: str (opcional)
- nombres: str
- apellido_paterno: str
- apellido_materno: str (opcional)
- telefono: str (opcional)
- celular: str (opcional)
- email: str
- direccion: str (opcional)
- ocupacion: str (opcional)

**Puertos:**
- `PadreRepository`

**Validaciones:**
- Email válido
- DNI único (si se proporciona)

**Retorna:** Padre creado

---

#### `LinkPadreAlumnoUseCase` (ADMIN)
**Parámetros:**
- padre_id: str
- alumno_id: str
- tipo_relacion: str ('PADRE', 'MADRE', 'TUTOR', 'APODERADO')
- es_contacto_principal: bool

**Puertos:**
- `RelacionPadreAlumnoRepository`
- `PadreRepository`
- `AlumnoRepository`

**Validaciones:**
- Padre existe
- Alumno existe
- Relación no duplicada

**Retorna:** Relación creada

---

#### `MatricularAlumnoClaseUseCase` (ADMIN)
**Parámetros:**
- alumno_id: str
- clase_id: str
- fecha_matricula: date

**Puertos:**
- `MatriculaClaseRepository`
- `AlumnoRepository`

**Validaciones:**
- Alumno existe y está activo
- Clase existe (verificar con académico service)
- Alumno no está ya matriculado en esa clase

**Retorna:** Matrícula creada

---

#### `GetAlumnosConPadresUseCase` (ADMIN, DOCENTE)
**Parámetros:**
- clase_id: str (opcional, filtro)
- offset: int
- limit: int

**Puertos:**
- `AlumnoRepository` (usa vista v_alumnos_con_padres)

**Retorna:** Lista de alumnos con sus padres

---

#### `GetHijosPadreUseCase` (PADRE)
**Parámetros:**
- padre_user_id: str (del JWT, debe resolverse a padre_id)

**Puertos:**
- `RelacionPadreAlumnoRepository`
- `PadreRepository`

**Validaciones:**
- Padre existe

**Retorna:** Lista de hijos del padre

---

### Endpoints

| Método | Path | Descripción | Rol | Use Case |
|--------|------|-------------|-----|----------|
| GET/POST | `/v1/alumnos` | Listar/Crear alumnos | ADMIN | ListAlumnosUseCase / CreateAlumnoUseCase |
| GET | `/v1/alumnos/{id}` | Detalle de alumno | ADMIN, DOCENTE | GetAlumnoUseCase |
| PATCH | `/v1/alumnos/{id}` | Actualizar alumno | ADMIN | UpdateAlumnoUseCase |
| GET/POST | `/v1/padres` | Listar/Crear padres | ADMIN | ListPadresUseCase / CreatePadreUseCase |
| GET | `/v1/padres/{id}` | Detalle de padre | ADMIN | GetPadreUseCase |
| POST | `/v1/relaciones` | Vincular padre-hijo | ADMIN | LinkPadreAlumnoUseCase |
| GET | `/v1/relaciones/padre/{id}` | Hijos de un padre | ADMIN, PADRE | GetHijosPadreUseCase |
| POST | `/v1/matriculas` | Matricular alumno a clase | ADMIN | MatricularAlumnoClaseUseCase |
| GET | `/v1/matriculas/clase/{clase_id}` | Alumnos de una clase | ADMIN, DOCENTE | GetAlumnosClaseUseCase |
| GET | `/v1/alumnos-con-padres` | Vista alumnos con padres | ADMIN, DOCENTE | GetAlumnosConPadresUseCase |

---

## 4. NOTAS SERVICE

### Casos de Uso

#### `RegistrarNotaUseCase` (DOCENTE, ADMIN)
**Parámetros:**
- matricula_clase_id: str
- tipo_evaluacion_id: str
- periodo_id: str
- escala_id: str
- valor_literal: str (opcional)
- valor_numerico: Decimal (opcional)
- peso: Decimal (opcional)
- observaciones: str (opcional)
- registrado_por_user_id: str (del JWT)

**Puertos:**
- `NotaRepository`
- `MatriculaClaseRepository` (verificar que matrícula existe)
- `UmbralAlertaRepository` (para evaluar si dispara alerta)
- `AlertaRepository`
- `OutboxRepository`

**Validaciones:**
- Matrícula existe
- Tipo evaluación existe
- Periodo existe y está activo
- Escala existe
- Si DOCENTE: verificar que la clase pertenece al docente
- Al menos uno de valor_literal o valor_numerico debe estar presente

**Lógica:**
1. Crear la nota
2. Evaluar contra umbrales (específico del curso/grado o global)
3. Si nota por debajo del umbral:
   - Crear registro en alertas_notificacion
   - Obtener padres del alumno (consulta a personas service)
   - Para cada padre, crear registro en outbox_notificaciones

**Retorna:** Nota creada + indicador si se generó alerta

---

#### `GetNotasAlumnoUseCase` (DOCENTE, PADRE, ADMIN)
**Parámetros:**
- alumno_id: str
- curso_id: str (opcional)
- periodo_id: str (opcional)
- clase_id: str (opcional)

**Puertos:**
- `NotaRepository`

**Validaciones:**
- Si PADRE: verificar que el alumno es hijo del padre (consulta a personas service)
- Si DOCENTE: verificar que tiene acceso a esa clase

**Retorna:** Lista de notas del alumno con detalles

---

#### `GetNotasClaseUseCase` (DOCENTE, ADMIN)
**Parámetros:**
- clase_id: str
- periodo_id: str
- tipo_evaluacion_id: str (opcional)

**Puertos:**
- `NotaRepository`
- `MatriculaClaseRepository`

**Validaciones:**
- Si DOCENTE: verificar que la clase le pertenece

**Retorna:** Todas las notas de la clase agrupadas por alumno

---

#### `CalcularPromedioAlumnoUseCase`
**Parámetros:**
- matricula_clase_id: str
- periodo_id: str

**Puertos:**
- `NotaRepository`

**Lógica:**
- Obtener todas las notas del alumno en ese curso y periodo
- Aplicar pesos de cada tipo de evaluación
- Calcular promedio ponderado

**Retorna:** Promedio calculado

---

#### `GetAlertasPadreUseCase` (PADRE)
**Parámetros:**
- padre_user_id: str (del JWT)
- alumno_id: str (opcional)
- leida: bool (opcional, filtro)
- offset: int
- limit: int

**Puertos:**
- `AlertaRepository`
- `PadreRepository`

**Validaciones:**
- Padre existe
- Si alumno_id: verificar que es hijo del padre

**Retorna:** Lista de alertas del padre (de todos sus hijos o de uno específico)

---

#### `MarcarAlertaLeidaUseCase` (PADRE)
**Parámetros:**
- alerta_id: str
- padre_user_id: str (del JWT)

**Puertos:**
- `AlertaRepository`

**Validaciones:**
- Alerta pertenece al padre

**Retorna:** Alerta actualizada

---

#### `ProcessOutboxNotificationsUseCase` (Sistema/Worker)
**Parámetros:**
- limit: int (cantidad de registros a procesar)

**Puertos:**
- `OutboxRepository`

**Lógica:**
- Obtener registros PENDIENTE o FALLIDO con intentos < max
- Marcar como PROCESANDO
- Simular envío (en implementación real, llamaría a servicio de email/SMS)
- Actualizar estado a ENVIADO o FALLIDO

**Retorna:** Cantidad de notificaciones procesadas

---

### Endpoints

| Método | Path | Descripción | Rol | Use Case |
|--------|------|-------------|-----|----------|
| POST | `/v1/notas` | Registrar nota | DOCENTE, ADMIN | RegistrarNotaUseCase |
| GET | `/v1/notas/alumno/{id}` | Historial de notas | DOCENTE, PADRE, ADMIN | GetNotasAlumnoUseCase |
| GET | `/v1/notas/clase/{id}` | Notas de una clase | DOCENTE, ADMIN | GetNotasClaseUseCase |
| GET | `/v1/notas/matricula/{id}/promedio` | Promedio de alumno en curso | DOCENTE, PADRE, ADMIN | CalcularPromedioAlumnoUseCase |
| GET | `/v1/alertas` | Alertas del padre actual | PADRE | GetAlertasPadreUseCase |
| PATCH | `/v1/alertas/{id}/marcar-leida` | Marcar alerta como leída | PADRE | MarcarAlertaLeidaUseCase |
| GET | `/v1/alertas/alumno/{id}` | Alertas de un alumno | ADMIN | GetAlertasAlumnoUseCase |
| GET/POST | `/v1/tipos-evaluacion` | Listar/Crear tipos | ADMIN | ListTiposEvaluacionUseCase / CreateTipoEvaluacionUseCase |
| POST | `/v1/outbox/process` | Procesar outbox (worker) | Sistema | ProcessOutboxNotificationsUseCase |

---

## 📊 RESUMEN DE ENDPOINTS POR ROL

### ADMIN
- **Total**: ~30 endpoints
- Acceso completo a todos los servicios
- CRUD de toda la estructura académica, personas y configuración

### DOCENTE
- **Total**: ~8 endpoints
- Ver sus clases asignadas
- Ver alumnos de sus clases
- Registrar notas
- Ver historial de notas de sus alumnos

### PADRE
- **Total**: ~5 endpoints
- Ver información de sus hijos
- Ver notas de sus hijos
- Ver y gestionar alertas de notas bajas

---

## 🔄 FLUJO TÍPICO DE NOTIFICACIONES

1. **Docente registra nota** → `POST /v1/notas`
2. **Sistema evalúa umbral** → Si nota < umbral:
3. **Crea alerta** → Registro en `alertas_notificacion`
4. **Crea outbox** → Registro en `outbox_notificaciones` (PENDIENTE)
5. **Worker procesa outbox** → `POST /v1/outbox/process` (cron job)
6. **Envía notificación** → Email/SMS al padre
7. **Actualiza estado** → outbox a ENVIADO
8. **Padre ve alerta** → `GET /v1/alertas`
9. **Padre marca leída** → `PATCH /v1/alertas/{id}/marcar-leida`

---

## 🔐 VALIDACIÓN DE PERMISOS

### En cada endpoint:
1. Validar JWT (token válido y no expirado)
2. Extraer `user_id` y `rol_nombre` del token
3. Verificar que el rol tiene permiso para el endpoint
4. Para DOCENTE y PADRE: validar acceso a recursos específicos
   - DOCENTE: solo sus clases
   - PADRE: solo sus hijos

### Ejemplo de validación en RegistrarNotaUseCase:
```python
if current_user.rol == 'DOCENTE':
    # Verificar que la clase pertenece al docente
    clase = get_clase_by_matricula(matricula_clase_id)
    if clase.docente_user_id != current_user.id:
        raise ForbiddenException("No tiene permiso para registrar notas en esta clase")
```
