// ============================================
// GESTIÓN DE GRADOS
// ============================================

let grados = []; // Todos los grados cargados
let filteredGrados = []; // Grados filtrados
let currentPage = 1;
let itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
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
    
    // Cargar grados
    loadGrados();

    // Event listeners
    document.getElementById('formGrado').addEventListener('submit', handleSubmitGrado);
    document.getElementById('searchInput').addEventListener('input', debounce(() => { currentPage = 1; applyFilters(); }, 300));
    document.getElementById('filterNivel').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('filterEstado').addEventListener('change', () => { currentPage = 1; applyFilters(); });
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Reset form when modal closes
    document.getElementById('modalGrado').addEventListener('hidden.bs.modal', function() {
        document.getElementById('formGrado').reset();
        document.getElementById('gradoId').value = '';
        document.getElementById('modalGradoTitle').textContent = 'Nuevo Grado';
    });
});

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
        { page: 'grados.html', label: 'Grados', icon: 'bookmark-fill', active: true },
        { page: 'cursos.html', label: 'Cursos', icon: 'book-fill' },
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
 * Carga los grados desde el API
 */
async function loadGrados() {
    const tbody = document.getElementById('gradosTableBody');
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
        const result = await AcademicoService.listGrados(0, 1000);
        
        if (result.success) {
            grados = result.data.grados || result.data;
            applyFilters();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading grados:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar grados: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar los grados', 'error');
    }
}

/**
 * Aplica filtros y paginación
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const nivel = document.getElementById('filterNivel').value;
    const estado = document.getElementById('filterEstado').value;

    // Filtrar
    filteredGrados = grados.filter(g => {
        let match = true;
        
        if (searchTerm) {
            match = match && g.nombre.toLowerCase().includes(searchTerm);
        }
        
        if (nivel) {
            match = match && g.nivel === nivel;
        }
        
        if (estado) {
            match = match && g.status === estado;
        }
        
        return match;
    });

    // Ordenar por nivel y orden
    filteredGrados.sort((a, b) => {
        const nivelOrder = { 'INICIAL': 1, 'PRIMARIA': 2, 'SECUNDARIA': 3 };
        if (nivelOrder[a.nivel] !== nivelOrder[b.nivel]) {
            return (nivelOrder[a.nivel] || 99) - (nivelOrder[b.nivel] || 99);
        }
        return a.orden - b.orden;
    });

    renderTable();
    renderPagination();
}

/**
 * Renderiza la tabla con la página actual
 */
function renderTable() {
    const tbody = document.getElementById('gradosTableBody');
    
    if (filteredGrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron grados
                </td>
            </tr>
        `;
        return;
    }

    // Paginación
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredGrados.slice(start, end);

    tbody.innerHTML = pageData.map(grado => `
        <tr>
            <td><span class="badge bg-secondary">${grado.orden}</span></td>
            <td class="fw-bold">${grado.nombre}</td>
            <td><span class="badge bg-info">${grado.nivel}</span></td>
            <td>${grado.descripcion || '<span class="text-muted">Sin descripción</span>'}</td>
            <td>
                <span class="badge ${grado.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                    ${grado.status || 'ACTIVO'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editGrado('${grado.id}')" 
                        title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteGrado('${grado.id}')"
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
    const table = document.getElementById('gradosTableBody');

    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination';
        container.className = 'd-flex justify-content-between align-items-center mt-3';
        const tableElem = table.closest('table') || table.parentElement;
        tableElem.parentNode.insertBefore(container, tableElem.nextSibling);
    }

    const total = filteredGrados.length;
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
 * Maneja el submit del formulario de grado
 */
async function handleSubmitGrado(e) {
    e.preventDefault();

    const gradoId = document.getElementById('gradoId').value;
    const gradoData = {
        nombre: document.getElementById('gradoNombre').value.trim(),
        nivel: document.getElementById('gradoNivel').value,
        orden: parseInt(document.getElementById('gradoOrden').value),
        descripcion: document.getElementById('gradoDescripcion').value.trim() || null
    };

    // Validaciones
    if (!gradoData.nombre || !gradoData.nivel || !gradoData.orden) {
        showToast('Error', 'Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        const result = gradoId 
            ? await AcademicoService.updateGrado(gradoId, gradoData)
            : await AcademicoService.createGrado(gradoData);

        if (result.success) {
            showToast('Éxito', gradoId ? 'Grado actualizado correctamente' : 'Grado creado correctamente', 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalGrado'));
            modal.hide();
            
            // Recargar tabla
            await loadGrados();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving grado:', error);
        showToast('Error', error.message || 'Error al guardar el grado', 'error');
    }
}

/**
 * Editar grado
 */
function editGrado(id) {
    const grado = grados.find(g => g.id === id);
    if (!grado) {
        showToast('Error', 'Grado no encontrado', 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('gradoId').value = grado.id;
    document.getElementById('gradoNombre').value = grado.nombre;
    document.getElementById('gradoNivel').value = grado.nivel;
    document.getElementById('gradoOrden').value = grado.orden;
    document.getElementById('gradoDescripcion').value = grado.descripcion || '';
    
    // Cambiar título del modal
    document.getElementById('modalGradoTitle').textContent = 'Editar Grado';
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalGrado'));
    modal.show();
}

/**
 * Eliminar grado
 */
async function deleteGrado(id) {
    const grado = grados.find(g => g.id === id);
    if (!grado) return;

    const confirmDelete = await showConfirm(
        '¿Eliminar grado?',
        `¿Estás seguro de eliminar el grado "${grado.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
        const result = await AcademicoService.deleteGrado(id);
        
        if (result.success) {
            showToast('Éxito', 'Grado eliminado correctamente', 'success');
            await loadGrados();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting grado:', error);
        showToast('Error', error.message || 'Error al eliminar el grado', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}