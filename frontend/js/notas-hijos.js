// ============================================
// NOTAS DE MIS HIJOS - PADRE
// ============================================

let currentUser = null;
let hijos = [];
let notas = [];
let periodos = [];
let cursos = [];
let clases = [];
let matriculas = [];

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticación y rol
    if (!requireAuth() || !hasRole('PADRE')) {
        showToast('Solo padres pueden acceder a esta página', 'danger');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
        return;
    }

    currentUser = getUserData();
    loadSidebarMenu();
    updateUserInfo();
    await loadInitialData();
    setupEventListeners();

    // Verificar si hay un hijo pre-seleccionado desde el dashboard
    const selectedHijoId = localStorage.getItem('selectedHijoId');
    if (selectedHijoId) {
        // Esperar un momento para que se carguen los hijos
        setTimeout(() => {
            const selectHijo = document.getElementById('selectHijo');
            if (selectHijo) {
                selectHijo.value = selectedHijoId;
                selectHijo.dispatchEvent(new Event('change'));
                localStorage.removeItem('selectedHijoId'); // Limpiar después de usar
            }
        }, 500);
    }
});

/**
 * Carga datos iniciales
 */
async function loadInitialData() {
    try {
        showLoading('Cargando datos...');

        await Promise.all([
            loadHijos(),
            loadPeriodos(),
            loadCursos(),
            loadClases()
        ]);

        hideLoading();
    } catch (error) {
        console.error('Error loading initial data:', error);
        hideLoading();
        showToast('Error al cargar datos iniciales', 'danger');
    }
}

/**
 * Carga los hijos del padre actual
 */
