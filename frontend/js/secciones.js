// ============================================
// GESTIÓN DE SECCIONES
// ============================================

let secciones = [];
let filteredSecciones = [];
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
    document.getElementById('formSeccion').addEventListener('submit', handleSubmitSeccion);
    document.getElementById('searchInput').addEventListener('input', debounce(() => { currentPage = 1; applyFilters(); }, 300));
    document.getElementById('filterGrado').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('filterAnio').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('filterEstado').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Reset form when modal closes
    document.getElementById('modalSeccion').addEventListener('hidden.bs.modal', function () {
        document.getElementById('formSeccion').reset();
        document.getElementById('seccionId').value = '';
        document.getElementById('modalSeccionTitle').textContent = 'Nueva Sección';
        document.getElementById('seccionAnio').value = new Date().getFullYear();
        const divEstado = document.getElementById('divSeccionEstado');
        divEstado.classList.add('d-none');
        divEstado.style.removeProperty('display'); // Limpiar estilo inline
        document.getElementById('seccionEstado').value = 'ACTIVO';
    });
});

/**
 * Inicializa los datos necesarios
 */
async function initializeData() {
    await loadGrados();
    await loadSecciones();
    populateYearFilters();
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
        { page: 'secciones.html', label: 'Secciones', icon: 'collection-fill', active: true },
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
 * Carga los grados desde el API
 */
async function loadGrados() {
    try {
        const result = await AcademicoService.listGrados(0, 100);

        if (result.success) {
            grados = (result.data.grados || result.data).filter(g => g.status === 'ACTIVO');

            // Llenar selectores
            const gradoSelects = ['seccionGrado', 'filterGrado'];
            gradoSelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                const isFilter = selectId.startsWith('filter');

                select.innerHTML = isFilter
                    ? '<option value="">Todos los grados</option>'
                    : '<option value="">Seleccionar grado...</option>';

                grados.forEach(grado => {
                    select.innerHTML += `<option value="${grado.id}">${grado.nombre}</option>`;
                });
            });
        }
    } catch (error) {
        console.error('Error loading grados:', error);
        showToast('Error', 'No se pudieron cargar los grados', 'error');
    }
}

/**
 * Pobla los filtros de año
 */
function populateYearFilters() {
    const currentYear = new Date().getFullYear();
    const filterAnio = document.getElementById('filterAnio');

    filterAnio.innerHTML = '<option value="">Todos los años</option>';

    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
        filterAnio.innerHTML += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
    }
}

/**
 * Carga las secciones desde el API
 */
async function loadSecciones() {
    const tbody = document.getElementById('seccionesTableBody');
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
        const result = await AcademicoService.listSecciones(0, 1000);

        if (result.success) {
            secciones = result.data.secciones || result.data;

            // Calcular matriculados por sección si la API no lo provee
            try {
                const clasesResp = await AcademicoService.listClases(0, 1000);
                const matriculasResp = await PersonasService.listMatriculas(0, 1000);

                const clases = (clasesResp.success && (clasesResp.data.clases || clasesResp.data)) || [];
                const matriculas = (matriculasResp.success && (matriculasResp.data.matriculas || matriculasResp.data)) || [];

                // Mapear claseId -> seccionId
                const claseToSeccion = {};
                clases.forEach(c => { if (c.id) claseToSeccion[c.id] = c.seccion_id; });

                // Contar matriculas por clase
                const matriculasPorClase = {};
                matriculas.forEach(m => {
                    const claseId = m.clase_id || m.matricula_clase_id || null;
                    if (!claseId) return;
                    matriculasPorClase[claseId] = (matriculasPorClase[claseId] || 0) + 1;
                });

                // Agregar propiedad alumnos_count a cada sección
                const matriculadosPorSeccion = {};
                Object.keys(matriculasPorClase).forEach(claseId => {
                    const seccionId = claseToSeccion[claseId];
                    if (!seccionId) return;
                    matriculadosPorSeccion[seccionId] = (matriculadosPorSeccion[seccionId] || 0) + matriculasPorClase[claseId];
                });

                secciones = secciones.map(s => ({
                    ...s,
                    alumnos_count: s.alumnos_count || matriculadosPorSeccion[s.id] || 0
                }));
            } catch (err) {
                console.warn('No se pudieron calcular matriculados por sección:', err);
            }

            applyFilters();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading secciones:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar secciones: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar las secciones', 'error');
    }
}

