// ============================================
// GESTIÓN DE CURSOS
// ============================================

let cursos = []; // Todos los cursos cargados
let filteredCursos = []; // Cursos filtrados
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

    // Cargar cursos
    loadCursos();

    // Event listeners
    document.getElementById('formCurso').addEventListener('submit', handleSubmitCurso);
    document.getElementById('searchInput').addEventListener('input', debounce(() => { currentPage = 1; applyFilters(); }, 300));
    document.getElementById('filterEstado').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Reset form when modal closes
    document.getElementById('modalCurso').addEventListener('hidden.bs.modal', function () {
        document.getElementById('formCurso').reset();
        document.getElementById('cursoId').value = '';
        document.getElementById('modalCursoTitle').textContent = 'Nuevo Curso';
        document.getElementById('divCursoEstado').classList.add('d-none');
        document.getElementById('cursoEstado').value = 'ACTIVO';
    });
});

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
        { page: 'cursos.html', label: 'Cursos', icon: 'book-fill', active: true },
        { page: 'secciones.html', label: 'Secciones', icon: 'collection-fill' },
        { page: 'periodos.html', label: 'Periodos', icon: 'calendar-range-fill' },
        { page: 'clases.html', label: 'Clases', icon: 'door-open-fill' },
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
    const tbody = document.getElementById('cursosTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        // Cargar todos (limit alto) para paginación en cliente
        const result = await AcademicoService.listCursos(0, 1000);

        if (result.success) {
            cursos = result.data.cursos || result.data;
            applyFilters();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading cursos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar cursos: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar los cursos', 'error');
    }
}

/**
 * Aplica filtros y paginación
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estado = document.getElementById('filterEstado').value;

    // Filtrar
    filteredCursos = cursos.filter(c => {
        let match = true;

        if (searchTerm) {
            match = match && (
                c.nombre.toLowerCase().includes(searchTerm) ||
                c.codigo.toLowerCase().includes(searchTerm)
            );
        }

        if (estado) {
            match = match && c.status === estado;
        }

        return match;
    });

    // Ordenar por nombre
    filteredCursos.sort((a, b) => {
        const nombreA = a.nombre || '';
        const nombreB = b.nombre || '';
        return nombreA.localeCompare(nombreB);
    });

    renderTable();
    renderPagination();
}

/**
 * Renderiza la tabla con la página actual
 */
function renderTable() {
    const tbody = document.getElementById('cursosTableBody');

    if (filteredCursos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron cursos
                </td>
            </tr>
        `;
        return;
    }

    // Paginación
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredCursos.slice(start, end);

    tbody.innerHTML = pageData.map(curso => `
        <tr>
            <td><span class="badge bg-dark">${curso.codigo}</span></td>
            <td class="fw-bold">${curso.nombre}</td>
            <td>${curso.descripcion || '<span class="text-muted">Sin descripción</span>'}</td>
            <td>
                ${curso.horas_semanales ? `<span class="badge bg-info">${curso.horas_semanales} hrs</span>` : '<span class="text-muted">-</span>'}
            </td>
            <td>
                <span class="badge ${curso.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                    ${curso.status || 'ACTIVO'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCurso('${curso.id}')" 
                        title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCurso('${curso.id}')"
                        title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Renderiza la paginación
 */
function renderPagination() {
    let container = document.getElementById('pagination');
    const table = document.getElementById('cursosTableBody');

    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination';
        container.className = 'd-flex justify-content-between align-items-center mt-3';
        const tableElem = table.closest('table') || table.parentElement;
        tableElem.parentNode.insertBefore(container, tableElem.nextSibling);
    }

    const total = filteredCursos.length;
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
 * Maneja el submit del formulario de curso
 */
async function handleSubmitCurso(e) {
    e.preventDefault();

    const cursoId = document.getElementById('cursoId').value;
    const cursoData = {
        codigo: document.getElementById('cursoCodigo').value.trim().toUpperCase(),
        nombre: document.getElementById('cursoNombre').value.trim(),
        descripcion: document.getElementById('cursoDescripcion').value.trim() || null,
        horas_semanales: parseInt(document.getElementById('cursoHorasSemanales').value) || null
    };

    // Si es edición, incluir el estado
    if (cursoId) {
        cursoData.status = document.getElementById('cursoEstado').value;
    }

    // Validaciones
    if (!cursoData.codigo || !cursoData.nombre) {
        showToast('Error', 'Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        const result = cursoId
            ? await AcademicoService.updateCurso(cursoId, cursoData)
            : await AcademicoService.createCurso(cursoData);

        if (result.success) {
            showToast('Éxito', cursoId ? 'Curso actualizado correctamente' : 'Curso creado correctamente', 'success');

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCurso'));
            modal.hide();

            // Recargar tabla
            await loadCursos();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving curso:', error);
        showToast('Error', error.message || 'Error al guardar el curso', 'error');
    }
}

/**
 * Editar curso
 */
function editCurso(id) {
    const curso = cursos.find(c => c.id === id);
    if (!curso) {
        showToast('Error', 'Curso no encontrado', 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('cursoId').value = curso.id;
    document.getElementById('cursoCodigo').value = curso.codigo;
    document.getElementById('cursoNombre').value = curso.nombre;
    document.getElementById('cursoDescripcion').value = curso.descripcion || '';
    document.getElementById('cursoHorasSemanales').value = curso.horas_semanales || '';

    // Mostrar y establecer estado
    document.getElementById('divCursoEstado').classList.remove('d-none');
    document.getElementById('cursoEstado').value = curso.status || 'ACTIVO';

    // Cambiar título del modal
    document.getElementById('modalCursoTitle').textContent = 'Editar Curso';

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalCurso'));
    modal.show();
}

/**
 * Eliminar curso
 */
async function deleteCurso(id) {
    const curso = cursos.find(c => c.id === id);
    if (!curso) return;

    const confirmDelete = await showConfirm(
        '¿Eliminar curso?',
        `¿Estás seguro de eliminar el curso "${curso.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
        // Soft delete
        const result = await AcademicoService.deleteCurso(id);

        if (result.success) {
            showToast('Éxito', 'Curso eliminado correctamente', 'success');
            await loadCursos();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting curso:', error);
        showToast('Error', error.message || 'Error al eliminar el curso', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}
