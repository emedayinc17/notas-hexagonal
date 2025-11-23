// ============================================
// GESTIÓN DE PERIODOS
// ============================================

let periodos = [];
let tiposPeriodo = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
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
    document.getElementById('formPeriodo').addEventListener('submit', handleSubmitPeriodo);
    document.getElementById('searchInput').addEventListener('input', debounce(loadPeriodos, 500));
    document.getElementById('filterTipoPeriodo').addEventListener('change', loadPeriodos);
    document.getElementById('filterAnio').addEventListener('change', loadPeriodos);
    document.getElementById('filterEstado').addEventListener('change', loadPeriodos);
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Validación de fechas
    document.getElementById('periodoFechaInicio').addEventListener('change', validateDates);
    document.getElementById('periodoFechaFin').addEventListener('change', validateDates);

    // Reset form when modal closes
    document.getElementById('modalPeriodo').addEventListener('hidden.bs.modal', function() {
        document.getElementById('formPeriodo').reset();
        document.getElementById('periodoId').value = '';
        document.getElementById('modalPeriodoTitle').textContent = 'Nuevo Periodo';
    });
});

/**
 * Inicializa los datos necesarios
 */
async function initializeData() {
    await loadTiposPeriodo();
    await loadPeriodos();
    populateYearFilters();
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
        { page: 'periodos.html', label: 'Periodos', icon: 'calendar-range-fill', active: true },
        { page: 'clases.html', label: 'Clases', icon: 'door-open-fill' },
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
 * Carga los tipos de periodo desde el API
 */
async function loadTiposPeriodo() {
    try {
        const result = await AcademicoService.listTiposPeriodo(0, 50);
        
        if (result.success) {
            tiposPeriodo = (result.data.tipos_periodo || result.data).filter(t => t.status === 'ACTIVO');
            
            // Llenar selectores
            const tipoSelects = ['periodoTipo', 'filterTipoPeriodo'];
            tipoSelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                const isFilter = selectId.startsWith('filter');
                
                select.innerHTML = isFilter 
                    ? '<option value="">Todos los tipos</option>' 
                    : '<option value="">Seleccionar tipo...</option>';
                
                tiposPeriodo.forEach(tipo => {
                    select.innerHTML += `<option value="${tipo.id}">${tipo.nombre}</option>`;
                });
            });
        }
    } catch (error) {
        console.error('Error loading tipos periodo:', error);
        showToast('Error', 'No se pudieron cargar los tipos de periodo', 'error');
    }
}

/**
 * Pobla los filtros de año
 */
function populateYearFilters() {
    const currentYear = new Date().getFullYear();
    const filterAnio = document.getElementById('filterAnio');
    
    filterAnio.innerHTML = '<option value="">Todos</option>';
    
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
        filterAnio.innerHTML += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
    }
}

/**
 * Valida las fechas del periodo
 */
function validateDates() {
    const fechaInicio = document.getElementById('periodoFechaInicio').value;
    const fechaFin = document.getElementById('periodoFechaFin').value;
    
    if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        if (fin <= inicio) {
            document.getElementById('periodoFechaFin').setCustomValidity('La fecha de fin debe ser posterior a la fecha de inicio');
        } else {
            document.getElementById('periodoFechaFin').setCustomValidity('');
        }
    }
}

/**
 * Carga los periodos desde el API
 */
async function loadPeriodos() {
    const searchTerm = document.getElementById('searchInput').value;
    const tipoId = document.getElementById('filterTipoPeriodo').value;
    const anio = document.getElementById('filterAnio').value;
    const estado = document.getElementById('filterEstado').value;

    const tbody = document.getElementById('periodosTableBody');
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
        const result = await AcademicoService.listPeriodos(0, 100);
        
        if (result.success) {
            periodos = result.data.periodos || result.data;
            
            // Aplicar filtros
            let filteredPeriodos = periodos.filter(p => {
                let match = true;
                
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    match = match && p.nombre.toLowerCase().includes(searchLower);
                }
                
                if (tipoId) {
                    match = match && p.tipo_periodo_id === tipoId;
                }
                
                if (anio) {
                    const year = new Date(p.fecha_inicio).getFullYear();
                    match = match && year === parseInt(anio);
                }
                
                if (estado) {
                    match = match && p.status === estado;
                }
                
                return match;
            });

            // Ordenar por fecha de inicio (más reciente primero)
            filteredPeriodos.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));

            displayPeriodos(filteredPeriodos);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading periodos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar periodos: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar los periodos', 'error');
    }
}

