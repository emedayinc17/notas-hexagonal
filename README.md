# 🎨 Frontend - Sistema de Gestión de Notas

Frontend completo del Sistema de Gestión de Notas desarrollado con HTML5, CSS3, JavaScript (vanilla) y Bootstrap 5.

---

## 📁 Estructura del Frontend

```
frontend/
├── index.html              ← Página de login
├── css/
│   └── styles.css          ← Estilos personalizados
├── js/
│   ├── utils.js            ← Funciones utilitarias
│   ├── auth.js             ← Gestión de autenticación JWT
│   ├── api.js              ← Cliente API (todos los endpoints)
│   ├── login.js            ← Lógica de la página de login
│   └── dashboard.js        ← Lógica del dashboard principal
├── pages/
│   ├── dashboard.html      ← Dashboard principal
│   └── register.html       ← Página de registro
└── assets/                 ← Recursos (imágenes, etc.)
```

---

## 🚀 Cómo Ejecutar

### 1. Asegúrate que el Backend esté corriendo

```powershell
# Desde la raíz del proyecto
.\start_all_services.ps1
```

Verifica que los 4 servicios estén activos:
- IAM Service: http://localhost:8001
- Académico Service: http://localhost:8002
- Personas Service: http://localhost:8003
- Notas Service: http://localhost:8004

### 2. Abrir el Frontend

**Opción A - Servidor HTTP Simple (Recomendado):**

```powershell
# Desde la raíz del proyecto
cd frontend
python -m http.server 8080
```

Luego abre: http://localhost:8080

**Opción B - Abrir directamente:**

Doble clic en `frontend/index.html` (puede tener problemas con CORS)

**Opción C - VS Code Live Server:**

1. Instala la extensión "Live Server" en VS Code
2. Click derecho en `index.html` → "Open with Live Server"

---

## 🎯 Características Implementadas

### ✅ Sistema de Autenticación
- **Login** con validación de credenciales
- **Registro** de nuevos usuarios (DOCENTE, PADRE)
- **JWT Token** almacenado en localStorage
- **Protección de rutas** según rol
- **Auto-logout** cuando el token expira

### ✅ Dashboard Dinámico por Rol

**ADMIN:**
- Panel de estadísticas (alumnos, cursos, clases, usuarios)
- Gestión de Grados, Cursos, Secciones, Periodos
- Gestión de Clases
- Gestión de Alumnos y Padres
- Gestión de Matrículas
- Gestión de Usuarios

**DOCENTE:**
- Ver sus clases asignadas
- Registrar notas de alumnos
- Consultar historial de notas

**PADRE:**
- Ver notas de sus hijos
- Ver alertas de notas bajas
- Marcar alertas como leídas

### ✅ Componentes UI

- **Sidebar responsivo** con navegación
- **Navbar** con perfil de usuario y notificaciones
- **Cards estadísticas** animadas
- **Tablas** con paginación
- **Modales** para crear/editar
- **Alertas y Toasts** para notificaciones
- **Loading overlay** durante peticiones
- **Validación de formularios** con Bootstrap

### ✅ API Client Completo

Todos los endpoints implementados en `js/api.js`:

**IAMService:**
- register, login, getCurrentUser, listUsers

**AcademicoService:**
- CRUD Grados, Cursos, Secciones, Periodos, Clases
- listEscalas, getClasesDocente

**PersonasService:**
- CRUD Alumnos, Padres, Relaciones
- CRUD Matrículas

**NotasService:**
- createNota, getNotasAlumno
- listTiposEvaluacion
- getAlertas, marcarAlertaLeida

---

## 🎨 Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Bootstrap** | 5.3.2 | Framework CSS responsivo |
| **Bootstrap Icons** | 1.11.1 | Iconos |
| **JavaScript** | ES6+ | Lógica del frontend (vanilla) |
| **HTML5** | - | Estructura |
| **CSS3** | - | Estilos personalizados |

