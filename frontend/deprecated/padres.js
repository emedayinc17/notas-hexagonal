// ============================================
// GESTIÓN DE PADRES
// ============================================

let padres = [];
let currentPage = 1;
let itemsPerPage = 20; // Se actualizará con la configuración del usuario

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
        itemsPerPage = AppSettings.getSetting('pagination.itemsPerPage', 20);
    }

    // Cargar datos del usuario en navbar
    loadUserInfo();

    // Cargar menú del sidebar
    loadSidebarMenu();

    // Cargar datos iniciales
    loadPadres();

    // Event listeners
    document.getElementById('formPadre').addEventListener('submit', handleSubmitPadre);
    document.getElementById('searchInput').addEventListener('input', debounce(loadPadres, 500));
    document.getElementById('filterTipoRelacion').addEventListener('change', loadPadres);
    document.getElementById('filterEstado').addEventListener('change', loadPadres);
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Validaciones
    document.getElementById('padreDni').addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
    });

    document.getElementById('padreCelular').addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
    });

    // Reset form when modal closes
    document.getElementById('modalPadre').addEventListener('hidden.bs.modal', function () {
        document.getElementById('formPadre').reset();
        document.getElementById('padreId').value = '';
        document.getElementById('modalPadreTitle').textContent = 'Nuevo Padre';
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
        { page: 'grados.html', label: 'Grados', icon: 'bookmark-fill' },
        { page: 'cursos.html', label: 'Cursos', icon: 'book-fill' },
        { page: 'secciones.html', label: 'Secciones', icon: 'collection-fill' },
        { page: 'periodos.html', label: 'Periodos', icon: 'calendar-range-fill' },
        { page: 'clases.html', label: 'Clases', icon: 'door-open-fill' },
        { page: 'alumnos.html', label: 'Alumnos', icon: 'people-fill' },
        { page: 'padres.html', label: 'Padres', icon: 'person-hearts', active: true },
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
 * Carga los padres desde el API
 */
async function loadPadres() {
    const searchTerm = document.getElementById('searchInput').value;
    const tipoRelacion = document.getElementById('filterTipoRelacion').value;
    const estado = document.getElementById('filterEstado').value;

    const tbody = document.getElementById('padresTableBody');
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
        const result = await PersonasService.listPadres(0, 100);

        if (result.success) {
            padres = result.data.padres || result.data;

            // Aplicar filtros
            let filteredPadres = padres.filter(p => {
                let match = true;

                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    match = match && (
                        p.nombres.toLowerCase().includes(searchLower) ||
                        p.apellidos.toLowerCase().includes(searchLower) ||
                        p.dni?.includes(searchTerm) ||
                        p.email?.toLowerCase().includes(searchLower)
                    );
                }

                if (tipoRelacion) {
                    match = match && p.tipo_relacion === tipoRelacion;
                }

                if (estado) {
                    match = match && p.status === estado;
                }

                return match;
            });

            // Ordenar por apellidos
            filteredPadres.sort((a, b) => {
                const apellidoA = a.apellidos || '';
                const apellidoB = b.apellidos || '';
                const apellidoCompare = apellidoA.localeCompare(apellidoB);
                if (apellidoCompare !== 0) return apellidoCompare;
                const nombreA = a.nombres || '';
                const nombreB = b.nombres || '';
                return nombreA.localeCompare(nombreB);
            });

            displayPadres(filteredPadres);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading padres:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar padres: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar los padres', 'error');
    }
}

/**
 * Muestra los padres en la tabla
 */
function displayPadres(padresToDisplay) {
    const tbody = document.getElementById('padresTableBody');

    if (padresToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron padres
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = padresToDisplay.map(padre => {
        const fullName = `${padre.apellidos}, ${padre.nombres}`;
        const hijosCount = padre.hijos_count || 0;

        return `
            <tr>
                <td class="fw-bold">${fullName}</td>
                <td>${padre.dni || '<span class="text-muted">-</span>'}</td>
                <td>
                    ${padre.email ? `<small>${padre.email}</small>` : '<span class="text-muted">-</span>'}
                </td>
                <td>
                    ${padre.celular ? `<i class="bi bi-phone me-1"></i>${padre.celular}` : '<span class="text-muted">-</span>'}
                </td>
                <td>
                    <span class="badge bg-info">${hijosCount} hijo${hijosCount !== 1 ? 's' : ''}</span>
                </td>
                <td>
                    <span class="badge ${padre.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                        ${padre.status || 'ACTIVO'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verHijos('${padre.id}')" 
                            title="Gestionar Hijos">
                        <i class="bi bi-people"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="editPadre('${padre.id}')" 
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePadre('${padre.id}')"
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Maneja el submit del formulario de padre
 */
async function handleSubmitPadre(e) {
    e.preventDefault();

    const padreId = document.getElementById('padreId').value;
    const padreData = {
        nombres: document.getElementById('padreNombres').value.trim(),
        apellidos: document.getElementById('padreApellidos').value.trim(),
        dni: document.getElementById('padreDni').value.trim(),
        celular: document.getElementById('padreCelular').value.trim(),
        email: document.getElementById('padreEmail').value.trim(),
        direccion: document.getElementById('padreDireccion').value.trim() || null,
        ocupacion: document.getElementById('padreOcupacion').value.trim() || null
    };

    // Validaciones
    if (!padreData.nombres || !padreData.apellidos || !padreData.dni || !padreData.celular || !padreData.email) {
        showToast('Error', 'Por favor completa todos los campos requeridos', 'error');
        return;
    }

    // Validar DNI
    if (padreData.dni.length !== 8) {
        showToast('Error', 'El DNI debe tener 8 dígitos', 'error');
        return;
    }

    // Validar celular
    if (padreData.celular.length !== 9) {
        showToast('Error', 'El celular debe tener 9 dígitos', 'error');
        return;
    }

    try {
        const result = padreId
            ? await PersonasService.updatePadre(padreId, padreData)
            : await PersonasService.createPadre(padreData);

        if (result.success) {
            showToast('Éxito', padreId ? 'Padre actualizado correctamente' : 'Padre creado correctamente', 'success');

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalPadre'));
            modal.hide();

            // Recargar tabla
            await loadPadres();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving padre:', error);
        showToast('Error', error.message || 'Error al guardar el padre', 'error');
    }
}

/**
 * Editar padre
 */
function editPadre(id) {
    const padre = padres.find(p => p.id === id);
    if (!padre) {
        showToast('Error', 'Padre no encontrado', 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('padreId').value = padre.id;
    document.getElementById('padreNombres').value = padre.nombres;
    document.getElementById('padreApellidos').value = padre.apellidos;
    document.getElementById('padreDni').value = padre.dni || '';
    document.getElementById('padreCelular').value = padre.celular || '';
    document.getElementById('padreEmail').value = padre.email || '';
    document.getElementById('padreDireccion').value = padre.direccion || '';
    document.getElementById('padreOcupacion').value = padre.ocupacion || '';

    // Cambiar título del modal
    document.getElementById('modalPadreTitle').textContent = 'Editar Padre';

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalPadre'));
    modal.show();
}

/**
 * Eliminar padre
 */
async function deletePadre(id) {
    const padre = padres.find(p => p.id === id);
    if (!padre) return;

    const confirmDelete = await showConfirm(
        '¿Eliminar padre?',
        `¿Estás seguro de eliminar al padre "${padre.apellidos}, ${padre.nombres}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
        // Soft delete
        const result = await PersonasService.deletePadre(id);

        if (result.success) {
            showToast('Éxito', 'Padre eliminado correctamente', 'success');
            await loadPadres();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting padre:', error);
        showToast('Error', error.message || 'Error al eliminar el padre', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}

// ============================================
// GESTIÓN DE HIJOS
// ============================================

/**
 * Ver hijos del padre
 */
async function verHijos(padreId) {
    const padre = padres.find(p => p.id === padreId);
    if (!padre) return;

    document.getElementById('hijosPadreId').value = padreId;
    document.getElementById('searchAlumnoInput').value = '';
    document.getElementById('searchResults').innerHTML = '';

    // Cargar hijos
    await loadHijosPadre(padreId);

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalHijos'));
    modal.show();
}

/**
 * Cargar hijos del padre
 */
let currentHijos = []; // Variable para almacenar hijos actuales

async function loadHijosPadre(padreId) {
    const tbody = document.getElementById('hijosTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            </td>
        </tr>
    `;

    try {
        const result = await PersonasService.getHijosDePadre(padreId);

        if (result.success) {
            const hijos = result.data.hijos || result.data || [];
            currentHijos = hijos; // Guardar para filtrar búsqueda

            if (hijos.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">No tiene hijos asignados</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = hijos.map(hijo => `
                <tr>
                    <td>${hijo.apellidos}, ${hijo.nombres}</td>
                    <td>${hijo.dni || '-'}</td>
                    <td><span class="badge bg-info">${hijo.tipo_relacion}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="unlinkHijo('${hijo.relacion_id}')"
                                title="Desvincular">
                            <i class="bi bi-person-dash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading hijos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">Error al cargar hijos</td>
            </tr>
        `;
    }
}

/**
 * Buscar alumnos para vincular
 */
document.getElementById('searchAlumnoInput').addEventListener('input', debounce(async function (e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('searchResults');

    if (query.length < 3) {
        resultsContainer.innerHTML = '';
        return;
    }

    try {
        // Usar listAlumnos y filtrar localmente
        const result = await PersonasService.listAlumnos(0, 100);
        if (result.success) {
            const alumnos = result.data.alumnos || result.data || [];

            // IDs de alumnos ya vinculados
            const hijosIds = currentHijos.map(h => h.alumno_id || h.id);

            // Filtrar por búsqueda y excluir ya vinculados
            const filtered = alumnos.filter(a => {
                const matchesSearch = a.nombres.toLowerCase().includes(query.toLowerCase()) ||
                    a.apellidos.toLowerCase().includes(query.toLowerCase()) ||
                    a.dni?.includes(query);
                const notLinked = !hijosIds.includes(a.id);
                return matchesSearch && notLinked;
            }).slice(0, 5); // Limitar a 5 resultados

            if (filtered.length === 0) {
                resultsContainer.innerHTML = '<div class="list-group-item text-muted">No se encontraron alumnos disponibles</div>';
                return;
            }

            resultsContainer.innerHTML = filtered.map(alumno => `
                <a href="#" class="list-group-item list-group-item-action" 
                   onclick="selectAlumno('${alumno.id}', '${alumno.apellidos}, ${alumno.nombres}'); return false;">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${alumno.apellidos}, ${alumno.nombres}</strong>
                            <br><small class="text-muted">DNI: ${alumno.dni || 'N/A'}</small>
                        </div>
                        <i class="bi bi-plus-circle text-primary"></i>
                    </div>
                </a>
            `).join('');
        }
    } catch (error) {
        console.error('Error searching alumnos:', error);
    }
}, 500));

/**
 * Seleccionar alumno para vincular
 */
async function selectAlumno(alumnoId, nombreAlumno) {
    const padreId = document.getElementById('hijosPadreId').value;
    const relacion = document.getElementById('newHijoRelacion').value;

    try {
        const result = await PersonasService.linkPadreAlumno({
            padre_id: padreId,
            alumno_id: alumnoId,
            tipo_relacion: relacion
        });

        if (result.success) {
            showToast('Éxito', 'Alumno vinculado correctamente', 'success');
            document.getElementById('searchAlumnoInput').value = '';
            document.getElementById('searchResults').innerHTML = '';
            await loadHijosPadre(padreId);
            // Actualizar contador en tabla principal
            loadPadres();
        } else {
            // Manejar error de relación duplicada
            if (result.error && result.error.includes('RELATION_ALREADY_EXISTS')) {
                showToast('Información', 'Este alumno ya está vinculado a este padre', 'warning');
            } else {
                throw new Error(result.error || 'Error al vincular alumno');
            }
        }
    } catch (error) {
        console.error('Error linking alumno:', error);
        const message = error.message || 'Error al vincular alumno';
        showToast('Error', message, 'error');
    }
}

/**
 * Desvincular hijo
 */
async function unlinkHijo(relacionId) {
    if (!await showConfirm('¿Desvincular?', '¿Estás seguro de quitar esta relación?')) return;

    try {
        const result = await PersonasService.unlinkPadreAlumno(relacionId);

        if (result.success) {
            showToast('Éxito', 'Relación eliminada', 'success');
            const padreId = document.getElementById('hijosPadreId').value;
            await loadHijosPadre(padreId);
            loadPadres();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error unlinking hijo:', error);
        showToast('Error', error.message || 'Error al desvincular', 'error');
    }
}
