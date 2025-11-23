// ============================================
// GESTIÓN DE SECCIONES
// ============================================

let secciones = [];
let grados = [];
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
    document.getElementById('formSeccion').addEventListener('submit', handleSubmitSeccion);
    document.getElementById('searchInput').addEventListener('input', debounce(loadSecciones, 500));
    document.getElementById('filterGrado').addEventListener('change', loadSecciones);
    document.getElementById('filterAnio').addEventListener('change', loadSecciones);
    document.getElementById('filterEstado').addEventListener('change', loadSecciones);
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Reset form when modal closes
    document.getElementById('modalSeccion').addEventListener('hidden.bs.modal', function() {
        document.getElementById('formSeccion').reset();
        document.getElementById('seccionId').value = '';
        document.getElementById('modalSeccionTitle').textContent = 'Nueva Sección';
        document.getElementById('seccionAnio').value = new Date().getFullYear();
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
        { page: 'secciones.html', label: 'Secciones', icon: 'collection-fill', active: true },
        { page: 'periodos.html', label: 'Periodos', icon: 'calendar-range-fill' },
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
    const searchTerm = document.getElementById('searchInput').value;
    const gradoId = document.getElementById('filterGrado').value;
    const anio = document.getElementById('filterAnio').value;
    const estado = document.getElementById('filterEstado').value;

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
        const result = await AcademicoService.listSecciones(0, 100);
        
        if (result.success) {
            secciones = result.data.secciones || result.data;
            
            // Aplicar filtros
            let filteredSecciones = secciones.filter(s => {
                let match = true;
                
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    match = match && s.nombre.toLowerCase().includes(searchLower);
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

                filteredSecciones = filteredSecciones.map(s => ({
                    ...s,
                    alumnos_count: s.alumnos_count || matriculadosPorSeccion[s.id] || 0
                }));
            } catch (err) {
                console.warn('No se pudieron calcular matriculados por sección:', err);
            }

            displaySecciones(filteredSecciones);
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
 * Muestra las secciones en la tabla
 */
function displaySecciones(seccionesToDisplay) {
    const tbody = document.getElementById('seccionesTableBody');
    
    if (seccionesToDisplay.length === 0) {
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

    tbody.innerHTML = seccionesToDisplay.map(seccion => {
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

    // Validaciones
    if (!seccionData.grado_id || !seccionData.nombre || !seccionData.año_escolar) {
        showToast('Error', 'Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        const result = seccionId 
            ? await AcademicoService.updateSeccion(seccionId, seccionData)
            : await AcademicoService.createSeccion(seccionData);

        if (result.success) {
            showToast('Éxito', seccionId ? 'Sección actualizada correctamente' : 'Sección creada correctamente', 'success');
            
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
        showToast('Error', error.message || 'Error al guardar la sección', 'error');
    }
}

/**
 * Editar sección
 */
function editSeccion(id) {
    const seccion = secciones.find(s => s.id === id);
    if (!seccion) {
        showToast('Error', 'Sección no encontrada', 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('seccionId').value = seccion.id;
    document.getElementById('seccionGrado').value = seccion.grado_id;
    document.getElementById('seccionNombre').value = seccion.nombre;
    document.getElementById('seccionAnio').value = seccion.año_escolar;
    document.getElementById('seccionCapacidad').value = seccion.capacidad_maxima || '';
    
    // Cambiar título del modal
    document.getElementById('modalSeccionTitle').textContent = 'Editar Sección';
    
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

    const confirmDelete = await showConfirm(
        '¿Eliminar sección?',
        `¿Estás seguro de eliminar la sección "${gradoNombre} ${seccion.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
        // Soft delete
        const result = await AcademicoService.deleteSeccion(id);
        
        if (result.success) {
            showToast('Éxito', 'Sección eliminada correctamente', 'success');
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
