// ============================================
// MIS CLASES - DOCENTE
// ============================================

let clases = [];
let periodos = [];
let cursos = [];
let grados = [];
let secciones = [];
// Paginación para Mis Clases
let misClasesPagination = { page: 1, pageSize: 10, totalPages: 1, totalItems: 0 };
// Evitar redeclaraciones si otros scripts ya definieron `currentUser`
if (typeof currentUser === 'undefined') currentUser = null;

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticación y rol
    if (!requireAuth() || !hasRole('DOCENTE')) {
        showToast('Solo docentes pueden acceder a esta página', 'danger');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
        return;
    }

    currentUser = getUserData();
    loadSidebarMenu();
    updateUserInfo();
    await loadInitialData();
    setupEventListeners();
});

/**
 * Carga datos iniciales
 */
async function loadInitialData() {
    try {
        showLoading('Cargando datos...');

        // Cargar datos en paralelo
        await Promise.all([
            loadPeriodos(),
            loadCursos(),
            loadGrados(),
            loadSecciones()
        ]);

        // Cargar clases después de cargar los filtros
        await loadClases();

        hideLoading();
    } catch (error) {
        console.error('Error loading initial data:', error);
        hideLoading();
        showToast('Error al cargar datos iniciales', 'danger');
    }
}

/**
 * Carga periodos académicos
 */
/**
 * Carga periodos académicos
 */
async function loadPeriodos() {
    try {
        const result = await AcademicoService.listPeriodos();
        if (result.success) {
            // API returns { periodos: [...], total: ... }
            periodos = result.data.periodos || result.data.items || result.data || [];
            populateSelect('filterPeriodo', periodos, 'id', 'nombre', 'Todos los periodos');

            // Auto-seleccionar periodo actual
            const currentYear = new Date().getFullYear();
            const currentPeriod = periodos.find(p => p.año_escolar == currentYear && p.status === 'ACTIVO');

            if (currentPeriod) {
                const select = document.getElementById('filterPeriodo');
                if (select && !select.value) {
                    select.value = currentPeriod.id;
                }
            }
        }
    } catch (error) {
        console.error('Error loading periodos:', error);
    }
}

/**
 * Carga cursos
 */
async function loadCursos() {
    try {
        const result = await AcademicoService.listCursos();
        if (result.success) {
            // API returns { cursos: [...], total: ... }
            cursos = result.data.cursos || result.data.items || result.data || [];
            populateSelect('filterCurso', cursos, 'id', 'nombre', 'Todos los cursos');
        }
    } catch (error) {
        console.error('Error loading cursos:', error);
    }
}

/**
 * Carga grados
 */
async function loadGrados() {
    try {
        const result = await AcademicoService.listGrados();
        if (result.success) {
            // API returns { grados: [...], total: ... }
            grados = result.data.grados || result.data.items || result.data || [];
        }
    } catch (error) {
        console.error('Error loading grados:', error);
    }
}

/**
 * Carga secciones
 */
async function loadSecciones() {
    try {
        const result = await AcademicoService.listSecciones();
        if (result.success) {
            // API returns { secciones: [...], total: ... }
            secciones = result.data.secciones || result.data.items || result.data || [];
        }
    } catch (error) {
        console.error('Error loading secciones:', error);
    }
}

/**
 * Carga las clases del docente actual
 */
async function loadClases() {
    try {
        showLoading('Cargando clases...');

        const periodoId = document.getElementById('filterPeriodo').value;
        const cursoId = document.getElementById('filterCurso').value;

        // Obtener clases asignadas al docente
        const result = await AcademicoService.getClasesDocente();
        hideLoading();

        if (result.success) {
            let allClases = result.data.clases || result.data || [];

            // Filtrar localmente por periodo y curso si es necesario
            clases = allClases.filter(clase => {
                if (periodoId && String(clase.periodo_id) !== String(periodoId)) return false;
                if (cursoId && String(clase.curso_id) !== String(cursoId)) return false;
                return true;
            });

            // Inicializar paginación
            misClasesPagination.page = 1;
            misClasesPagination.pageSize = 10; // default
            misClasesPagination.totalItems = clases.length;
            misClasesPagination.totalPages = Math.max(1, Math.ceil(misClasesPagination.totalItems / misClasesPagination.pageSize));

            displayClasesPage();
        } else {
            showToast('Error al cargar clases', 'danger');
        }
    } catch (error) {
        console.error('Error loading clases:', error);
        hideLoading();
        showToast('Error al cargar clases', 'danger');
    }
}

/**
 * Muestra las clases en la tabla
 */