/**
 * Muestra los periodos en la tabla
 */
function displayPeriodos(periodosToDisplay) {
    const tbody = document.getElementById('periodosTableBody');
    
    if (periodosToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron periodos
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = periodosToDisplay.map(periodo => {
        const tipo = tiposPeriodo.find(t => t.id === periodo.tipo_periodo_id);
        const tipoNombre = tipo ? tipo.nombre : '<span class="text-muted">Sin tipo</span>';
        
        const fechaInicio = formatDate(periodo.fecha_inicio);
        const fechaFin = formatDate(periodo.fecha_fin);
        
        // Calcular duración en días
        const inicio = new Date(periodo.fecha_inicio);
        const fin = new Date(periodo.fecha_fin);
        const diffTime = Math.abs(fin - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Determinar si el periodo está activo actualmente
        const today = new Date();
        const isCurrentPeriod = today >= inicio && today <= fin;
        
        return `
            <tr ${isCurrentPeriod ? 'class="table-active"' : ''}>
                <td><span class="badge bg-info">${tipoNombre}</span></td>
                <td class="fw-bold">
                    ${periodo.nombre}
                    ${isCurrentPeriod ? '<span class="badge bg-success ms-2">Actual</span>' : ''}
                </td>
                <td>${fechaInicio}</td>
                <td>${fechaFin}</td>
                <td><span class="badge bg-secondary">${diffDays} días</span></td>
                <td>
                    <span class="badge ${periodo.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                        ${periodo.status || 'ACTIVO'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editPeriodo('${periodo.id}')" 
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePeriodo('${periodo.id}')"
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Maneja el submit del formulario de periodo
 */
async function handleSubmitPeriodo(e) {
    e.preventDefault();

    const periodoId = document.getElementById('periodoId').value;
    const periodoData = {
        tipo_periodo_id: document.getElementById('periodoTipo').value,
        nombre: document.getElementById('periodoNombre').value.trim(),
        fecha_inicio: document.getElementById('periodoFechaInicio').value,
        fecha_fin: document.getElementById('periodoFechaFin').value
    };

    // Validaciones
    if (!periodoData.tipo_periodo_id || !periodoData.nombre || !periodoData.fecha_inicio || !periodoData.fecha_fin) {
        showToast('Error', 'Por favor completa todos los campos requeridos', 'error');
        return;
    }

    // Validar fechas
    const inicio = new Date(periodoData.fecha_inicio);
    const fin = new Date(periodoData.fecha_fin);
    
    if (fin <= inicio) {
        showToast('Error', 'La fecha de fin debe ser posterior a la fecha de inicio', 'error');
        return;
    }

    try {
        const result = periodoId 
            ? await AcademicoService.updatePeriodo(periodoId, periodoData)
            : await AcademicoService.createPeriodo(periodoData);

        if (result.success) {
            showToast('Éxito', periodoId ? 'Periodo actualizado correctamente' : 'Periodo creado correctamente', 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalPeriodo'));
            modal.hide();
            
            // Recargar tabla
            await loadPeriodos();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving periodo:', error);
        showToast('Error', error.message || 'Error al guardar el periodo', 'error');
    }
}

/**
 * Editar periodo
 */
function editPeriodo(id) {
    const periodo = periodos.find(p => p.id === id);
    if (!periodo) {
        showToast('Error', 'Periodo no encontrado', 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('periodoId').value = periodo.id;
    document.getElementById('periodoTipo').value = periodo.tipo_periodo_id;
    document.getElementById('periodoNombre').value = periodo.nombre;
    document.getElementById('periodoFechaInicio').value = periodo.fecha_inicio;
    document.getElementById('periodoFechaFin').value = periodo.fecha_fin;
    
    // Cambiar título del modal
    document.getElementById('modalPeriodoTitle').textContent = 'Editar Periodo';
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalPeriodo'));
    modal.show();
}

/**
 * Eliminar periodo
 */
async function deletePeriodo(id) {
    const periodo = periodos.find(p => p.id === id);
    if (!periodo) return;

    const confirmDelete = await showConfirm(
        '¿Eliminar periodo?',
        `¿Estás seguro de eliminar el periodo "${periodo.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
        const result = await AcademicoService.deletePeriodo(id);
        
        if (result.success) {
            showToast('Éxito', 'Periodo eliminado correctamente', 'success');
            await loadPeriodos();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting periodo:', error);
        showToast('Error', error.message || 'Error al eliminar el periodo', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}