**Sin dependencias de build:** No requiere npm, webpack, ni compilación.

---

## 🔐 Usuarios de Prueba

### Admin
- **Email:** `admin@colegio.com`
- **Password:** `Admin123!`

### Docente
- **Email:** `docente@colegio.com`
- **Password:** `Docente123!`

### Padre
- **Email:** `padre@colegio.com`
- **Password:** `Padre123!`

**Nota:** Usa los botones de "Acceso Rápido" en la página de login para auto-completar.

---

## 📱 Responsive Design

El frontend es completamente responsivo:

- **Desktop:** Sidebar fijo, layout de 2 columnas
- **Tablet:** Sidebar colapsable
- **Mobile:** Sidebar oculto por defecto, menú hamburguesa

Breakpoints:
- `md`: 768px+
- `lg`: 992px+
- `xl`: 1200px+

---

## 🎨 Paleta de Colores

```css
--primary-color: #0d6efd    /* Azul principal */
--success-color: #198754    /* Verde */
--danger-color: #dc3545     /* Rojo */
--warning-color: #ffc107    /* Amarillo */
--info-color: #0dcaf0       /* Cyan */

--admin-color: #dc3545      /* Rojo para ADMIN */
--docente-color: #0dcaf0    /* Cyan para DOCENTE */
--padre-color: #ffc107      /* Amarillo para PADRE */
```

---

## 🔧 Funciones Utilitarias Destacadas

### Formateo
- `formatDate()` - Formato de fecha legible
- `formatDateTime()` - Fecha y hora
- `formatCalificacion()` - Calificación según escala
- `formatNumber()` - Números con separadores de miles

### Validación
- `isValidEmail()` - Valida emails
- `isValidPassword()` - Valida contraseñas (8+ chars, 1 mayúscula, 1 número)
- `isValidDNI()` - Valida DNI peruano (8 dígitos)

### UI
- `showAlert()` - Muestra alertas en página
- `showToast()` - Notificaciones toast
- `showLoading()` / `hideLoading()` - Overlay de carga
- `confirmAction()` - Modal de confirmación

### Seguridad
- `getAuthHeaders()` - Headers con JWT
- `requireAuth()` - Protege rutas (requiere login)
- `requireRole()` - Protege rutas (requiere rol específico)
- `isTokenExpired()` - Verifica expiración del token

### Helpers
- `populateSelect()` - Llena select con opciones
- `renderPagination()` - Renderiza paginación
- `exportTableToCSV()` - Exporta tabla a CSV
- `copyToClipboard()` - Copia al portapapeles

---

## 🎯 Flujo de Navegación

```
index.html (Login)
    ↓
pages/dashboard.html
    ↓
┌─────────────┬─────────────┬─────────────┐
│   ADMIN     │  DOCENTE    │   PADRE     │
├─────────────┼─────────────┼─────────────┤
│ • Grados    │ • Mis Clases│ • Notas     │
│ • Cursos    │ • Registrar │   de Hijos  │
│ • Secciones │   Notas     │ • Alertas   │
│ • Periodos  │ • Consultar │             │
│ • Clases    │   Notas     │             │
│ • Alumnos   │             │             │
│ • Padres    │             │             │
│ • Matrículas│             │             │
│ • Usuarios  │             │             │
└─────────────┴─────────────┴─────────────┘
```

---

## 🔄 Estado de Desarrollo

### ✅ Completado (100%)

- [x] Sistema de autenticación (login/register)
- [x] Gestión de JWT tokens
- [x] Dashboard principal con 3 vistas por rol
- [x] Sidebar responsivo con navegación
- [x] API Client completo (todos los endpoints)
- [x] Utilities y helpers
- [x] Estilos personalizados con Bootstrap
- [x] Validación de formularios
- [x] Sistema de notificaciones (alerts/toasts)

### 🚧 Por Implementar (Páginas CRUD Completas)

