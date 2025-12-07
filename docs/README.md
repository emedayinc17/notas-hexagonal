# 📚 Documentación del Sistema de Gestión de Notas

**Versión:** 1.0.0  
**Fecha:** Diciembre 2025  
**Estado:** ✅ Proyecto 100% Completado

---

## 🎯 Acerca de esta Carpeta

Esta carpeta contiene **TODA la documentación** del Sistema de Gestión de Notas de forma **autocontenida y lista para deployment**. Todos los archivos necesarios están incluidos y pueden ser servidos directamente desde un servidor web.

---

## 📁 Estructura de Archivos

```
documentacion/
├── index.html                              # Portal principal
├── 1_DOCUMENTACION_PROCESO.html            # Doc de Proceso
├── 2_DOCUMENTACION_PRODUCTO.html           # Doc de Producto
├── 3_DOCUMENTACION_OPERACIONES.html        # Doc de Operaciones
├── 4_DOCUMENTACION_USUARIO.html            # Doc de Usuario
├── 5_DOCUMENTACION_NEGOCIO.html            # Doc de Negocio
├── GUIA_INICIO.html                        # Guía de inicio rápido
├── INSTRUCCIONES.html                      # Instrucciones generales
├── visor_archivos.html                     # Visor de MD/CSV/PY
├── screenshots/                            # 18 capturas de pantalla
│   ├── 1_login.png
│   ├── 2_dashboard.png
│   ├── ... (16 más)
│   └── 18_padre_notas_completas.png
├── archivos/                               # Archivos de soporte
│   ├── README_DOCUMENTACION.md
│   ├── PROYECTO_COMPLETADO.md
│   ├── ALINEACION_COMPLETA.md
│   ├── ACTUALIZACION_FINAL.md
│   ├── DOCUMENTACION_100_COMPLETA.md
│   ├── DOCUMENTACION_PERFECTA_18_SCREENSHOTS.md
│   ├── MENU_NAVEGACION_AGREGADO.md
│   ├── Jira.csv
│   └── add_navigation_menu.py
├── assets/                                 # (Reservado para futuros assets)
└── README.md                               # Este archivo
```

---

## 🚀 Cómo Usar

### Opción 1: Servidor Local (Python)
```bash
cd documentacion
python -m http.server 8000
```
Luego abre: `http://localhost:8000`

### Opción 2: Servidor Local (Node.js)
```bash
cd documentacion
npx http-server -p 8000
```
Luego abre: `http://localhost:8000`

### Opción 3: Deployment en Host
Sube toda la carpeta `documentacion/` a tu servidor web (Apache, Nginx, etc.) y accede a través de tu dominio.

---

## 📄 Documentos Principales

### 1. **Portal Principal** (`index.html`)
- Punto de entrada a toda la documentación
- Enlaces a todos los documentos
- Estadísticas del proyecto
- Enlaces a ambientes de deployment

### 2. **Documentación de Proceso** (`1_DOCUMENTACION_PROCESO.html`)
- Metodología Scrum
- Backlog y historias de usuario
- Planificación de sprints
- Gestión de riesgos
- Evidencias (Jira.csv)

### 3. **Documentación de Producto** (`2_DOCUMENTACION_PRODUCTO.html`)
- Arquitectura hexagonal
- Stack tecnológico
- Modelo de datos (26 tablas)
- APIs REST (37+ endpoints)
- Diagramas de flujo

### 4. **Documentación de Operaciones** (`3_DOCUMENTACION_OPERACIONES.html`)
- Instalación en 3 ambientes:
  - Local (localhost:8080)
  - Kubernetes Local (sga.emeday.inc)
  - Azure Kubernetes (sga.172.189.58.78.nip.io)
- Mantenimiento y troubleshooting
- Backups y recuperación

### 5. **Documentación de Usuario** (`4_DOCUMENTACION_USUARIO.html`)
- Manual por rol (ADMIN, DOCENTE, PADRE)
- **18 screenshots reales** del sistema
- Guías paso a paso
- Flujos interactivos (comboboxes, formularios)

### 6. **Documentación de Negocio** (`5_DOCUMENTACION_NEGOCIO.html`)
- Resumen ejecutivo
- Objetivos y alcance
- ROI y beneficios
- Resultados de QA
- Cierre formal del proyecto

---

## 🖼️ Screenshots

La carpeta `screenshots/` contiene **18 capturas de pantalla reales** del sistema:

**ADMIN (6):**
- Login, Dashboard, Usuarios, Alumnos, Clases, Modal

**DOCENTE (6):**
- Dashboard, Mis Clases, Gestión Notas, Ver Notas, Modal, Formulario

**PADRE (6):**
- Dashboard, Mis Hijos, Notas, Combobox, Filtrado, Vista Completa

---

## 📋 Visor de Archivos

El archivo `visor_archivos.html` permite visualizar archivos Markdown, CSV y Python directamente en el navegador:

**Archivos disponibles:**
- 7 archivos Markdown (README, actualizaciones, etc.)
- 1 archivo CSV (Jira.csv)
- 1 script Python (add_navigation_menu.py)

**Características:**
- Renderizado de Markdown en tiempo real
- Tablas CSV formateadas
- Syntax highlighting para Python
- Navegación fácil entre archivos

---

## 🎨 Características

### ✅ Menú de Navegación Sticky
Todos los documentos HTML incluyen un menú de navegación sticky que permite:
- Volver al index desde cualquier página
- Navegar entre documentos
- Indicador visual del documento actual
- Responsive (móvil y desktop)

### ✅ Autocontenido
- No requiere archivos externos (excepto CDNs de Bootstrap)
- Todas las imágenes incluidas
- Todos los archivos de soporte incluidos
- Listo para deployment

### ✅ Responsive
- Diseño adaptable a móviles, tablets y desktop
- Menús colapsables en móviles
- Imágenes responsive

---

## 🌐 Enlaces de Acceso al Sistema

### Ambiente Local
- **Frontend:** http://localhost:8080
- **APIs:** http://localhost:8001-8004/docs

### Kubernetes Local (ArgoCD)
- **Frontend:** http://sga.emeday.inc

### Azure Kubernetes
- **Frontend:** http://sga.172.189.58.78.nip.io

---

## 🔑 Credenciales de Prueba

**ADMIN:**
- Email: `admin@colegio.com`
- Password: `Admin123!`

**DOCENTE:**
- Email: `docente@colegio.com`
- Password: `Docente123!`

**PADRE:**
- Email: `padre@example.com`
- Password: `Padre123!`

---

## 📊 Estadísticas

- **Documentos HTML:** 8
- **Screenshots:** 18
- **Archivos Markdown:** 7
- **Archivos CSV:** 1
- **Scripts Python:** 1
- **Total de archivos:** 35+

---

## 🎯 Cumplimiento

Esta documentación cumple al **100%** con los estándares:
- ✅ ISO/IEC 26514
- ✅ Docs-as-Code
- ✅ Completitud
- ✅ Exactitud
- ✅ Claridad
- ✅ Usabilidad

---

## 📞 Soporte

Para más información sobre el proyecto:
- **GitHub:** https://github.com/emedayinc17/notas-hexagonal.git
- **Docker Hub:** https://hub.docker.com/u/emeday17

---

**Desarrollado con ❤️ usando Arquitectura Hexagonal**  
**Versión:** 1.0.0 | **Actualizado:** Diciembre 2025
