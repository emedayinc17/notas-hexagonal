// ============================================
// GESTIÓN DE CLASES
// ============================================

let clases = [];
let filteredClases = [];
let cursos = [];
let secciones = [];
let periodos = [];
let docentes = [];
let grados = [];
let currentPage = 1;
let itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticación y rol ADMIN
    if (!requireAuth()) return;
    if (!requireRole('ADMIN')) {
        showToast('Acceso denegado', 'Solo administradores pueden acceder a esta sección', 'error');
        window.location.href = '/pages/dashboard.html';
        return;
    }

    // Cargar configuración
    if (typeof AppSettings !== 'undefined') {
        itemsPerPage = AppSettings.getSetting('pagination.itemsPerPage', 10);
    }

    // Cargar datos del usuario en navbar
    loadUserInfo();

    // Cargar menú del sidebar
    loadSidebarMenu();

    // Cargar datos iniciales
    initializeData();

    // Event listeners
    document.getElementById('formClase').addEventListener('submit', handleSubmitClase);
    document.getElementById('filterCurso').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('filterSeccion').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('filterPeriodo').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('filterEstado').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Reset form when modal closes
    document.getElementById('modalClase').addEventListener('hidden.bs.modal', function () {
        document.getElementById('formClase').reset();
        document.getElementById('claseId').value = '';
        document.getElementById('modalClaseTitle').textContent = 'Nueva Clase';
        const estadoDiv = document.getElementById('divEstadoClase');
        if (estadoDiv) estadoDiv.style.display = 'none';
    });

    const btnNuevaClase = document.getElementById('btnNuevaClase');
    if (btnNuevaClase) {
        btnNuevaClase.addEventListener('click', function () {
            loadDocentes().catch(e => console.warn('loadDocentes failed on new class click:', e));
        });
    }
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
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const userInitialsEl = document.getElementById('userInitials');

        if (userNameEl) userNameEl.textContent = user.username;
        if (userInitialsEl) userInitialsEl.textContent = getInitials(user.username);

        // Aplicar clase de badge según rol
        if (userRoleEl) {
            const role = user.rol?.nombre;
            userRoleEl.textContent = role;
            userRoleEl.className = 'badge';
            if (role === 'ADMIN') userRoleEl.classList.add('bg-danger');
            else if (role === 'DOCENTE') userRoleEl.classList.add('bg-info');
            else if (role === 'PADRE') userRoleEl.classList.add('bg-warning');
        }
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
        { page: 'usuarios.html', label: 'Usuarios', icon: 'person-gear' }
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
            // IAM returns 'status' and 'rol' inside the user object (see to_dict_safe)
            docentes = users.filter(u => u.rol && u.rol.nombre === 'DOCENTE' && String(u.status).toUpperCase() === 'ACTIVO');

            const select = document.getElementById('claseDocente');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar docente...</option>';
                docentes.forEach(docente => {
                    const label = (docente.nombres || docente.apellidos)
                        ? `${(docente.nombres || '').trim()} ${(docente.apellidos || '').trim()}`.trim()
                        : (docente.username || docente.email || 'Docente');
                    select.innerHTML += `<option value="${docente.id}">${label}</option>`;
                });
            }
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
        const result = await AcademicoService.listClases(0, 1000);

        if (result.success) {
            clases = result.data.clases || result.data;
            applyFilters();
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
 * Aplica filtros y paginación
 */
function applyFilters() {
    const cursoId = document.getElementById('filterCurso').value;
    const seccionId = document.getElementById('filterSeccion').value;
    const periodoId = document.getElementById('filterPeriodo').value;
    const estado = document.getElementById('filterEstado').value;

    // Filtrar
    filteredClases = clases.filter(c => {
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

    renderTable();
    renderPagination();
}

/**
 * Renderiza la tabla con la página actual
 */
function renderTable() {
    const tbody = document.getElementById('clasesTableBody');

    if (filteredClases.length === 0) {
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

    // Paginación
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredClases.slice(start, end);

    tbody.innerHTML = pageData.map(clase => {
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

        // Priorizar información verificada del backend
        let docenteNombre = '<span class="text-muted">Sin asignar</span>';
        if (clase.docente_nombre) {
            docenteNombre = clase.docente_nombre;
        } else if (clase.docente_username) {
            docenteNombre = clase.docente_username;
        } else if (docente) {
            docenteNombre = docente.username;
        }

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
 * Renderiza la paginación
 */
function renderPagination() {
    let container = document.getElementById('pagination');
    const table = document.getElementById('clasesTableBody');

    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination';
        container.className = 'd-flex justify-content-between align-items-center mt-3';
        const tableElem = table.closest('table') || table.parentElement;
        tableElem.parentNode.insertBefore(container, tableElem.nextSibling);
    }

    const total = filteredClases.length;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    if (currentPage > totalPages) currentPage = totalPages;

    container.innerHTML = '';

    // Lado izquierdo: Botones y Texto
    const left = document.createElement('div');
    left.className = 'pagination-left';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-sm btn-outline-primary me-2';
    prevBtn.textContent = '« Prev';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); renderPagination(); } };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-sm btn-outline-primary ms-2';
    nextBtn.textContent = 'Next »';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTable(); renderPagination(); } };

    const pageInfo = document.createElement('span');
    pageInfo.className = 'mx-2 text-muted';
    pageInfo.textContent = `Página ${currentPage} de ${totalPages} • ${total} registros`;

    left.appendChild(prevBtn);
    left.appendChild(pageInfo);
    left.appendChild(nextBtn);

    // Lado derecho: Selector de tamaño
    const right = document.createElement('div');
    right.className = 'pagination-right d-flex align-items-center';

    const label = document.createElement('small');
    label.className = 'me-2 text-muted';
    label.textContent = 'Tamaño:';

    const select = document.createElement('select');
    select.className = 'form-select form-select-sm';
    select.style.width = 'auto';
    [10, 15, 20, 50].forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = `${n}`;
        if (n === Number(itemsPerPage)) opt.selected = true;
        select.appendChild(opt);
    });
    select.onchange = function() {
        itemsPerPage = Number(this.value);
        currentPage = 1;
        renderTable();
        renderPagination();
    };

    right.appendChild(label);
    right.appendChild(select);

    container.appendChild(left);
    container.appendChild(right);
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

    if (claseId) {
        claseData.status = document.getElementById('claseEstado').value;

        // Validar dependencias si se intenta inactivar
        if (claseData.status === 'INACTIVO') {
            const clase = clases.find(c => c.id === claseId);
            if (clase) {
                const alumnosCount = clase.alumnos_count || 0;
                if (alumnosCount > 0) {
                    showToast('No se puede inactivar', `La clase tiene ${alumnosCount} alumnos inscritos. Debe retirar a los alumnos primero.`, 'warning');
                    return;
                }
            }
        }
    }

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
            // Handle conflict (duplicate) with a friendly message
            if (result.status === 409) {
                const serverMsg = result.error || 'Ya existe una clase para ese curso, sección y periodo';
                showToast('Conflict', serverMsg, 'warning');
                return;
            }

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
    (async () => {
        const clase = clases.find(c => c.id === id);
        if (!clase) {
            showToast('Error', 'Clase no encontrada', 'error');
            return;
        }

        // Asegurar que los docentes están cargados antes de mostrar el modal
        try {
            await loadDocentes();
        } catch (e) {
            console.warn('loadDocentes failed before editClase:', e);
        }

        // Llenar formulario
        document.getElementById('claseId').value = clase.id;
        document.getElementById('claseCurso').value = clase.curso_id;
        document.getElementById('claseSeccion').value = clase.seccion_id;
        document.getElementById('clasePeriodo').value = clase.periodo_id;

        // Establecer valor del docente
        const docenteId = clase.docente_user_id || clase.docente_id || '';
        const docenteSelect = document.getElementById('claseDocente');
        if (docenteSelect) {
            // Intentar establecer el valor
            docenteSelect.value = docenteId;

            // Verificar si se seleccionó correctamente
            if (docenteSelect.value !== docenteId && docenteId) {
                console.warn('Docente ID not found in select options:', docenteId);
                // Agregar opción temporalmente para mostrar el valor actual
                const option = document.createElement('option');
                option.value = docenteId;
                // Usar nombre del docente si está disponible, sino username, sino ID
                let docenteLabel = clase.docente_nombre || clase.docente_username || 'Docente Actual';
                option.text = docenteLabel;
                option.selected = true;
                docenteSelect.add(option);
                docenteSelect.value = docenteId; // Re-intentar selección
            }
        }

        // Cambiar título del modal
        document.getElementById('modalClaseTitle').textContent = 'Editar Clase';

        // Mostrar estado actual
        const estadoDiv = document.getElementById('divEstadoClase');
        const estadoSelect = document.getElementById('claseEstado');
        if (estadoDiv && estadoSelect) {
            estadoDiv.style.display = 'block'; // Ensure it's visible (it's in a row now)
            // Normalize status: DB might have "ACTIVA", select expects "ACTIVO"
            let currentStatus = (clase.status || 'ACTIVO').toUpperCase();
            if (currentStatus === 'ACTIVA') currentStatus = 'ACTIVO';
            estadoSelect.value = currentStatus;
        }

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('modalClase'));
        modal.show();
    })();
}

