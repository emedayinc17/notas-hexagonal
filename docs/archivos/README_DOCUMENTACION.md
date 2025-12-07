# 📚 Documentación del Sistema de Gestión de Notas

## 🎯 Portal Principal

**Accede al portal de documentación:** [index.html](index.html)

El archivo `index.html` es el punto de entrada principal a toda la documentación del sistema. Desde ahí puedes navegar a todos los documentos especializados.

---

## 🌐 Enlaces de Acceso al Sistema

### 🏠 Ambiente Local (Desarrollo)
```
Frontend:     http://localhost:8080
IAM API:      http://localhost:8001/docs
Académico:    http://localhost:8002/docs
Personas:     http://localhost:8003/docs
Notas:        http://localhost:8004/docs
```

### ☁️ Kubernetes Local (ArgoCD)
```
Frontend:     http://sga.emeday.inc
Directorio:   k8s/
ArgoCD App:   k8s/frontend/deployapp.yaml
```

### 🌍 Azure Kubernetes (Internet)
```
Frontend:     http://sga.172.189.58.78.nip.io
IP Pública:   172.189.58.78
Directorio:   k8s_internet/
```

---

## 📋 Estructura de la Documentación

### 1. **Documentación de Proceso** (`1_DOCUMENTACION_PROCESO.html`) ✅ ACTUALIZADO
- **Tipo:** Temporal (desarrollo)
- **Audiencia:** Equipo de desarrollo, stakeholders técnicos
- **Contenido:**
  - **Timeline real de Sprints** (fechas del Jira)
    - Sprint 1: 01/Sep - 18/Sep/2025 (17 días) ✅
    - Sprint 2: 19/Sep - 12/Oct/2025 (23 días) ✅
    - Sprint 3: 13/Oct - 30/Nov/2025 (48 días) 🔄
    - Sprint 4: 01/Nov - 07/Dic/2025 (36 días) 📋
  - **Equipo real del proyecto** (5 personas)
    - Emerson Dayan - Product Owner / DevOps
    - Miguel Valverde - Scrum Master
    - Karina Torres - Developer Full Stack
    - Wilhelm Mallqui - Developer QA
    - Kelly - Developer Documentación/UI
  - **Modales interactivos** para scripts
  - Decisiones técnicas clave
  - Lecciones aprendidas

### 2. **Documentación de Producto** (`2_DOCUMENTACION_PRODUCTO.html`)
- **Tipo:** Permanente
- **Audiencia:** Arquitectos, desarrolladores, equipo técnico
- **Contenido:**
  - Arquitectura completa del sistema
  - Stack tecnológico detallado
  - Descripción de los 4 microservicios
  - Modelo de datos (26 tablas, 7 vistas)
  - Flujos de negocio principales
  - Seguridad y escalabilidad

### 3. **Documentación de Operaciones** (`3_DOCUMENTACION_OPERACIONES.html`) ✅ ACTUALIZADO
- **Tipo:** Permanente (crítico)
- **Audiencia:** DevOps, administradores de sistemas
- **Contenido:**
  - Instalación paso a paso
  - Configuración de variables de entorno
  - **Deployment en Kubernetes Local (ArgoCD)**
  - **Deployment en Azure Kubernetes**
  - Mantenimiento y backups
  - Monitoreo y troubleshooting
  - Checklist de seguridad
  - **Repositorio Git:** https://github.com/emedayinc17/notas-hexagonal.git
  - **Docker Hub:** emeday17/frontend:1.0.0

### 4. **Documentación de Usuario** (`4_DOCUMENTACION_USUARIO.html`)
- **Tipo:** Permanente
- **Audiencia:** Usuarios finales (ADMIN, DOCENTE, PADRE)
- **Contenido:**
  - Guías paso a paso por rol
  - Funcionalidades comunes
  - Preguntas frecuentes (FAQ)
  - Soporte técnico
  - Screenshots y ejemplos

### 5. **Documentación de Negocio** (`5_DOCUMENTACION_NEGOCIO.html`)
- **Tipo:** Ejecutivo/Estratégico
- **Audiencia:** Directivos, stakeholders de negocio
- **Contenido:**
  - Resumen ejecutivo
  - Objetivos y alcance del proyecto
  - Beneficios del sistema
  - ROI (Retorno de Inversión)
  - Métricas del proyecto
  - Recomendaciones futuras

### 6. **Guía de Inicio Rápido** (`GUIA_INICIO.html`)
- **Tipo:** Quick Start
- **Audiencia:** Todos los usuarios
- **Contenido:**
  - Pasos rápidos para iniciar el sistema
  - Credenciales de prueba
  - URLs importantes
  - Características principales

