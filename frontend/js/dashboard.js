// ============================================
// DASHBOARD MAIN LOGIC
// ============================================

let currentUser = null;
let currentRole = null;

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticación
    if (!requireAuth()) return;

    // Cargar datos del usuario
    await loadUserData();

    // Configurar sidebar
    setupSidebar();

    // Cargar contenido inicial del dashboard
    loadDashboardContent();

    // Setup sidebar collapse
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function () {
            document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
        });
    }
});

/**
 * Carga los datos del usuario actual
 */
async function loadUserData() {
    currentUser = getUserData();
    currentRole = currentUser?.rol?.nombre;

    if (!currentUser) {
        logout();
        return;
    }

    // Actualizar UI con datos del usuario
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userInitialsEl = document.getElementById('userInitials');

    if (userNameEl) userNameEl.textContent = currentUser.username;
    if (userRoleEl) userRoleEl.textContent = currentRole;
    if (userInitialsEl) userInitialsEl.textContent = getInitials(currentUser.username);

    // Aplicar clase de badge según rol
    if (userRoleEl) {
        userRoleEl.className = 'badge';
        if (currentRole === 'ADMIN') userRoleEl.classList.add('bg-danger');
        else if (currentRole === 'DOCENTE') userRoleEl.classList.add('bg-info');
        else if (currentRole === 'PADRE') userRoleEl.classList.add('bg-warning');
    }

    // Cargar notificaciones si es PADRE
    if (currentRole === 'PADRE') {
        await loadNotifications();
    }

    // Configurar modal de perfil
    setupPerfilModal();
}

/**
 * Configura el menú del sidebar según el rol
 */
