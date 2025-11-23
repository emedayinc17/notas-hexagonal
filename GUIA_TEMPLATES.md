# 📘 Guía de Uso: Sistema de Templates

## 🎯 Objetivo

Separar el HTML del JavaScript para mantener una arquitectura limpia y código más mantenible.

## 📁 Estructura de Archivos

```
frontend/
├── js/
│   ├── templates/
│   │   ├── common-templates.js      ← Templates reutilizables
│   │   ├── alumnos-templates.js     ← Templates de Alumnos
│   │   ├── padres-templates.js      ← Templates de Padres
│   │   └── [otros-templates].js     ← Templates de otros módulos
│   ├── alumnos.js                   ← Lógica de Alumnos
│   ├── padres.js                    ← Lógica de Padres
│   └── ...
└── pages/
    ├── alumnos.html
    ├── padres.html
    └── ...
```

## 🔧 Cómo Usar

### 1. Incluir Templates en HTML

Agregar **ANTES** del script del módulo:

```html
<!-- En alumnos.html -->
<script src="/js/templates/common-templates.js"></script>
<script src="/js/templates/alumnos-templates.js"></script>
<script src="/js/alumnos.js"></script>
```

### 2. Usar Templates en JavaScript

#### Antes (❌ HTML embebido):

```javascript
// ❌ MAL - HTML mezclado con JS
tbody.innerHTML = alumnos.map(a => `
    <tr>
        <td>${a.codigo}</td>
        <td>${a.nombre}</td>
        <td>
            <button onclick="edit('${a.id}')">Editar</button>
        </td>
    </tr>
`).join('');
```

#### Después (✅ Templates separados):

```javascript
// ✅ BIEN - Usar template
tbody.innerHTML = alumnos.map(a => AlumnoTemplates.row(a)).join('');
```

## 📋 Ejemplos Prácticos

### Ejemplo 1: Mostrar Lista de Alumnos

```javascript
async function loadAlumnos() {
    const tbody = document.getElementById('alumnosTableBody');
    
    // Mostrar loading
    tbody.innerHTML = AlumnoTemplates.loading();
    
    try {
        const result = await PersonasService.listAlumnos();
        
        if (result.success) {
            const alumnos = result.data.alumnos || [];
            
            if (alumnos.length === 0) {
                // Mostrar estado vacío
                tbody.innerHTML = AlumnoTemplates.empty();
            } else {
                // Mostrar alumnos
                tbody.innerHTML = alumnos.map(a => AlumnoTemplates.row(a)).join('');
            }
        }
    } catch (error) {
        // Mostrar error
        tbody.innerHTML = AlumnoTemplates.error('Error al cargar alumnos');
    }
}
```

### Ejemplo 2: Mostrar Familiares

```javascript
async function loadFamiliares(alumnoId) {
    const tbody = document.getElementById('familiaresTableBody');
    
    tbody.innerHTML = AlumnoTemplates.familiaresLoading();
    
    try {
        const result = await PersonasService.getPadresDeAlumno(alumnoId);
        
        if (result.success) {
            const relaciones = result.data.relaciones || [];
            
            if (relaciones.length === 0) {
                tbody.innerHTML = AlumnoTemplates.familiaresEmpty();
            } else {
                tbody.innerHTML = relaciones.map(r => AlumnoTemplates.familiarRow(r)).join('');
            }
        }
    } catch (error) {
        tbody.innerHTML = CommonTemplates.error('Error al cargar familiares', 5);
    }
}
```

### Ejemplo 3: Búsqueda con Resultados

```javascript
async function searchPadres(query) {
    const resultsContainer = document.getElementById('searchPadreResults');
    
    if (query.length < 3) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    try {
        const result = await PersonasService.listPadres();
        
        if (result.success) {
            const padres = result.data.padres || [];
            const filtered = padres.filter(p => 
                p.nombres.toLowerCase().includes(query.toLowerCase()) ||
                p.apellidos.toLowerCase().includes(query.toLowerCase())
            );
            
            if (filtered.length === 0) {
                resultsContainer.innerHTML = AlumnoTemplates.noSearchResults();
            } else {
                resultsContainer.innerHTML = filtered
                    .map(p => AlumnoTemplates.padreSearchResult(p))
                    .join('');
            }
        }
    } catch (error) {
        console.error('Error searching:', error);
    }
}
```

### Ejemplo 4: Usar Templates Comunes

```javascript
// Mostrar loading
tbody.innerHTML = CommonTemplates.loading(8, 'Cargando alumnos...');

// Mostrar estado vacío
tbody.innerHTML = CommonTemplates.empty('No hay registros', 'inbox', 8);

// Mostrar error
tbody.innerHTML = CommonTemplates.error('Error al cargar datos', 8);

// Crear badge de estado
const badge = CommonTemplates.statusBadge('ACTIVO');

// Crear badge de rol
const rolBadge = CommonTemplates.roleBadge('ADMIN');

// Crear botones de acción
const buttons = CommonTemplates.actionButtons('123', true, true, [
    { icon: 'people', variant: 'info', title: 'Ver familiares', onclick: "verFamiliares('123')" }
]);
```

## 🎨 Templates Disponibles

### CommonTemplates (Reutilizables)