### 7. **Instrucciones Detalladas** (`INSTRUCCIONES.html`)
- **Tipo:** Guía técnica
- **Audiencia:** Desarrolladores, administradores
- **Contenido:**
  - Instrucciones paso a paso para setup
  - Configuración de base de datos
  - Inicio de servicios
  - Acceso a la aplicación

---

## 🚀 Inicio Rápido

### Opción 1: Desarrollo Local

```powershell
# 1. Crear base de datos
mysql -u root -p < database/bootstrap.sql

# 2. Iniciar todos los servicios
.\start_all_services.ps1

# 3. Abrir frontend
http://localhost:8080
```

### Opción 2: Kubernetes Local (ArgoCD)

```bash
# Aplicar con ArgoCD
kubectl apply -f k8s/frontend/deployapp.yaml

# Acceder
http://sga.emeday.inc
```

### Opción 3: Azure Kubernetes

```bash
# Conectar a Azure
az aks get-credentials --resource-group tu-rg --name tu-cluster

# Aplicar con Kustomize
kubectl apply -k k8s_internet/frontend/overlays/prod

# Acceder
http://sga.172.189.58.78.nip.io
```

---

## 📊 Características de la Documentación

✅ **Diseño moderno y profesional** con Bootstrap 5  
✅ **Responsive** - Se adapta a cualquier dispositivo  
✅ **Animaciones CSS** para mejor experiencia visual  
✅ **Navegación intuitiva** entre documentos  
✅ **Modales interactivos** para scripts y configuraciones  
✅ **Timeline visual** con fechas reales del proyecto  
✅ **Código con syntax highlighting**  
✅ **Tablas comparativas** y métricas  
✅ **Acordeones para FAQs**  
✅ **Cards interactivas** con hover effects  
✅ **Información real del proyecto** (Git, Docker Hub, K8s, Jira)

---

## 🔗 Recursos del Proyecto

### Repositorios y Registries
- **GitHub:** https://github.com/emedayinc17/notas-hexagonal.git
- **Docker Hub:** https://hub.docker.com/u/emeday17
- **Imagen Frontend:** emeday17/frontend:1.0.0
- **Desarrollador:** Emerson Medina (emedayinc17)

### Estructura de Directorios
```
notas-hexagonal/
├── services/
│   ├── iam-service/          # Puerto 8001
│   ├── academico-service/    # Puerto 8002
│   ├── personas-service/     # Puerto 8003
│   └── notas-service/        # Puerto 8004
├── frontend/                 # Puerto 8080
├── database/
│   └── bootstrap.sql         # Script de inicialización
├── k8s/                      # Kubernetes Local (ArgoCD)
│   ├── frontend/
│   ├── backend/
│   └── monitoreo/
├── k8s_internet/             # Azure Kubernetes
│   ├── frontend/
│   ├── backend/
│   └── monitoreo/
├── shared/                   # Código compartido
├── docs/                     # Documentación
├── start_all_services.ps1    # Script de inicio
├── setup_env.ps1             # Setup de entorno
└── README.md
```

---

## 👥 Credenciales de Prueba

### Administrador
- **Email:** admin@colegio.com
- **Password:** Admin123!
- **Permisos:** Acceso total al sistema

### Docente
- **Email:** docente@colegio.com
- **Password:** Docente123!
- **Permisos:** Gestión de notas de sus clases

### Padre
- **Email:** padre@example.com
- **Password:** Padre123!
- **Permisos:** Consulta de notas de sus hijos

---

## 📈 Métricas del Proyecto (Datos Reales)

### Duración y Equipo
- **Inicio:** 01 Septiembre 2025
- **Fin estimado:** 07 Diciembre 2025
- **Duración total:** ~3 meses (97 días)
- **Equipo:** 5 personas (1 PO, 1 SM, 3 Developers)
- **Metodología:** Scrum con 4 sprints

### Sprints Completados
- ✅ **Sprint 1:** Planificación (17 días) - 100% completado
- ✅ **Sprint 2:** Desarrollo (23 días) - 100% completado
- 🔄 **Sprint 3:** Validación (48 días) - En curso
- 📋 **Sprint 4:** Entrega (36 días) - Pendiente

### Componentes Desarrollados
- **Base de Datos:** 4 esquemas, 26 tablas, 7 vistas
- **Backend:** 4 microservicios, 37+ endpoints REST
- **Frontend:** 1 aplicación web responsive
- **DevOps:** Docker, Kubernetes, ArgoCD
- **Líneas de Código:** ~16,900+

---

## 🛠️ Scripts y Herramientas

### Scripts de Desarrollo
- `start_all_services.ps1` - Inicia todos los microservicios
- `setup_env.ps1` - Configura variables de entorno
- `database/bootstrap.sql` - Inicializa la base de datos