/**
 * Aplica filtros y paginación
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const gradoId = document.getElementById('filterGrado').value;
    const anio = document.getElementById('filterAnio').value;
    const estado = document.getElementById('filterEstado').value;

    // Filtrar
    filteredSecciones = secciones.filter(s => {
        let match = true;

        if (searchTerm) {
            match = match && s.nombre.toLowerCase().includes(searchTerm);
        }

        if (gradoId) {
            match = match && s.grado_id === gradoId;
        }

        if (anio) {
            match = match && s.año_escolar === parseInt(anio);
        }

        if (estado) {
            match = match && s.status === estado;
        }

        return match;
    });

    // Ordenar por grado y nombre
    filteredSecciones.sort((a, b) => {
        const gradoA = grados.find(g => g.id === a.grado_id);
        const gradoB = grados.find(g => g.id === b.grado_id);

        if (gradoA && gradoB) {
            const ordenCompare = (gradoA.orden || 0) - (gradoB.orden || 0);
            if (ordenCompare !== 0) return ordenCompare;
        }

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
    const tbody = document.getElementById('seccionesTableBody');

    if (filteredSecciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron secciones
                </td>
            </tr>
        `;
        return;
    }

    // Paginación
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredSecciones.slice(start, end);

    tbody.innerHTML = pageData.map(seccion => {
        const grado = grados.find(g => g.id === seccion.grado_id);
        const gradoNombre = grado ? grado.nombre : '<span class="text-muted">Sin grado</span>';
        const matriculados = seccion.alumnos_count || 0;
        const capacidad = seccion.capacidad_maxima || '-';
        const porcentaje = capacidad !== '-' ? Math.round((matriculados / capacidad) * 100) : 0;

        return `
            <tr>
                <td class="fw-bold">${gradoNombre}</td>
                <td><span class="badge bg-primary">${seccion.nombre}</span></td>
                <td><span class="badge bg-dark">${seccion.año_escolar}</span></td>
                <td>${capacidad}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${matriculados}</span>
                        ${capacidad !== '-' ? `
                            <div class="progress flex-grow-1" style="height: 6px; max-width: 100px;">
                                <div class="progress-bar ${porcentaje >= 90 ? 'bg-danger' : porcentaje >= 70 ? 'bg-warning' : 'bg-success'}" 
                                     style="width: ${Math.min(porcentaje, 100)}%"></div>
                            </div>
                            <small class="ms-2 text-muted">${porcentaje}%</small>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <span class="badge ${seccion.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                        ${seccion.status || 'ACTIVO'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editSeccion('${seccion.id}')" 
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSeccion('${seccion.id}')"
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
    const table = document.getElementById('seccionesTableBody');

    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination';
        container.className = 'd-flex justify-content-between align-items-center mt-3';
        const tableElem = table.closest('table') || table.parentElement;
        tableElem.parentNode.insertBefore(container, tableElem.nextSibling);
    }

    const total = filteredSecciones.length;
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
 * Maneja el submit del formulario de sección
 */
