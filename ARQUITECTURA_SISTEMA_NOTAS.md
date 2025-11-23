# 🎓 ARQUITECTURA DEL SISTEMA DE GESTIÓN DE NOTAS

## 📋 RESUMEN EJECUTIVO

El sistema está diseñado como una **arquitectura de microservicios hexagonal** donde el **CORE** es el **Servicio de Notas**, que orquesta la lógica de negocio de calificaciones, evaluaciones y notificaciones a padres.

---

## 🏗️ ARQUITECTURA COMPLETA

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (HTML/JS)                        │
│  - Dashboard por ROL (ADMIN, DOCENTE, PADRE)                    │
│  - Formulario de Registro de Notas                              │
│  - Visualización de Notas con Filtros                           │
│  - Alertas y Notificaciones                                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTP/REST + JWT
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICIOS (FastAPI)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ IAM Service  │  │  Académico   │  │   Personas   │          │
│  │   :8001      │  │  Service     │  │   Service    │          │
│  │              │  │   :8002      │  │   :8003      │          │
│  │ - Usuarios   │  │ - Grados     │  │ - Alumnos    │          │
│  │ - Roles      │  │ - Cursos     │  │ - Padres     │          │
│  │ - Auth/JWT   │  │ - Secciones  │  │ - Matrículas │          │
│  │              │  │ - Periodos   │  │ - Relaciones │          │
│  │              │  │ - Clases     │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│                    ┌────────────────────────┐                   │
│                    │   🎯 NOTAS SERVICE     │ ← CORE DEL SISTEMA│
│                    │      :8004             │                   │
│                    │                        │                   │
│                    │ - Tipos de Evaluación  │                   │
│                    │ - Escalas Calificación │                   │
│                    │ - Registro de Notas    │                   │
│                    │ - Cálculo Promedios    │                   │
│                    │ - Alertas Automáticas  │                   │
│                    │ - Notificaciones       │                   │
│                    └────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
             │
             │ SQL
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MySQL DATABASE                              │
├─────────────────────────────────────────────────────────────────┤
│  sga_iam        │  sga_academico  │  sga_personas  │ sga_notas  │
│  - usuarios     │  - grados       │  - alumnos     │ - notas    │
│  - roles        │  - cursos       │  - padres      │ - tipos_ev.│
│                 │  - secciones    │  - matriculas  │ - escalas  │
│                 │  - periodos     │  - relaciones  │ - alertas  │
│                 │  - clases       │                │            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 FLUJO PRINCIPAL: REGISTRO DE NOTAS

### **Paso 1: Configuración Previa (ADMIN)**

Antes de registrar notas, el ADMIN debe configurar:

#### A. Tipos de Evaluación
```sql
-- Ejemplos en tipos_evaluacion
- EXAMEN_PARCIAL   (peso: 30%)
- EXAMEN_FINAL     (peso: 40%)
- PRACTICA         (peso: 15%)
- PARTICIPACION    (peso: 10%)
- TAREA            (peso: 5%)
```

#### B. Escalas de Calificación
```sql
-- Ejemplo: Escala Vigesimal (0-20)
escala_id: "e1"
tipo: NUMERICA
valor_minimo: 0
valor_maximo: 20

-- Ejemplo: Escala Literal (A-F)
escala_id: "e2"
tipo: LITERAL
valores:
  - A (Excelente)     → 18-20
  - B (Bueno)         → 14-17
  - C (Regular)       → 11-13
  - D (Deficiente)    → 0-10
```

#### C. Estructura Académica
1. **Grado** (ej: "3ro Primaria")
2. **Sección** (ej: "Sección A - 2025")
3. **Curso** (ej: "Matemáticas")
4. **Periodo** (ej: "Primer Bimestre 2025")
5. **Clase** = Curso + Sección + Periodo + Docente asignado

#### D. Matrículas
- Alumno matriculado en una CLASE específica
- Genera `matricula_clase_id`

---

### **Paso 2: Registro de Nota (DOCENTE o ADMIN)**

El DOCENTE ingresa a `/pages/notas.html` y:

```javascript
// Formulario de Nota
{
  "matricula_clase_id": "mat-123",  // Alumno: Juan Pérez | Clase: Matemáticas 3A
  "tipo_evaluacion_id": "eval-001", // Examen Parcial
  "periodo_id": "per-2025-1",       // Primer Bimestre 2025
  "escala_id": "esc-vigesimal",     // Escala 0-20
  "valor_numerico": 16.5,           // Nota: 16.5
  "peso": 30,                       // Peso: 30%
  "observaciones": "Buen desempeño en álgebra"
}
```

