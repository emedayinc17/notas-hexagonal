// ============================================
// GESTIÓN DE CLASES
// ============================================

let clases = [];
let cursos = [];
let secciones = [];
let periodos = [];
let docentes = [];
let grados = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticación y rol ADMIN
    if (!requireAuth()) return;
    if (!requireRole('ADMIN')) {
        showToast('Acceso denegado', 'Solo administradores pueden acceder a esta sección', 'error');
        window.location.href = '/pages/dashboard.html';
        return;
    }

    // Cargar datos del usuario en navbar
    loadUserInfo();

    // Cargar menú del sidebar
    loadSidebarMenu();

    // Cargar datos iniciales
    initializeData();

    // Event listeners
    document.getElementById('formClase').addEventListener('submit', handleSubmitClase);
    document.getElementById('filterCurso').addEventListener('change', loadClases);
    document.getElementById('filterSeccion').addEventListener('change', loadClases);
    document.getElementById('filterPeriodo').addEventListener('change', loadClases);
    document.getElementById('filterEstado').addEventListener('change', loadClases);
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Reset form when modal closes
    document.getElementById('modalClase').addEventListener('hidden.bs.modal', function () {
        document.getElementById('formClase').reset();
        document.getElementById('claseId').value = '';
        document.getElementById('modalClaseTitle').textContent = 'Nueva Clase';
    });
});

/**
 * Inicializa los datos necesarios
 */
async function initializeData() {
    await Promise.all([
        loadCursos(),
        loadSecciones(),
        loadPeriodos(),
        loadDocentes(),
        loadGrados()
    ]);

    // Poblar selects después de cargar todos los datos
    populateSeccionesSelect();

    await loadClases();
}

/**
 * Carga la información del usuario en el navbar
 */
function loadUserInfo() {
    const user = getUserData();
    if (user) {
        document.getElementById('userName').textContent = user.username;
        document.getElementById('userRole').innerHTML = getRoleBadge(user.rol?.nombre);
        document.getElementById('userAvatar').textContent = getInitials(user.username);
    }
}

/**
 * Carga el menú del sidebar
 */