async function loadHijos() {
    try {
        // Obtener hijos del padre actual usando el nuevo endpoint
        const result = await PadreService.getMisHijos();
        if (result.success) {
            hijos = result.data.hijos || result.data || [];

            const selectHijo = document.getElementById('selectHijo');
            if (hijos.length === 0) {
                selectHijo.innerHTML = '<option value="">No tienes hijos registrados</option>';
            } else {
                selectHijo.innerHTML = '<option value="">Selecciona un hijo...</option>' +
                    hijos.map(hijo =>
                        `<option value="${hijo.id}">${hijo.apellidos} ${hijo.nombres}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading hijos:', error);
        showToast('Error al cargar hijos', 'danger');
    }
}

/**
 * Carga periodos
 */
/**
 * Carga periodos
 */
async function loadPeriodos() {
    try {
        const result = await AcademicoService.getPeriodos();
        if (result.success) {
            periodos = result.data.items || result.data || [];
            populateSelect('selectPeriodo', periodos, 'id', 'nombre', 'Todos los periodos');

            // Auto-seleccionar periodo actual
            const currentYear = new Date().getFullYear();
            const currentPeriod = periodos.find(p => p.año_escolar == currentYear && p.status === 'ACTIVO');

            if (currentPeriod) {
                const select = document.getElementById('selectPeriodo');
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
        const result = await AcademicoService.getCursos();
        if (result.success) {
            cursos = result.data.items || result.data || [];
        }
    } catch (error) {
        console.error('Error loading cursos:', error);
    }
}

/**
 * Carga clases
 */
async function loadClases() {
    try {
        const result = await AcademicoService.getClases();
        if (result.success) {
            clases = result.data.items || result.data || [];
        }
    } catch (error) {
        console.error('Error loading clases:', error);
    }
}

/**
 * Carga las notas del hijo seleccionado
 */
async function loadNotas() {
    const hijoId = document.getElementById('selectHijo').value;
    const periodoId = document.getElementById('selectPeriodo').value;
    const cursoId = document.getElementById('selectCurso').value;

    if (!hijoId) {
        showToast('Selecciona un hijo', 'warning');
        return;
    }

    try {
        showLoading('Cargando notas...');

        // Cargar matrículas del alumno
        const matriculasResult = await PersonasService.getMatriculas();
        if (matriculasResult.success) {
            matriculas = (matriculasResult.data.items || matriculasResult.data || [])
                .filter(m => m.alumno_id === hijoId);
        }

        // Cargar notas
        const result = await NotasService.getNotas();
        hideLoading();

        if (result.success) {
            let allNotas = result.data.items || result.data || [];

            // Filtrar notas del hijo seleccionado a través de las matrículas
            const matriculaIds = matriculas.map(m => m.id);
            notas = allNotas.filter(nota => matriculaIds.includes(nota.matricula_clase_id));

            // Aplicar filtros adicionales
            if (periodoId || cursoId) {
                notas = notas.filter(nota => {
                    const matricula = matriculas.find(m => m.id === nota.matricula_clase_id);
                    const clase = clases.find(c => c.id === matricula?.clase_id);

                    if (periodoId && clase?.periodo_id !== periodoId) return false;
                    if (cursoId && clase?.curso_id !== cursoId) return false;
                    return true;
                });
            }

            displayNotas();
            updateStats();
        } else {
            showToast('Error al cargar notas', 'danger');
        }
    } catch (error) {
        console.error('Error loading notas:', error);
        hideLoading();
        showToast('Error al cargar notas', 'danger');
    }
}

/**
 * Muestra las notas en la tabla
 */
function displayNotas() {
    const tbody = document.getElementById('notasTableBody');

    if (notas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No se encontraron notas
                </td>
            </tr>
        `;
        document.getElementById('statsCards').style.display = 'none';
        return;
    }

    tbody.innerHTML = notas.map(nota => {
        const matricula = matriculas.find(m => m.id === nota.matricula_clase_id) || {};
        const clase = clases.find(c => c.id === matricula.clase_id) || {};
        const curso = cursos.find(c => c.id === clase.curso_id) || {};
        const periodo = periodos.find(p => p.id === clase.periodo_id) || {};

        const valorNota = nota.valor_numerico || nota.valor_literal || 'N/A';
        const peso = nota.peso_porcentaje ? `${nota.peso_porcentaje}%` : 'N/A';
        const fecha = nota.fecha_evaluacion ? formatDateShort(nota.fecha_evaluacion) : 'N/A';

        // Color según nota
        let badgeClass = 'bg-secondary';
        if (nota.valor_numerico) {
            if (nota.valor_numerico >= 14) badgeClass = 'bg-success';
            else if (nota.valor_numerico >= 11) badgeClass = 'bg-warning';
            else badgeClass = 'bg-danger';
        }

        return `
            <tr>
                <td><strong>${curso.nombre || 'N/A'}</strong></td>
                <td><small>${periodo.nombre || 'N/A'}</small></td>
                <td><span class="badge bg-info">${nota.tipo_evaluacion_id?.substring(0, 10) || 'N/A'}</span></td>
                <td><span class="badge ${badgeClass} fs-6">${valorNota}</span></td>
                <td>${peso}</td>
                <td><small>${fecha}</small></td>
                <td><small>Docente ${clase.docente_id?.substring(0, 8) || 'N/A'}</small></td>
            </tr>
        `;
    }).join('');

    document.getElementById('statsCards').style.display = 'flex';
}

/**
 * Actualiza las estadísticas
 */
function updateStats() {
    if (notas.length === 0) return;

    // Total de notas
    document.getElementById('statTotalNotas').textContent = notas.length;

    // Promedio
    const notasNumericas = notas.filter(n => n.valor_numerico).map(n => n.valor_numerico);
    const promedio = notasNumericas.length > 0
        ? (notasNumericas.reduce((a, b) => a + b, 0) / notasNumericas.length).toFixed(2)
        : '0.00';
    document.getElementById('statPromedio').textContent = promedio;

    // Mejor nota
    const mejorNota = notasNumericas.length > 0
        ? Math.max(...notasNumericas).toFixed(2)
        : '0.00';
    document.getElementById('statMejorNota').textContent = mejorNota;

    // Cursos únicos
    const cursosUnicos = new Set();
    notas.forEach(nota => {
        const matricula = matriculas.find(m => m.id === nota.matricula_clase_id);
        const clase = clases.find(c => c.id === matricula?.clase_id);
        if (clase?.curso_id) cursosUnicos.add(clase.curso_id);
    });
    document.getElementById('statCursos').textContent = cursosUnicos.size;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Cambio de hijo
    document.getElementById('selectHijo').addEventListener('change', () => {
        const hijoId = document.getElementById('selectHijo').value;
        if (hijoId) {
            loadCursosDisponibles(hijoId);
            loadNotas();
        }
    });

    // Cambio de filtros
    document.getElementById('selectPeriodo').addEventListener('change', loadNotas);
    document.getElementById('selectCurso').addEventListener('change', loadNotas);

    // Sidebar collapse
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function () {
            document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
        });
    }
}

/**
 * Carga los cursos disponibles para el hijo seleccionado
 */
async function loadCursosDisponibles(hijoId) {
    const selectCurso = document.getElementById('selectCurso');
    selectCurso.innerHTML = '<option value="">Todos los cursos</option>';

    // Obtener clases donde está matriculado el hijo
    const matriculasHijo = matriculas.filter(m => m.alumno_id === hijoId);
    const clasesIds = matriculasHijo.map(m => m.clase_id);
    const cursosIds = new Set();

    clasesIds.forEach(claseId => {
        const clase = clases.find(c => c.id === claseId);
        if (clase?.curso_id) cursosIds.add(clase.curso_id);
    });

    const cursosDisponibles = cursos.filter(c => cursosIds.has(c.id));
    cursosDisponibles.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso.id;
        option.textContent = curso.nombre;
        selectCurso.appendChild(option);
    });
}

/**
 * Actualiza información del usuario
 */
function updateUserInfo() {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userInitialsEl = document.getElementById('userInitials');

    if (userNameEl) userNameEl.textContent = currentUser.username;
    if (userRoleEl) {
        userRoleEl.textContent = 'PADRE';
        userRoleEl.className = 'badge bg-warning';
    }
    if (userInitialsEl) userInitialsEl.textContent = getInitials(currentUser.username);
}

/**
 * Carga el menú del sidebar
 */
function loadSidebarMenu() {
    const menuItems = [
        { page: 'dashboard.html', label: 'Dashboard', icon: 'grid-fill', active: false },
        { page: 'notas-hijos.html', label: 'Notas de mis Hijos', icon: 'card-checklist', active: true }
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