**Backend valida:**
- ✅ Token JWT del DOCENTE
- ✅ El DOCENTE está asignado a esa clase
- ✅ La matrícula existe y está activa
- ✅ El periodo es válido
- ✅ La escala permite ese valor

**Se registra en `notas` table:**
```sql
INSERT INTO sga_notas.notas (
  id, matricula_clase_id, tipo_evaluacion_id, periodo_id,
  escala_id, valor_numerico, peso, fecha_registro, registrado_por_user_id
) VALUES (
  UUID(), 'mat-123', 'eval-001', 'per-2025-1',
  'esc-vigesimal', 16.5, 30, NOW(), 'docente-456'
);
```

---

### **Paso 3: Sistema de Alertas Automáticas**

Después del registro, el sistema **evalúa automáticamente**:

```python
# Lógica en use_case registrar_nota
if valor_numerico < 11:  # Umbral de nota baja
    # Crear alerta
    alerta = AlertaNotificacion(
        nota_id=nota_id,
        alumno_id=alumno_id,
        padre_id=padre_id,  # Obtenido de Personas Service
        tipo_alerta="NOTA_BAJA",
        mensaje=f"Su hijo {alumno_nombre} obtuvo {valor_numerico} en {curso_nombre}"
    )
    
    # Guardar en DB
    alertas_repository.save(alerta)
    
    # Crear notificación OUTBOX (patrón async)
    outbox = OutboxNotificacion(
        alerta_id=alerta.id,
        tipo="EMAIL",
        destinatario=padre_email,
        mensaje=alerta.mensaje,
        estado="PENDIENTE"
    )
    outbox_repository.save(outbox)
```

**Tabla `alertas_notificacion`:**
```sql
id: alert-789
nota_id: nota-123
alumno_id: alu-456
padre_id: padre-789
tipo_alerta: NOTA_BAJA
mensaje: "Su hijo Juan Pérez obtuvo 10.5 en Matemáticas - Examen Parcial"
leida: FALSE
```

**Tabla `outbox_notificaciones` (Patrón Outbox):**
```sql
id: outbox-001
alerta_id: alert-789
tipo: EMAIL
destinatario: padre@email.com
estado: PENDIENTE
intentos: 0
```

> **Patrón Outbox**: Las notificaciones se guardan primero en DB, luego un **worker asíncrono** (no implementado aún) las procesa y envía. Esto garantiza que no se pierda ninguna notificación.

---

### **Paso 4: Visualización por ROL**

#### **ADMIN** (`/pages/notas.html`)
- Ve **TODAS** las notas del sistema
- Puede filtrar por: Docente, Clase, Periodo, Alumno
- Puede registrar notas en cualquier clase

#### **DOCENTE** (`/pages/notas.html`)
- Ve solo notas de **SUS CLASES asignadas**
- El filtro "Docente" está OCULTO
- Puede registrar notas solo en sus clases

```javascript
// Backend filtra automáticamente
if (rol === "DOCENTE") {
  // Obtener clases del docente
  clases_docente = await AcademicoService.listClases(docente_id=user_id)
  
  // Filtrar notas solo de esas clases
  notas = notas.filter(n => n.clase_id in clases_docente)
}
```

#### **PADRE** (`/pages/notas-hijos.html`)
- Ve solo notas de **SUS HIJOS**
- Dashboard personalizado con:
  - Lista de hijos
  - Promedio general por hijo
  - Mejor nota, peor nota
  - Alertas pendientes
  - Detalle por curso

```javascript
// Backend filtra automáticamente
if (rol === "PADRE") {
  // Obtener hijos del padre
  hijos = await PersonasService.getHijos(padre_id=user_id)
  
  // Obtener matrículas de esos hijos
  matriculas = hijos.flatMap(h => h.matriculas)
  
  // Filtrar notas solo de esas matrículas
  notas = notas.filter(n => n.matricula_id in matriculas)
}
```

---

## 📊 MODELO DE DATOS CLAVE

### **Tabla: notas**
```sql
CREATE TABLE notas (
    id CHAR(36) PRIMARY KEY,
    matricula_clase_id CHAR(36),      -- Relaciona: Alumno ↔ Clase
    tipo_evaluacion_id CHAR(36),      -- Examen, Práctica, Tarea, etc.
    periodo_id CHAR(36),              -- Bimestre, Trimestre, Semestre
    escala_id CHAR(36),               -- Escala de calificación usada
    valor_literal VARCHAR(10),        -- Ej: "A", "B+", "AD"
    valor_numerico DECIMAL(5,2),      -- Ej: 16.5, 18.0, 11.0
    peso DECIMAL(5,2),                -- Peso en el promedio (%)
    observaciones TEXT,
    fecha_registro DATE,
    registrado_por_user_id CHAR(36),  -- Docente que registró
    created_at TIMESTAMP
);
```