async function handleSubmitSeccion(e) {
    e.preventDefault();

    const seccionId = document.getElementById('seccionId').value;
    const seccionData = {
        grado_id: document.getElementById('seccionGrado').value,
        nombre: document.getElementById('seccionNombre').value.trim().toUpperCase(),
        año_escolar: parseInt(document.getElementById('seccionAnio').value),
        capacidad_maxima: parseInt(document.getElementById('seccionCapacidad').value) || null
    };

    // Si es edición, incluir el estado
    if (seccionId) {
        seccionData.status = document.getElementById('seccionEstado').value;

        // Validar si se intenta inactivar con alumnos matriculados
        if (seccionData.status === 'INACTIVO') {
            const seccionActual = secciones.find(s => String(s.id) === String(seccionId));
            console.log('Validando inactivación:', { seccionId, seccionActual });

            if (seccionActual && seccionActual.alumnos_count > 0) {
                showToast(MSG.GENERAL.OPERACION_NO_PERMITIDA, MSG.SECCIONES.ERROR_INACTIVAR_CON_ALUMNOS(seccionActual.alumnos_count), 'error');
                return;
            }
        }
    }

    // Validaciones
    if (!seccionData.grado_id || !seccionData.nombre || !seccionData.año_escolar) {
        showToast(MSG.GENERAL.ERROR, MSG.GENERAL.CAMPOS_REQUERIDOS, 'error');
        return;
    }

    try {
        const result = seccionId
            ? await AcademicoService.updateSeccion(seccionId, seccionData)
            : await AcademicoService.createSeccion(seccionData);

        if (result.success) {
            showToast(MSG.GENERAL.EXITO, seccionId ? MSG.SECCIONES.ACTUALIZAR_EXITO : MSG.SECCIONES.CREAR_EXITO, 'success');

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSeccion'));
            modal.hide();

            // Recargar tabla
            await loadSecciones();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving seccion:', error);
        if (error.message.includes('asociadas') || error.message.includes('Conflict')) {
            showToast(MSG.GENERAL.OPERACION_NO_PERMITIDA, MSG.SECCIONES.ERROR_CONFLICTO_BACKEND, 'warning');
        } else {
            showToast(MSG.GENERAL.ERROR, error.message || MSG.GENERAL.ERROR_GENERICO, 'error');
        }
    }
}

/**
 * Editar sección
 */
function editSeccion(id) {
    const seccion = secciones.find(s => s.id === id);
    if (!seccion) {
        showToast(MSG.GENERAL.ERROR, MSG.SECCIONES.NO_ENCONTRADA, 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('seccionId').value = seccion.id;
    document.getElementById('seccionGrado').value = seccion.grado_id;
    document.getElementById('seccionNombre').value = seccion.nombre;
    document.getElementById('seccionAnio').value = seccion.año_escolar;
    document.getElementById('seccionCapacidad').value = seccion.capacidad_maxima || '';

    // Mostrar y establecer estado
    const divEstado = document.getElementById('divSeccionEstado');
    divEstado.classList.remove('d-none');
    divEstado.style.display = 'block'; // Forzar visibilidad
    document.getElementById('seccionEstado').value = seccion.status || 'ACTIVO';

    // Cambiar título del modal
    document.getElementById('modalSeccionTitle').textContent = MSG.SECCIONES.TITULO_EDITAR;

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalSeccion'));
    modal.show();
}

/**
 * Eliminar sección
 */
async function deleteSeccion(id) {
    const seccion = secciones.find(s => s.id === id);
    if (!seccion) return;

    const grado = grados.find(g => g.id === seccion.grado_id);
    const gradoNombre = grado ? grado.nombre : '';

    // Validar si tiene alumnos matriculados
    if (seccion.alumnos_count > 0) {
        showToast(MSG.GENERAL.OPERACION_NO_PERMITIDA, MSG.SECCIONES.ERROR_ELIMINAR_CON_ALUMNOS(seccion.alumnos_count), 'error');
        return;
    }

    const confirmDelete = await showConfirm(
        MSG.GENERAL.CONFIRM_ELIMINAR_TITULO,
        MSG.GENERAL.CONFIRM_ELIMINAR_MSG(`${gradoNombre} ${seccion.nombre}`)
    );

    if (!confirmDelete) return;

    try {
        // Soft delete
        const result = await AcademicoService.deleteSeccion(id);

        if (result.success) {
            showToast(MSG.GENERAL.EXITO, MSG.SECCIONES.ELIMINAR_EXITO, 'success');
            await loadSecciones();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting seccion:', error);
        showToast('Error', error.message || 'Error al eliminar la sección', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}