function displayClases() {
    const tbody = document.getElementById('clasesTableBody');

    const items = Array.from(arguments)[0] || clases;

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No se encontraron clases asignadas
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = items.map(clase => {
        const curso = cursos.find(c => c.id === clase.curso_id) || {};
        const periodo = periodos.find(p => p.id === clase.periodo_id) || {};
        const seccion = secciones.find(s => s.id === clase.seccion_id) || {};
        const grado = grados.find(g => g.id === seccion.grado_id) || {};

        return `
            <tr>
                <td><strong>${curso.nombre || 'N/A'}</strong></td>
                <td>${grado.nombre || 'N/A'}</td>
                <td>${seccion.nombre || 'N/A'}</td>
                <td><small>${periodo.nombre || 'N/A'}</small></td>
                <td><span class="badge bg-primary">Ver alumnos</span></td>
                <td><small>${clase.horario || 'No asignado'}</small></td>
                <td>${clase.status === 'ACTIVA' ? '<span class="badge bg-success">Activa</span>' : '<span class="badge bg-secondary">Inactiva</span>'}</td>
                <td>
                    <a href="notas.html?clase_id=${clase.id}" class="btn btn-sm btn-outline-primary" title="Ver notas">
                        <i class="bi bi-clipboard-check"></i>
                    </a>
                    <button class="btn btn-sm btn-outline-info" onclick="verAlumnos('${clase.id}')" title="Ver alumnos">
                        <i class="bi bi-people"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Renderiza la página actual de clases (usa `misClasesPagination` para fragmentar `clases`)
 */
function displayClasesPage() {
    const start = (misClasesPagination.page - 1) * misClasesPagination.pageSize;
    const pageItems = clases.slice(start, start + misClasesPagination.pageSize);
    displayClases(pageItems);
    renderMisClasesPagination();
}

function renderMisClasesPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const page = misClasesPagination.page || 1;
    const total = misClasesPagination.totalPages || 1;
    const totalItems = misClasesPagination.totalItems || 0;

    container.innerHTML = '';
    container.className = 'd-flex justify-content-between align-items-center mt-3';

    const left = document.createElement('div');
    left.className = 'pagination-left';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-sm btn-outline-primary me-2';
    prevBtn.disabled = page <= 1;
    prevBtn.textContent = '« Prev';
    prevBtn.onclick = () => {
        if (misClasesPagination.page > 1) {
            misClasesPagination.page = Math.max(1, misClasesPagination.page - 1);
            displayClasesPage();
        }
    };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-sm btn-outline-primary ms-2';
    nextBtn.disabled = page >= total;
    nextBtn.textContent = 'Next »';
    nextBtn.onclick = () => {
        if (misClasesPagination.page < total) {
            misClasesPagination.page = Math.min(total, misClasesPagination.page + 1);
            displayClasesPage();
        }
    };

    const info = document.createElement('span');
    info.className = 'mx-2 text-muted';
    info.textContent = `Página ${page} de ${total} • ${totalItems} clases`;

    left.appendChild(prevBtn);
    left.appendChild(info);
    left.appendChild(nextBtn);

    // No mostrar selector de tamaño (UX: fixed 10)
    const right = document.createElement('div');
    right.className = 'pagination-right text-muted';

    container.appendChild(left);
    container.appendChild(right);
}

/**
 * Ver alumnos de una clase
 */
async function verAlumnos(claseId) {
    try {
        showLoading('Cargando alumnos...');

        const result = await PersonasService.getAlumnosPorClase(claseId);
        hideLoading();

        if (result.success) {
            const alumnos = result.data.alumnos || [];

            if (alumnos.length === 0) {
                showToast('No hay alumnos matriculados en esta clase', 'warning');
                return;
            }

            // Mostrar modal con la lista de alumnos
            mostrarModalAlumnos(alumnos, claseId);
        } else {
            showToast('Error al cargar alumnos: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Error getting alumnos:', error);
        hideLoading();
        showToast('Error al cargar alumnos', 'danger');
    }
}

/**
 * Mostrar modal con lista de alumnos
 */
function mostrarModalAlumnos(alumnos, claseId) {
    // Crear modal dinámicamente
    const modalHtml = `
        <div class="modal fade" id="modalAlumnos" tabindex="-1" aria-labelledby="modalAlumnosLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalAlumnosLabel">
                            <i class="bi bi-people me-2"></i>Alumnos Matriculados (${alumnos.length})
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombres</th>
                                        <th>Apellidos</th>
                                        <th>DNI</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${alumnos.map(alumno => `
                                        <tr>
                                            <td><strong>${alumno.codigo_alumno}</strong></td>
                                            <td>${alumno.nombres}</td>
                                            <td>${alumno.apellidos}</td>
                                            <td>${alumno.dni || 'N/A'}</td>
                                            <td>
                                                <span class="badge ${alumno.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                                                    ${alumno.status}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <a href="notas.html?clase_id=${claseId}" class="btn btn-primary">
                            <i class="bi bi-clipboard-check me-1"></i>Gestionar Notas
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    const existingModal = document.getElementById('modalAlumnos');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalAlumnos'));
    modal.show();

    // Limpiar modal cuando se cierre
    document.getElementById('modalAlumnos').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Sidebar collapse
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function () {
            document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
        });
    }

    // Filtros
    document.getElementById('filterPeriodo').addEventListener('change', loadClases);
    document.getElementById('filterCurso').addEventListener('change', loadClases);
}

/**
 * Actualiza información del usuario en el navbar
 */
function updateUserInfo() {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userInitialsEl = document.getElementById('userInitials');

    if (userNameEl) userNameEl.textContent = currentUser.username;
    if (userRoleEl) {
        userRoleEl.textContent = 'DOCENTE';
        userRoleEl.className = 'badge bg-info';
    }
    if (userInitialsEl) userInitialsEl.textContent = getInitials(currentUser.username);
}

/**
 * Carga el menú del sidebar
 */
function loadSidebarMenu() {
    const menuItems = [
        { page: '../pages/dashboard.html', label: 'Dashboard', icon: 'grid-fill', active: false },
        { page: 'mis-clases.html', label: 'Mis Clases', icon: 'door-open-fill', active: true },
        { page: 'notas.html', label: 'Gestionar Notas', icon: 'clipboard-check', active: false }
    ];

    const sidebarMenu = document.getElementById('sidebarMenu');
    sidebarMenu.innerHTML = menuItems.map(item => `
        <li>
            <a href="${item.page}" class="${item.active ? 'active' : ''}">
                <i class="bi bi-${item.icon}"></i>
                <span class="menu-text">${item.label}</span>
            </a>
        </li>
    `).join('');
}