### **Relación Alumno → Nota**
```
Alumno
  └─► Matrícula (Alumno + Clase)
        └─► Nota (Matrícula + TipoEval + Periodo + Escala + Valor)
```

### **Ejemplo Real:**
```
Alumno: "Juan Pérez" (id: alu-123)
  ├─► Matrícula 1: Matemáticas 3ro A - Bimestre 1 (mat-001)
  │     ├─► Nota: Examen Parcial → 16.5 (peso 30%)
  │     ├─► Nota: Práctica 1     → 18.0 (peso 15%)
  │     └─► Nota: Tarea 1        → 14.0 (peso 5%)
  │
  └─► Matrícula 2: Comunicación 3ro A - Bimestre 1 (mat-002)
        ├─► Nota: Examen Parcial → 15.0 (peso 30%)
        └─► Nota: Exposición     → 17.5 (peso 20%)
```

---

## 🔧 FUNCIONALIDADES ACTUALES vs FALTANTES

### ✅ **IMPLEMENTADO**
1. ✅ Registro de notas (CREATE)
2. ✅ Listado de notas con filtros (READ)
3. ✅ Filtrado por ROL (ADMIN, DOCENTE, PADRE)
4. ✅ Sistema de alertas (lógica básica)
5. ✅ Modelo de datos completo
6. ✅ Validación de permisos (docente solo puede ver/editar sus clases)

### ❌ **FALTA IMPLEMENTAR**

#### 1. **CRUD Completo de Notas** ⚠️ CRÍTICO
```python
# Falta en router_admin.py:
@router.put("/notas/{nota_id}")  # Editar nota
@router.delete("/notas/{nota_id}")  # Eliminar nota
```

#### 2. **Gestión de Tipos de Evaluación** ⚠️ CRÍTICO
```python
# Actualmente SOLO hay datos seed, NO hay endpoints
@router.post("/tipos-evaluacion")    # Crear tipo
@router.get("/tipos-evaluacion")     # Listar
@router.put("/tipos-evaluacion/{id}") # Editar
@router.delete("/tipos-evaluacion/{id}") # Eliminar
```

#### 3. **Gestión de Escalas de Calificación** ⚠️ CRÍTICO
```python
# Actualmente SOLO hay datos seed
@router.post("/escalas")           # Crear escala
@router.get("/escalas")            # Listar (YA EXISTE)
@router.put("/escalas/{id}")       # Editar
@router.delete("/escalas/{id}")    # Eliminar

@router.post("/escalas/{id}/valores")  # Agregar valor a escala literal
@router.put("/valores-escala/{id}")    # Editar valor
@router.delete("/valores-escala/{id}") # Eliminar valor
```

#### 4. **Cálculo Automático de Promedios**
```python
@router.get("/promedios/alumno/{alumno_id}")
# Retorna:
{
  "promedio_general": 15.8,
  "por_curso": [
    {"curso": "Matemáticas", "promedio": 16.5},
    {"curso": "Comunicación", "promedio": 15.0}
  ],
  "por_periodo": [
    {"periodo": "Bimestre 1", "promedio": 16.2}
  ]
}
```

#### 5. **Worker de Notificaciones**
```python
# Procesar outbox_notificaciones y enviar emails reales
async def process_outbox():
    pending = await outbox_repo.find_by_status("PENDIENTE")
    for notif in pending:
        await send_email(notif.destinatario, notif.mensaje)
        notif.estado = "ENVIADO"
        await outbox_repo.update(notif)
```

#### 6. **Dashboard de Alertas para PADRE**
```javascript
// frontend/pages/alertas.html (NO EXISTE)
- Lista de alertas no leídas
- Botón "Marcar como leída"
- Filtro por tipo de alerta
- Historial completo
```

#### 7. **Reportes y Estadísticas**
```python
@router.get("/reportes/clase/{clase_id}")
# Retorna:
{
  "total_alumnos": 30,
  "promedio_clase": 14.5,
  "aprobados": 25,
  "desaprobados": 5,
  "distribucion": {
    "18-20": 5,
    "14-17": 15,
    "11-13": 8,
    "0-10": 2
  }
}
```