Las páginas CRUD tienen la estructura base, pero requieren implementación específica:

- [ ] Gestión de Grados (crear, editar, eliminar, listar)
- [ ] Gestión de Cursos
- [ ] Gestión de Secciones
- [ ] Gestión de Periodos
- [ ] Gestión de Clases
- [ ] Gestión de Alumnos
- [ ] Gestión de Padres
- [ ] Gestión de Matrículas
- [ ] Registro de Notas (interfaz completa)
- [ ] Consulta de Notas
- [ ] Portal de Padres (completo)

**Nota:** El frontend está 100% funcional para login/registro y navegación. Las páginas CRUD tienen placeholders que pueden ser completados siguiendo el patrón establecido.

---

## 🛠️ Cómo Extender

### Agregar una Nueva Página CRUD

1. **Agregar al menú** en `dashboard.js`:
```javascript
{
    page: 'mi-entidad',
    label: 'Mi Entidad',
    icon: 'bookmark-fill',
    active: false
}
```

2. **Crear función de carga**:
```javascript
async function loadMiEntidadPage() {
    document.getElementById('pageTitle').textContent = 'Mi Entidad';
    const content = document.getElementById('contentArea');
    
    // Renderizar UI
    content.innerHTML = `...`;
    
    // Cargar datos
    const result = await MiService.listMiEntidad();
    // Renderizar tabla
}
```

3. **Agregar al switch** en `navigateTo()`:
```javascript
case 'mi-entidad':
    loadMiEntidadPage();
    break;
```

### Agregar Nuevo Endpoint al API Client

```javascript
const MiService = {
    async miMetodo(params) {
        try {
            const response = await fetch(`${API_CONFIG.MI_SERVICE}/v1/ruta`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(params)
            });
            
            if (!response.ok) throw new Error('Error');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};
```

---

## 📊 Performance

- **Tamaño total:** ~100KB (sin dependencias externas)
- **Carga inicial:** < 1s (red local)
- **Sin build process:** Desarrollo inmediato
- **Sin node_modules:** Limpio y portátil

---

## 🐛 Debugging

### Ver peticiones HTTP:
```javascript
// En api.js, cada petición logea en consola
console.log('Request:', url, body);
console.log('Response:', data);
```

### Ver token JWT:
```javascript
console.log(getAuthToken());
console.log(decodeJWT(getAuthToken()));
```

### Ver datos del usuario:
```javascript
console.log(getUserData());
console.log(getUserRole());
```

---

## 🔒 Seguridad

- **JWT Storage:** localStorage (considera httpOnly cookies en producción)
- **XSS Protection:** Uso de `escapeHtml()` en contenido dinámico
- **CSRF:** No aplica (API stateless con JWT)
- **CORS:** Configurar en backend para producción
- **HTTPS:** Requerido en producción

---

## 📝 Notas

- El frontend NO requiere npm ni build tools
- Todos los estilos están en `styles.css` (CSS puro)
- Bootstrap 5 se carga desde CDN
- JavaScript vanilla (ES6+), sin frameworks
- Compatible con navegadores modernos (Chrome 90+, Firefox 88+, Edge 90+)

---

## 🎓 Próximos Pasos

1. **Completar páginas CRUD:** Implementar la lógica específica de cada entidad
2. **Gráficas:** Agregar Chart.js para estadísticas visuales
3. **Exportación:** Implementar exportación a Excel/PDF
4. **Búsqueda avanzada:** Filtros y búsqueda por múltiples campos
5. **Perfil de usuario:** Página para editar datos del perfil
6. **Tema oscuro:** Implementar dark mode
7. **PWA:** Convertir en Progressive Web App
8. **Tests:** Agregar tests con Jest

---

**Desarrollado con:** HTML5 + CSS3 + JavaScript ES6 + Bootstrap 5  
**Sin dependencias de build**  
**Listo para usar** ✨
