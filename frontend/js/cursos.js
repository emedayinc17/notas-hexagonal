// ============================================
// GESTIÓN DE CURSOS
// ============================================

let cursos = [];
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
    
    // Cargar cursos
    loadCursos();

    // Event listeners
    document.getElementById('formCurso').addEventListener('submit', handleSubmitCurso);
    document.getElementById('searchInput').addEventListener('input', debounce(loadCursos, 500));
    document.getElementById('filterEstado').addEventListener('change', loadCursos);
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Reset form when modal closes
    document.getElementById('modalCurso').addEventListener('hidden.bs.modal', function() {
        document.getElementById('formCurso').reset();
        document.getElementById('cursoId').value = '';
        document.getElementById('modalCursoTitle').textContent = 'Nuevo Curso';
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
    const searchTerm = document.getElementById('searchInput').value;
    const estado = document.getElementById('filterEstado').value;

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
        const result = await AcademicoService.listCursos(0, 100);
        
        if (result.success) {
            cursos = result.data.cursos || result.data;
            
            // Aplicar filtros
            let filteredCursos = cursos.filter(c => {
                let match = true;
                
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    match = match && (
                        c.nombre.toLowerCase().includes(searchLower) ||
                        c.codigo.toLowerCase().includes(searchLower)
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

            displayCursos(filteredCursos);
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
 * Muestra los cursos en la tabla
 */
function displayCursos(cursosToDisplay) {
    const tbody = document.getElementById('cursosTableBody');
    
    if (cursosToDisplay.length === 0) {
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

    tbody.innerHTML = cursosToDisplay.map(curso => `
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