#### 8. **Importación Masiva de Notas**
```python
@router.post("/notas/import")
# Permite subir Excel/CSV con notas
```

---

## 🎨 FRONTEND: PÁGINAS NECESARIAS

### **ADMIN**
1. ✅ `/pages/notas.html` - Gestión completa
2. ❌ `/pages/tipos-evaluacion.html` - CRUD Tipos de Evaluación
3. ❌ `/pages/escalas.html` - CRUD Escalas de Calificación
4. ❌ `/pages/reportes.html` - Dashboard con gráficos

### **DOCENTE**
1. ✅ `/pages/mis-clases.html` - Ver clases asignadas
2. ✅ `/pages/notas.html` - Registrar/ver notas
3. ❌ `/pages/reportes-clase.html` - Estadísticas de sus clases

### **PADRE**
1. ✅ `/pages/notas-hijos.html` - Ver notas de hijos
2. ❌ `/pages/alertas.html` - Ver alertas/notificaciones
3. ❌ `/pages/progreso-hijo.html` - Gráficos de evolución

---

## 🚀 PLAN DE IMPLEMENTACIÓN SUGERIDO

### **FASE 1: Completar CRUD Básico** (Crítico)
1. ✅ Agregar UPDATE/DELETE endpoints para Notas
2. ✅ Crear endpoints para Tipos de Evaluación (CRUD completo)
3. ✅ Crear endpoints para Escalas de Calificación (CRUD completo)
4. Actualizar `frontend/js/api.js` con nuevos métodos
5. Crear páginas CRUD para Tipos de Evaluación y Escalas

### **FASE 2: Cálculo de Promedios**
1. Implementar lógica de cálculo de promedios ponderados
2. Endpoint `/promedios` con múltiples vistas
3. Integrar en dashboards de PADRE y DOCENTE

### **FASE 3: Sistema de Notificaciones**
1. Worker asíncrono para procesar outbox
2. Integración con servicio de email (SendGrid, AWS SES)
3. Dashboard de alertas para PADRE

### **FASE 4: Reportes y Analytics**
1. Endpoints de estadísticas
2. Gráficos con Chart.js
3. Exportación a PDF/Excel

---

## 📝 EJEMPLO DE USO COMPLETO

```javascript
// 1. ADMIN configura sistema
await TiposEvaluacionService.create({
  codigo: "EXAM_PARC",
  nombre: "Examen Parcial",
  peso_default: 30
});

await EscalasService.create({
  nombre: "Vigesimal",
  tipo: "NUMERICA",
  valor_minimo: 0,
  valor_maximo: 20
});

// 2. ADMIN crea estructura académica
const grado = await AcademicoService.createGrado({nombre: "3ro Primaria"});
const seccion = await AcademicoService.createSeccion({grado_id, nombre: "A", año: 2025});
const curso = await AcademicoService.createCurso({codigo: "MAT", nombre: "Matemáticas"});
const periodo = await AcademicoService.createPeriodo({nombre: "Bimestre 1", año: 2025});
const clase = await AcademicoService.createClase({
  curso_id, seccion_id, periodo_id, docente_user_id
});

// 3. ADMIN matricula alumno
const matricula = await PersonasService.matricularAlumno({
  alumno_id: "alu-123",
  clase_id: clase.id
});

// 4. DOCENTE registra nota
const nota = await NotasService.registrarNota({
  matricula_clase_id: matricula.id,
  tipo_evaluacion_id: "eval-parcial",
  periodo_id: periodo.id,
  escala_id: "esc-vigesimal",
  valor_numerico: 16.5,
  peso: 30
});

// 5. Sistema crea alerta automática (si nota < 11)
// 6. PADRE recibe email
// 7. PADRE ve en dashboard: "Nueva alerta: Nota baja en Matemáticas"
```

---

## 🎯 CONCLUSIÓN

**El sistema YA TIENE** toda la arquitectura base y el flujo completo de registro de notas. Lo que FALTA es:

1. ⚠️ **CRUD completo** de Tipos de Evaluación y Escalas (CRÍTICO)
2. ⚠️ **UPDATE/DELETE** de Notas (CRÍTICO)
3. 📊 **Cálculo de promedios** automático
4. 📧 **Worker de notificaciones** real
5. 📱 **Interfaces de administración** para configurar el sistema

**La funcionalidad CORE existe**, pero necesita las herramientas administrativas para configurar tipos de evaluación y escalas sin tocar la base de datos directamente.