/**
 * Cambiar estado de la clase (Activar/Inactivar)
 */
async function toggleClaseStatus(id, currentStatus) {
    const clase = clases.find(c => c.id === id);
    if (!clase) return;

    const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const actionVerb = newStatus === 'ACTIVO' ? 'activar' : 'inactivar';

    // Validar dependencias antes de inactivar
    if (newStatus === 'INACTIVO') {
        const alumnosCount = clase.alumnos_count || 0;
        if (alumnosCount > 0) {
            showToast('No se puede inactivar', `La clase tiene ${alumnosCount} alumnos inscritos. Debe retirar a los alumnos primero.`, 'warning');
            return;
        }
    }

    const confirm = await showConfirm(
        `¿${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} clase?`,
        `¿Estás seguro de ${actionVerb} esta clase?`
    );

    if (!confirm) return;

    try {
        // Usamos updateClase para cambiar el estado
        // Nota: El backend debe soportar actualización parcial o enviamos todos los datos
        const updateData = {
            curso_id: clase.curso_id,
            seccion_id: clase.seccion_id,
            periodo_id: clase.periodo_id,
            docente_user_id: clase.docente_user_id,
            status: newStatus
        };

        const result = await AcademicoService.updateClase(id, updateData);

        if (result.success) {
            showToast('Éxito', `Clase ${newStatus === 'ACTIVO' ? 'activada' : 'inactivada'} correctamente`, 'success');
            await loadClases();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error(`Error ${actionVerb} clase:`, error);
        showToast('Error', error.message || `Error al ${actionVerb} la clase`, 'error');
    }
}

/**
 * Eliminar clase (Soft Delete)
 */
async function deleteClase(id) {
    const clase = clases.find(c => c.id === id);
    if (!clase) return;

    // Validar dependencias
    const alumnosCount = clase.alumnos_count || 0;
    if (alumnosCount > 0) {
        showToast('No se puede eliminar', `La clase tiene ${alumnosCount} alumnos inscritos. Debe retirar a los alumnos primero.`, 'warning');
        return;
    }

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