| Método | Descripción | Uso |
|--------|-------------|-----|
| `loading(colspan, message)` | Estado de carga | Loading genérico |
| `empty(message, icon, colspan)` | Estado vacío | Sin datos |
| `error(message, colspan)` | Estado de error | Error al cargar |
| `statusBadge(status)` | Badge de estado | ACTIVO/INACTIVO |
| `roleBadge(rol)` | Badge de rol | ADMIN/DOCENTE/etc |
| `actionButton(...)` | Botón de acción | Editar/Eliminar/etc |
| `actionButtons(...)` | Grupo de botones | Acciones estándar |
| `menuItem(item)` | Item de menú | Sidebar |
| `selectOption(...)` | Opción de select | Dropdowns |
| `spinnerInline(size)` | Spinner pequeño | Loading inline |
| `alert(...)` | Alerta Bootstrap | Mensajes |
| `pagination(...)` | Paginación | Navegación |

### AlumnoTemplates

| Método | Descripción |
|--------|-------------|
| `row(alumno)` | Fila de alumno en tabla |
| `loading(colspan)` | Loading específico |
| `empty(message, colspan)` | Sin alumnos |
| `error(message, colspan)` | Error al cargar |
| `familiarRow(relacion)` | Fila de familiar |
| `familiaresLoading()` | Loading de familiares |
| `familiaresEmpty()` | Sin familiares |
| `padreSearchResult(padre)` | Resultado de búsqueda |
| `noSearchResults()` | Sin resultados |

### PadreTemplates

| Método | Descripción |
|--------|-------------|
| `row(padre)` | Fila de padre en tabla |
| `loading(colspan)` | Loading específico |
| `empty(message, colspan)` | Sin padres |
| `error(message, colspan)` | Error al cargar |
| `hijoRow(hijo)` | Fila de hijo |
| `hijosLoading()` | Loading de hijos |
| `hijosEmpty()` | Sin hijos |
| `alumnoSearchResult(alumno)` | Resultado de búsqueda |
| `noSearchResults()` | Sin resultados |

## 📝 Patrón de Uso Recomendado

### 1. Siempre usar try-catch

```javascript
async function loadData() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = CommonTemplates.loading(8);
    
    try {
        const result = await Service.getData();
        
        if (result.success) {
            const data = result.data || [];
            tbody.innerHTML = data.length === 0 
                ? CommonTemplates.empty('No hay datos', 'inbox', 8)
                : data.map(item => Template.row(item)).join('');
        } else {
            tbody.innerHTML = CommonTemplates.error(result.error, 8);
        }
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = CommonTemplates.error('Error al cargar datos', 8);
    }
}
```

### 2. Validar datos antes de renderizar

```javascript
function renderItems(items) {
    if (!items || !Array.isArray(items)) {
        return CommonTemplates.error('Datos inválidos');
    }
    
    if (items.length === 0) {
        return CommonTemplates.empty('No hay items');
    }
    
    return items.map(item => Template.row(item)).join('');
}
```

### 3. Usar templates comunes cuando sea posible

```javascript
// ✅ BIEN - Reutilizar
tbody.innerHTML = CommonTemplates.loading(8);

// ❌ MAL - Duplicar
tbody.innerHTML = `<tr><td colspan="8">Cargando...</td></tr>`;
```

## 🚀 Próximos Pasos

### Para Nuevos Módulos:

1. Crear archivo de templates: `frontend/js/templates/[modulo]-templates.js`
2. Definir templates específicos del módulo
3. Incluir en el HTML correspondiente
4. Usar en el archivo JS del módulo

### Para Módulos Existentes:

1. Identificar HTML embebido en JS
2. Mover a archivo de templates
3. Reemplazar `innerHTML` con llamadas a templates
4. Probar funcionalidad

## ✅ Beneficios

- ✅ **Separación clara** entre HTML y JS
- ✅ **Código más limpio** y fácil de leer
- ✅ **Reutilización** de templates comunes
- ✅ **Mantenimiento** más sencillo
- ✅ **Consistencia** en el diseño
- ✅ **Testeable** (templates son funciones puras)

## 📊 Checklist de Migración

Por cada módulo:
- [ ] Crear archivo de templates
- [ ] Identificar HTML embebido
- [ ] Mover a templates
- [ ] Actualizar JS para usar templates
- [ ] Incluir templates en HTML
- [ ] Probar funcionalidad
- [ ] Eliminar HTML embebido del JS

## 🎯 Ejemplo Completo: Alumnos

### 1. En `alumnos.html`:

```html
<!-- Incluir templates -->
<script src="/js/templates/common-templates.js"></script>
<script src="/js/templates/alumnos-templates.js"></script>
<script src="/js/alumnos.js"></script>
```

### 2. En `alumnos.js`:

```javascript
// Antes
tbody.innerHTML = `<tr><td colspan="8">Cargando...</td></tr>`;

// Después
tbody.innerHTML = AlumnoTemplates.loading();

// Antes
tbody.innerHTML = alumnos.map(a => `
    <tr>
        <td>${a.codigo}</td>
        ...
    </tr>
`).join('');

// Después
tbody.innerHTML = alumnos.map(a => AlumnoTemplates.row(a)).join('');
```

---

**¡Listo!** Ahora tienes un sistema de templates limpio y organizado. 🎉