### Scripts de Testing
- `tests/verificar_cruds.py` - Valida operaciones CRUD
- `tests/test_all_endpoints.py` - Test end-to-end completo

### Scripts de Deployment
- `k8s/frontend/deployapp.yaml` - ArgoCD Application
- `k8s_internet/` - Configuración Azure K8s

---

## 📝 Notas Importantes

1. **Todos los documentos están en formato HTML** para fácil visualización en navegador
2. **No se requiere servidor web** - Puedes abrirlos directamente desde el sistema de archivos
3. **Los documentos están interconectados** - Puedes navegar entre ellos fácilmente
4. **La documentación está actualizada** a Diciembre 2025
5. **Versión del sistema:** 1.0.0
6. **Información real del proyecto** incorporada desde Jira.csv
7. **Modales interactivos** para scripts y configuraciones
8. **Timeline visual** con fechas reales de los sprints

---

## 🎯 Guía de Navegación por Rol

### Para Desarrolladores
1. Empieza con: **Documentación de Producto**
2. Luego revisa: **Documentación de Operaciones**
3. Consulta: **Documentación de Proceso** (para entender el desarrollo)

### Para Usuarios Finales
1. Empieza con: **Guía de Inicio Rápido**
2. Luego revisa: **Documentación de Usuario**
3. Consulta: **Instrucciones Detalladas** (si necesitas más ayuda)

### Para Directivos/Stakeholders
1. Empieza con: **Documentación de Negocio**
2. Luego revisa: **Documentación de Proceso**
3. Consulta: **Documentación de Producto** (para detalles técnicos)

### Para DevOps/Administradores
1. Empieza con: **Documentación de Operaciones**
2. Luego revisa: **Documentación de Producto**
3. Consulta: **Instrucciones Detalladas**

---

## 🛠️ Mantenimiento de la Documentación

Para mantener la documentación actualizada:

1. **Actualiza el contenido** en los archivos HTML correspondientes
2. **Mantén la consistencia** en diseño y estructura
3. **Actualiza las fechas** de "última actualización"
4. **Verifica los enlaces** entre documentos y URLs de deployment
5. **Actualiza las métricas** cuando cambien (usar Jira.csv como fuente)
6. **Revisa los modales** para asegurar que los scripts estén actualizados
7. **Valida los enlaces** a GitHub y Docker Hub

---

## 📞 Soporte

Si tienes preguntas sobre la documentación o el sistema:

1. Revisa la **Documentación de Usuario** (sección FAQ)
2. Consulta la **Documentación de Operaciones** (troubleshooting)
3. Revisa el **README.md** principal del proyecto
4. Contacta al administrador del sistema: **emedayinc17**
5. Abre un issue en GitHub: https://github.com/emedayinc17/notas-hexagonal/issues

---

## 📦 Información del Proyecto

- **Nombre:** Sistema de Gestión de Notas
- **Versión:** 1.0.0
- **Desarrollador Principal:** Emerson Medina (emedayinc17)
- **Equipo:** 5 personas (Scrum Team)
- **Duración:** Septiembre - Diciembre 2025 (~3 meses)
- **Estado:** 🔄 En desarrollo (Sprint 3/4)
- **Arquitectura:** Microservicios con Hexagonal Architecture
- **Stack:** Python/FastAPI + MySQL 8 + HTML/CSS/JS + Docker + Kubernetes
- **Repositorio:** https://github.com/emedayinc17/notas-hexagonal.git
- **Docker Hub:** https://hub.docker.com/u/emeday17

---

## 🎓 Recursos Adicionales

### Documentación Técnica
- **Swagger UI IAM:** http://localhost:8001/docs
- **Swagger UI Académico:** http://localhost:8002/docs
- **Swagger UI Personas:** http://localhost:8003/docs
- **Swagger UI Notas:** http://localhost:8004/docs

### Herramientas de Desarrollo
- **Python:** 3.10+
- **FastAPI:** 0.104+
- **MySQL:** 8.0+
- **Docker:** Latest
- **Kubernetes:** 1.28+
- **Git:** Latest

### Patrones y Principios
- **Arquitectura Hexagonal** (Clean Architecture)
- **Domain-Driven Design** (DDD)
- **Microservicios** independientes
- **RESTful APIs** con OpenAPI
- **JWT Authentication** con roles
- **Patrón Outbox** para notificaciones
- **SOLID Principles**

---

**Última actualización:** Diciembre 6, 2025  
**Versión de la documentación:** 1.0.0  
**Estado del proyecto:** 🔄 Sprint 3 en curso - 75% completado  
**Próximo hito:** Pruebas y validación completadas (30/Nov/2025)