function setupSidebar() {
    const menuItems = getMenuItemsByRole(currentRole);
    const sidebarMenu = document.getElementById('sidebarMenu');

    sidebarMenu.innerHTML = menuItems.map(item => `
        <li>
            <a href="#" data-page="${item.page}" class="${item.active ? 'active' : ''}">
                <i class="bi bi-${item.icon}"></i>
                <span class="menu-text">${item.label}</span>
            </a>
        </li>
    `).join('');

    // Event listeners para navegación
    sidebarMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const page = this.dataset.page;
            navigateTo(page);

            // Actualizar active
            sidebarMenu.querySelectorAll('a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * Retorna los items del menú según el rol
 */
function getMenuItemsByRole(role) {
    const menus = {
        'ADMIN': [
            { page: 'home', label: 'Dashboard', icon: 'grid-fill', active: true },
            { page: 'grados', label: 'Grados', icon: 'bookmark-fill', active: false },
            { page: 'cursos', label: 'Cursos', icon: 'book-fill', active: false },
            { page: 'secciones', label: 'Secciones', icon: 'collection-fill', active: false },
            { page: 'periodos', label: 'Periodos', icon: 'calendar-range-fill', active: false },
            { page: 'clases', label: 'Clases', icon: 'door-open-fill', active: false },
            { page: 'alumnos', label: 'Alumnos', icon: 'people-fill', active: false },
            { page: 'matriculas', label: 'Matrículas', icon: 'journal-check', active: false },
            { page: 'usuarios', label: 'Usuarios', icon: 'person-gear', active: false },
            { page: 'notas', label: 'Notas', icon: 'clipboard-check', active: false }
        ],
        'DOCENTE': [
            { page: 'home', label: 'Dashboard', icon: 'grid-fill', active: true },
            { page: 'mis-clases', label: 'Mis Clases', icon: 'door-open-fill', active: false },
            { page: 'notas', label: 'Gestionar Notas', icon: 'clipboard-check', active: false }
        ],
        'PADRE': [
            { page: 'home', label: 'Dashboard', icon: 'grid-fill', active: true },
            { page: 'notas-hijos', label: 'Notas de mis Hijos', icon: 'card-checklist', active: false }
        ]
    };

    return menus[role] || [];
}

/**
 * Navega a una página específica
 */
function navigateTo(page) {
    // Para páginas CRUD, redirigir a páginas dedicadas
    const crudPages = {
        'grados': 'grados.html',
        'cursos': 'cursos.html',
        'secciones': 'secciones.html',
        'periodos': 'periodos.html',
        'clases': 'clases.html',
        'alumnos': 'alumnos.html',
        'matriculas': 'matriculas.html',
        'usuarios': 'usuarios.html',
        'notas': 'notas.html',
        'mis-clases': 'mis-clases.html',
        'notas-hijos': 'notas-hijos.html'
    };

    if (crudPages[page]) {
        window.location.href = crudPages[page];
        return;
    }

    // Para home, quedarse en dashboard
    if (page === 'home') {
        loadDashboardContent();
    }
}

/**
 * Carga el contenido del dashboard según el rol
 */
function loadDashboardContent() {
    const content = document.getElementById('contentArea');

    // Crear un div para el contenido dinámico
    let dynamicContent = content.querySelector('.dynamic-dashboard-content');
    if (!dynamicContent) {
        dynamicContent = document.createElement('div');
        dynamicContent.className = 'dynamic-dashboard-content';
        content.appendChild(dynamicContent);
    }

    if (currentRole === 'ADMIN') {
        loadAdminDashboard(dynamicContent);
    } else if (currentRole === 'DOCENTE') {
        loadDocenteDashboard(dynamicContent);
    } else if (currentRole === 'PADRE') {
        loadPadreDashboard(dynamicContent);
    }
}

/**
 * Dashboard para ADMIN
 */
async function loadAdminDashboard(container) {
    container.innerHTML = `
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="stat-card card fade-in">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon primary me-3">
                            <i class="bi bi-people-fill"></i>
                        </div>
                        <div>
                            <div class="stat-number" id="totalAlumnos">-</div>
                            <div class="stat-label">Total Alumnos</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card card fade-in">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon success me-3">
                            <i class="bi bi-book-fill"></i>
                        </div>
                        <div>
                            <div class="stat-number" id="totalCursos">-</div>
                            <div class="stat-label">Cursos Activos</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card card fade-in">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon warning me-3">
                            <i class="bi bi-door-open-fill"></i>
                        </div>
                        <div>
                            <div class="stat-number" id="totalClases">-</div>
                            <div class="stat-label">Clases</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card card fade-in">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon danger me-3">
                            <i class="bi bi-person-badge-fill"></i>
                        </div>
                        <div>
                            <div class="stat-number" id="totalUsuarios">-</div>
                            <div class="stat-label">Usuarios</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-md-12">
                <div class="card shadow-soft">
                    <div class="card-body">
                        <h5 class="card-title mb-4">
                            <i class="bi bi-graph-up me-2"></i>Bienvenido al Sistema de Gestión de Notas
                        </h5>
                        <p class="text-muted">Panel de administración. Utiliza el menú lateral para navegar por las diferentes secciones.</p>
                        <div class="row mt-4">
                            <div class="col-md-4">
                                <div class="d-grid">
                                    <button class="btn btn-primary" onclick="navigateTo('alumnos')">
                                        <i class="bi bi-people-fill me-2"></i>Gestionar Alumnos
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-grid">
                                    <button class="btn btn-info" onclick="navigateTo('clases')">
                                        <i class="bi bi-door-open-fill me-2"></i>Gestionar Clases
                                    </button>
                            </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-grid">
                                    <button class="btn btn-success" onclick="navigateTo('matriculas')">
                                        <i class="bi bi-journal-check me-2"></i>Matrículas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Cargar estadísticas
    loadAdminStats();
}

/**
 * Carga estadísticas para el dashboard de admin
 */
async function loadAdminStats() {
    try {
        const [alumnos, cursos, clases, usuarios] = await Promise.all([
            PersonasService.listAlumnos(0, 100), // Aumentar límite para obtener total real
            AcademicoService.listCursos(0, 100),
            AcademicoService.listClases(0, 100),
            IAMService.listUsers(0, 100)
        ]);

        if (alumnos.success) {
            // Priorizar el campo 'total' si existe, sino contar elementos del array
            const totalAlumnos = alumnos.data.total || 
                                (alumnos.data.alumnos && alumnos.data.alumnos.length) || 
                                (Array.isArray(alumnos.data) ? alumnos.data.length : 0);
            document.getElementById('totalAlumnos').textContent = totalAlumnos;
        }
        
        if (cursos.success) {
            const totalCursos = cursos.data.total || 
                              (cursos.data.cursos && cursos.data.cursos.length) || 
                              (Array.isArray(cursos.data) ? cursos.data.length : 0);
            document.getElementById('totalCursos').textContent = totalCursos;
        }
        
        if (clases.success) {
            const totalClases = clases.data.total || 
                              (clases.data.clases && clases.data.clases.length) || 
                              (Array.isArray(clases.data) ? clases.data.length : 0);
            document.getElementById('totalClases').textContent = totalClases;
        }
        
        if (usuarios.success) {
            const totalUsuarios = usuarios.data.total || 
                                 (usuarios.data.usuarios && usuarios.data.usuarios.length) || 
                                 (Array.isArray(usuarios.data) ? usuarios.data.length : 0);
            document.getElementById('totalUsuarios').textContent = totalUsuarios;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Mostrar 0 en caso de error
        ['totalAlumnos', 'totalCursos', 'totalClases', 'totalUsuarios'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    }
}

/**
 * Dashboard para DOCENTE
 */
async function loadDocenteDashboard(container) {
    container.innerHTML = `
        <div class="row g-4">
            <div class="col-md-12">
                <div class="card shadow-soft">
                    <div class="card-body">
                        <h5 class="card-title mb-4">
                            <i class="bi bi-person-video3 me-2"></i>Bienvenido, Docente
                        </h5>
                        <p class="text-muted">Gestiona tus clases y registra las notas de tus alumnos.</p>
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <div class="d-grid">
                                    <button class="btn btn-primary btn-lg" onclick="navigateTo('mis-clases')">
                                        <i class="bi bi-door-open-fill me-2"></i>Ver Mis Clases
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-grid">
                                    <button class="btn btn-success btn-lg" onclick="navigateTo('notas')">
                                        <i class="bi bi-pencil-square me-2"></i>Gestionar Notas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Dashboard para PADRE
 */
async function loadPadreDashboard(container) {
    // Obtener ID del usuario actual
    const user = getUserData();
    const padreId = user?.id;

    container.innerHTML = `
        <div class="row g-4 mb-4">
            <div class="col-md-12">
                <div class="card shadow-soft bg-gradient-primary text-white">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-people-fill" style="font-size: 3rem;"></i>
                        <h3 class="mt-3 mb-2">Bienvenido, Padre/Tutor</h3>
                        <p class="mb-0">Consulta el rendimiento académico de tus hijos</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card shadow-soft hover-lift" style="cursor: pointer;" onclick="navigateTo('notas-hijos')">
                    <div class="card-body text-center py-4">
                        <i class="bi bi-card-checklist text-primary" style="font-size: 3rem;"></i>
                        <h5 class="mt-3 mb-2">Notas de mis Hijos</h5>
                        <p class="text-muted mb-3">Consulta las calificaciones y el progreso académico</p>
                        <button class="btn btn-primary">
                            <i class="bi bi-eye me-2"></i>Ver Notas
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card shadow-soft">
                    <div class="card-body">
                        <h6 class="text-muted mb-3">
                            <i class="bi bi-info-circle me-2"></i>Información Importante
                        </h6>
                        <ul class="list-unstyled mb-0">
                            <li class="mb-2">
                                <i class="bi bi-check-circle text-success me-2"></i>
                                Acceso a todas las notas de tus hijos
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-check-circle text-success me-2"></i>
                                Filtros por periodo y curso
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-check-circle text-success me-2"></i>
                                Información del docente y fecha de evaluación
                            </li>
                            <li class="mb-0">
                                <i class="bi bi-check-circle text-success me-2"></i>
                                Estadísticas de rendimiento
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row g-4" id="hijosResumenContainer">
            <div class="col-md-12">
                <div class="card shadow-soft">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-person-lines-fill me-2"></i>Mis Hijos
                        </h5>
                    </div>
                    <div class="card-body">
                        <div id="hijosListado">
                            <div class="text-center py-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Cargando...</span>
                                </div>
                                <p class="mt-2 text-muted">Cargando información de hijos...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Cargar información de los hijos
    await loadHijosResumen();
}

/**
 * Carga el resumen de los hijos del padre
 */
async function loadHijosResumen() {
    try {
        // Obtener hijos del padre actual usando el nuevo servicio
        const result = await PadreService.getMisHijos();
        const hijosListado = document.getElementById('hijosListado');

        if (!result.success) {
            hijosListado.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar información de hijos
                </div>
            `;
            return;
        }

        const hijos = result.data.hijos || result.data || [];
        
        if (hijos.length === 0) {
            hijosListado.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #ddd;"></i>
                    <p class="mt-2 text-muted">No tienes hijos registrados en el sistema</p>
                    <p class="text-muted small">Contacta con la administración si necesitas registrar un hijo</p>
                </div>
            `;
            return;
        }

        // Mostrar listado de hijos
        hijosListado.innerHTML = `
            <div class="row g-3">
                ${hijos.map(hijo => `
                    <div class="col-md-6">
                        <div class="card border-left-primary">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="card-title mb-1">${hijo.apellidos} ${hijo.nombres}</h6>
                                        <p class="text-muted small mb-2">
                                            <i class="bi bi-card-text me-1"></i>
                                            ${hijo.dni || 'Sin DNI'}
                                        </p>
                                        <span class="badge ${hijo.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                                            ${hijo.status || 'ACTIVO'}
                                        </span>
                                    </div>
                                    <div class="text-end">
                                        <span class="badge bg-info mb-2">${hijo.tipo_relacion || 'HIJO/A'}</span>
                                        <br>
                                        <button class="btn btn-outline-primary btn-sm" 
                                                onclick="verNotasHijo('${hijo.id}')">
                                            <i class="bi bi-eye me-1"></i>Ver Notas
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading hijos resumen:', error);
        const hijosListado = document.getElementById('hijosListado');
        if (hijosListado) {
            hijosListado.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar información: ${error.message}
                </div>
            `;
        }
    }
}

/**
 * Navegar a ver notas de un hijo específico
 */
function verNotasHijo(hijoId) {
    // Guardar el ID del hijo seleccionado en localStorage para la página de notas
    localStorage.setItem('selectedHijoId', hijoId);
    navigateTo('notas-hijos');
}

/**
 * Carga notificaciones para PADRE
 */
async function loadNotifications() {
    if (currentRole !== 'PADRE') return;

    const result = await NotasService.getAlertas(0, 10);
    if (result.success) {
        const alertasNoLeidas = result.data.alertas?.filter(a => !a.leida) || [];
        const count = alertasNoLeidas.length;

        const badge = document.getElementById('notificationCount');
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Placeholder functions - Se implementarán en archivos separados
function loadGradosPage() { loadCRUDPage('Grados', 'grados'); }
function loadCursosPage() { loadCRUDPage('Cursos', 'cursos'); }
function loadSeccionesPage() { loadCRUDPage('Secciones', 'secciones'); }
function loadPeriodosPage() { loadCRUDPage('Periodos', 'periodos'); }
function loadClasesPage() { loadCRUDPage('Clases', 'clases'); }
function loadAlumnosPage() { loadCRUDPage('Alumnos', 'alumnos'); }

function loadMatriculasPage() { loadCRUDPage('Matrículas', 'matriculas'); }
function loadUsuariosPage() { loadCRUDPage('Usuarios', 'usuarios'); }
function loadMisClasesPage() { loadCRUDPage('Mis Clases', 'mis-clases'); }
function loadRegistroNotasPage() { loadCRUDPage('Registro de Notas', 'registro-notas'); }
function loadConsultarNotasPage() { loadCRUDPage('Consultar Notas', 'consultar-notas'); }
function loadNotasHijosPage() { loadCRUDPage('Notas de mis Hijos', 'notas-hijos'); }
function loadAlertasPage() { loadCRUDPage('Alertas', 'alertas'); }

/**
 * Página CRUD genérica
 */
function loadCRUDPage(title, entity) {
    document.getElementById('pageTitle').textContent = title;
    const content = document.getElementById('contentArea');

    content.innerHTML = `
        <div class="card shadow-soft">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-table me-2"></i>${title}</h5>
                <button class="btn btn-light btn-sm" id="btnNuevo">
                    <i class="bi bi-plus-lg me-1"></i>Nuevo
                </button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <input type="text" class="form-control" placeholder="Buscar..." id="searchInput">
                </div>
                <div class="table-responsive">
                    <table class="table table-custom">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Información</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                            <tr>
                                <td colspan="4" class="text-center">
                                    <div class="spinner-border text-primary" role="status"></div>
                                    <p class="mt-2">Cargando ${title.toLowerCase()}...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div id="paginationContainer"></div>
            </div>
        </div>
    `;

    // Aquí iría la lógica específica para cargar datos de cada entidad
    setTimeout(() => {
        document.getElementById('tableBody').innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    Implementación específica de ${title} en desarrollo
                </td>
            </tr>
        `;
    }, 500);
}

/**
 * Configura el modal de perfil con los datos del usuario
 */
function setupPerfilModal() {
    const modal = document.getElementById('modalPerfil');
    if (!modal) return;

    modal.addEventListener('show.bs.modal', function () {
        const user = getUserData();
        if (!user) return;

        // Avatar con iniciales
        const initials = getInitials(user.username);
        document.getElementById('modalUserInitials').textContent = initials;

        // Nombre y rol
        document.getElementById('modalUserName').textContent = user.username;
        document.getElementById('modalUsername').textContent = user.username;

        const role = user.rol?.nombre;
        const roleEl = document.getElementById('modalUserRole');
        if (roleEl) {
            roleEl.textContent = role;
            roleEl.className = 'badge';
            if (role === 'ADMIN') roleEl.classList.add('bg-danger');
            else if (role === 'DOCENTE') roleEl.classList.add('bg-info');
            else if (role === 'PADRE') roleEl.classList.add('bg-warning');
        }

        // Nombre descriptivo del rol
        const roleNames = {
            'ADMIN': 'Administrador del Sistema',
            'DOCENTE': 'Docente',
            'PADRE': 'Padre de Familia'
        };
        document.getElementById('modalRoleName').textContent = roleNames[role] || role;

        // Email (si está disponible)
        document.getElementById('modalEmail').textContent = user.email || 'No disponible';

        // Último acceso (fecha actual)
        const now = new Date();
        document.getElementById('modalLastLogin').textContent = now.toLocaleString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    });
}