function loadSidebarMenu() {
    const menuItems = [
        { page: 'dashboard.html', label: 'Dashboard', icon: 'grid-fill' },
        { page: 'grados.html', label: 'Grados', icon: 'bookmark-fill' },
        { page: 'cursos.html', label: 'Cursos', icon: 'book-fill' },
        { page: 'secciones.html', label: 'Secciones', icon: 'collection-fill' },
        { page: 'periodos.html', label: 'Periodos', icon: 'calendar-range-fill' },
        { page: 'clases.html', label: 'Clases', icon: 'door-open-fill', active: true },
        { page: 'alumnos.html', label: 'Alumnos', icon: 'people-fill' },
        { page: 'matriculas.html', label: 'Matrículas', icon: 'journal-check' },
        { page: 'usuarios.html', label: 'Usuarios', icon: 'person-gear' },
        { page: 'notas.html', label: 'Notas', icon: 'clipboard-check' }
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

/**
 * Carga los cursos desde el API
 */
async function loadCursos() {
    try {
        const result = await AcademicoService.listCursos(0, 100);

        if (result.success) {
            cursos = (result.data.cursos || result.data).filter(c => c.status === 'ACTIVO');
            populateSelect('claseCurso', cursos, 'nombre');
            populateSelect('filterCurso', cursos, 'nombre', true);
        }
    } catch (error) {
        console.error('Error loading cursos:', error);
    }
}

/**
 * Carga las secciones desde el API
 */
async function loadSecciones() {
    try {
        const result = await AcademicoService.listSecciones(0, 100);

        if (result.success) {
            secciones = (result.data.secciones || result.data).filter(s => s.status === 'ACTIVO');
        }
    } catch (error) {
        console.error('Error loading secciones:', error);
    }
}

/**
 * Carga los grados desde el API
 */
async function loadGrados() {
    try {
        const result = await AcademicoService.listGrados(0, 100);

        if (result.success) {
            grados = (result.data.grados || result.data).filter(g => g.status === 'ACTIVO');
        }
    } catch (error) {
        console.error('Error loading grados:', error);
    }
}

/**
 * Pobla los selectores de secciones con información del grado
 */
function populateSeccionesSelect() {
    const selects = ['claseSeccion', 'filterSeccion'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const isFilter = selectId.startsWith('filter');

        select.innerHTML = isFilter
            ? '<option value="">Todas las secciones</option>'
            : '<option value="">Seleccionar sección...</option>';

        secciones.forEach(seccion => {
            const grado = grados.find(g => g.id === seccion.grado_id);
            const label = grado
                ? `${grado.nombre} ${seccion.nombre} (${seccion.año_escolar})`
                : `${seccion.nombre} (${seccion.año_escolar})`;

            select.innerHTML += `<option value="${seccion.id}">${label}</option>`;
        });
    });
}

/**
 * Carga los periodos desde el API
 */
async function loadPeriodos() {
    try {
        const result = await AcademicoService.listPeriodos(0, 100);

        if (result.success) {
            periodos = (result.data.periodos || result.data).filter(p => p.status === 'ACTIVO');
            populateSelect('clasePeriodo', periodos, 'nombre');
            populateSelect('filterPeriodo', periodos, 'nombre', true);

            // Auto-seleccionar periodo actual
            const currentYear = new Date().getFullYear();
            const currentPeriod = periodos.find(p => p.año_escolar == currentYear && p.status === 'ACTIVO');

            if (currentPeriod) {
                const select = document.getElementById('clasePeriodo');
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
 * Carga los docentes desde el API
 */
async function loadDocentes() {
    try {
        const result = await IAMService.listUsers(0, 100);

        if (result.success) {
            const users = result.data.users || result.data;
            docentes = users.filter(u => u.rol?.nombre === 'DOCENTE' && u.is_active);

            const select = document.getElementById('claseDocente');
            select.innerHTML = '<option value="">Seleccionar docente...</option>';

            docentes.forEach(docente => {
                select.innerHTML += `<option value="${docente.id}">${docente.username}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading docentes:', error);
    }
}

/**
 * Pobla un selector con datos
 */
function populateSelect(selectId, data, labelField, isFilter = false) {
    const select = document.getElementById(selectId);

    select.innerHTML = isFilter
        ? `<option value="">Todos</option>`
        : `<option value="">Seleccionar...</option>`;

    data.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${item[labelField]}</option>`;
    });
}

/**
 * Carga las clases desde el API
 */
async function loadClases() {
    const cursoId = document.getElementById('filterCurso').value;
    const seccionId = document.getElementById('filterSeccion').value;
    const periodoId = document.getElementById('filterPeriodo').value;
    const estado = document.getElementById('filterEstado').value;

    const tbody = document.getElementById('clasesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const result = await AcademicoService.listClases(0, 100);

        if (result.success) {
            clases = result.data.clases || result.data;

            // Aplicar filtros
            let filteredClases = clases.filter(c => {
                let match = true;

                if (cursoId) match = match && c.curso_id === cursoId;
                if (seccionId) match = match && c.seccion_id === seccionId;
                if (periodoId) match = match && c.periodo_id === periodoId;
                if (estado) match = match && c.status === estado;

                return match;
            });

            // Ordenar por curso
            filteredClases.sort((a, b) => {
                const cursoA = cursos.find(c => c.id === a.curso_id);
                const cursoB = cursos.find(c => c.id === b.curso_id);

                if (cursoA && cursoB) {
                    const nombreA = cursoA.nombre || '';
                    const nombreB = cursoB.nombre || '';
                    return nombreA.localeCompare(nombreB);
                }
                return 0;
            });

            displayClases(filteredClases);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading clases:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar clases: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar las clases', 'error');
    }
}

/**
 * Muestra las clases en la tabla
 */
function displayClases(clasesToDisplay) {
    const tbody = document.getElementById('clasesTableBody');

    if (clasesToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron clases
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clasesToDisplay.map(clase => {
        const curso = cursos.find(c => c.id === clase.curso_id);
        const seccion = secciones.find(s => s.id === clase.seccion_id);
        const periodo = periodos.find(p => p.id === clase.periodo_id);
        const docente = docentes.find(d => d.id === (clase.docente_user_id || clase.docente_id));
        const grado = grados.find(g => g.id === seccion?.grado_id);

        const cursoNombre = curso ? curso.nombre : '<span class="text-muted">Sin curso</span>';
        const seccionNombre = (grado && seccion)
            ? `${grado.nombre} ${seccion.nombre}`
            : (seccion ? seccion.nombre : '<span class="text-muted">Sin sección</span>');
        const periodoNombre = periodo ? periodo.nombre : '<span class="text-muted">Sin periodo</span>';
        const docenteNombre = docente ? docente.username : '<span class="text-muted">Sin asignar</span>';
        const alumnosCount = clase.alumnos_count || 0;

        return `
            <tr>
                <td class="fw-bold">${cursoNombre}</td>
                <td><span class="badge bg-primary">${seccionNombre}</span></td>
                <td><span class="badge bg-info">${periodoNombre}</span></td>
                <td>
                    <i class="bi bi-person-badge me-1"></i>
                    ${docenteNombre}
                </td>
                <td>
                    <span class="badge bg-secondary">${alumnosCount} alumnos</span>
                </td>
                <td>
                    <span class="badge ${clase.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                        ${clase.status || 'ACTIVO'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editClase('${clase.id}')" 
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteClase('${clase.id}')"
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Maneja el submit del formulario de clase
 */
async function handleSubmitClase(e) {
    e.preventDefault();

    const claseId = document.getElementById('claseId').value;
    const claseData = {
        curso_id: document.getElementById('claseCurso').value,
        seccion_id: document.getElementById('claseSeccion').value,
        periodo_id: document.getElementById('clasePeriodo').value,
        docente_user_id: document.getElementById('claseDocente').value
    };

    // Validaciones
    if (!claseData.curso_id || !claseData.seccion_id || !claseData.periodo_id || !claseData.docente_user_id) {
        showToast('Error', 'Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        const result = claseId
            ? await AcademicoService.updateClase(claseId, claseData)
            : await AcademicoService.createClase(claseData);

        if (result.success) {
            showToast('Éxito', claseId ? 'Clase actualizada correctamente' : 'Clase creada correctamente', 'success');

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalClase'));
            modal.hide();

            // Recargar tabla
            await loadClases();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving clase:', error);
        showToast('Error', error.message || 'Error al guardar la clase', 'error');
    }
}

/**
 * Editar clase
 */
function editClase(id) {
    const clase = clases.find(c => c.id === id);
    if (!clase) {
        showToast('Error', 'Clase no encontrada', 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('claseId').value = clase.id;
    document.getElementById('claseCurso').value = clase.curso_id;
    document.getElementById('claseSeccion').value = clase.seccion_id;
    document.getElementById('clasePeriodo').value = clase.periodo_id;
    document.getElementById('claseDocente').value = (clase.docente_user_id || clase.docente_id || '');

    // Cambiar título del modal
    document.getElementById('modalClaseTitle').textContent = 'Editar Clase';

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalClase'));
    modal.show();
}

/**
 * Eliminar clase
 */
async function deleteClase(id) {
    const clase = clases.find(c => c.id === id);
    if (!clase) return;

    const curso = cursos.find(c => c.id === clase.curso_id);
    const seccion = secciones.find(s => s.id === clase.seccion_id);

    const confirmDelete = await showConfirm(
        '¿Eliminar clase?',
        `¿Estás seguro de eliminar esta clase? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
        const result = await AcademicoService.deleteClase(id);

        if (result.success) {
            showToast('Éxito', 'Clase eliminada correctamente', 'success');
            await loadClases();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting clase:', error);
        showToast('Error', error.message || 'Error al eliminar la clase', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}
