// ============================================
// GESTIÓN DE USUARIOS
// ============================================

let usuarios = [];
let allUsuarios = [];
let currentPage = 1;
let itemsPerPage = 20;
let totalItems = 0;

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
    loadUsuarios();

    // Event listeners
    document.getElementById('formUsuario').addEventListener('submit', handleSubmitUsuario);
    document.getElementById('searchInput').addEventListener('input', debounce(loadUsuarios, 500));
    document.getElementById('filterRol').addEventListener('change', loadUsuarios);
    document.getElementById('filterEstado').addEventListener('change', loadUsuarios);
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Reset form when modal closes
    document.getElementById('modalUsuario').addEventListener('hidden.bs.modal', function () {
        const form = document.getElementById('formUsuario');
        if (form) form.reset();

        const usuarioId = document.getElementById('usuarioId');
        if (usuarioId) usuarioId.value = '';

        const modalLabel = document.getElementById('modalUsuarioTitle');
        if (modalLabel) modalLabel.textContent = 'Nuevo Usuario';

        const usuarioPassword = document.getElementById('usuarioPassword');
        if (usuarioPassword) usuarioPassword.required = true;
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
        { page: 'matriculas.html', label: 'Matrículas', icon: 'journal-check' },
        { page: 'usuarios.html', label: 'Usuarios', icon: 'person-gear', active: true }
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
 * Carga usuarios desde el API
 */
async function loadUsuarios(page = 1) {
    // Validar que page sea un número válido
    if (!page || isNaN(page) || page < 1) {
        page = 1;
    }
    currentPage = page;
    const searchTerm = document.getElementById('searchInput').value;
    const rol = document.getElementById('filterRol').value;
    const estado = document.getElementById('filterEstado').value;

    const tbody = document.getElementById('usuariosTableBody');
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
        const offset = (currentPage - 1) * itemsPerPage;
        const result = await IAMService.listUsers(offset, itemsPerPage);

        if (result.success) {
            usuarios = result.data.users || result.data;
            allUsuarios = usuarios; // Guardar para edición
            totalItems = result.data.total || usuarios.length;

            // Aplicar filtros del lado del cliente
            let filteredUsuarios = usuarios.filter(u => {
                let match = true;

                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    match = match && (
                        (u.username && u.username.toLowerCase().includes(searchLower)) ||
                        (u.email && u.email.toLowerCase().includes(searchLower)) ||
                        (u.nombres && u.nombres.toLowerCase().includes(searchLower)) ||
                        (u.apellidos && u.apellidos.toLowerCase().includes(searchLower))
                    );
                }

                if (rol) {
                    match = match && u.rol?.nombre === rol;
                }

                if (estado) {
                    match = match && u.status === estado;
                }

                return match;
            });

            // Ordenar por username
            filteredUsuarios.sort((a, b) => {
                const usernameA = a.username || '';
                const usernameB = b.username || '';
                return usernameA.localeCompare(usernameB);
            });

            displayUsuarios(filteredUsuarios);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading usuarios:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar usuarios: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar los usuarios', 'error');
    }
}

/**
 * Muestra los usuarios en la tabla
 */
function displayUsuarios(usuariosToDisplay) {
    const tbody = document.getElementById('usuariosTableBody');

    if (usuariosToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron usuarios
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usuariosToDisplay.map(usuario => {
        const fullName = [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ') || '-';
        const fechaCreacion = formatDate(usuario.created_at);

        return `
            <tr>
                <td class="fw-bold">${usuario.username || '-'}</td>
                <td>${fullName}</td>
                <td>${usuario.email || '-'}</td>
                <td>${getRoleBadge(usuario.rol?.nombre)}</td>
                <td>${getStatusBadge(usuario.status)}</td>
                <td><small class="text-muted">${fechaCreacion}</small></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="editUsuario('${usuario.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUsuario('${usuario.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Maneja el envío del formulario
 */
async function handleSubmitUsuario(e) {
    e.preventDefault();

    const usuarioId = document.getElementById('usuarioId').value;
    const usuarioData = {
        username: document.getElementById('usuarioUsername').value.trim(),
        email: document.getElementById('usuarioEmail').value.trim(),
        password: document.getElementById('usuarioPassword').value,
        rol_nombre: document.getElementById('usuarioRol').value,
        nombres: document.getElementById('usuarioNombres').value.trim() || null,
        apellidos: document.getElementById('usuarioApellidos').value.trim() || null,
    };

    try {
        let result;
        if (usuarioId) {
            // Editar usuario existente
            const updateData = {
                email: usuarioData.email,
                rol_nombre: usuarioData.rol_nombre,
                nombres: usuarioData.nombres,
                apellidos: usuarioData.apellidos
            };

            // Solo incluir password si se proporcionó
            if (usuarioData.password) {
                updateData.password = usuarioData.password;
            }

            result = await IAMService.updateUser(usuarioId, updateData);
        } else {
            // Crear nuevo
            result = await IAMService.createUser(usuarioData);
        }

        if (result.success) {
            const mensaje = usuarioId ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente';
            showToast('Éxito', mensaje, 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
            loadUsuarios();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving usuario:', error);
        showToast('Error', error.message || 'Error al guardar el usuario', 'error');
    }
}

/**
 * Edita un usuario
 */
async function editUsuario(id) {
    try {
        // Buscar el usuario en la lista cargada
        const usuario = allUsuarios.find(u => u.id === id);
        if (!usuario) {
            showToast('Error', 'Usuario no encontrado', 'error');
            return;
        }

        // Llenar el formulario con los datos del usuario
        const usuarioId = document.getElementById('usuarioId');
        const usuarioUsername = document.getElementById('usuarioUsername');
        const usuarioEmail = document.getElementById('usuarioEmail');
        const usuarioRol = document.getElementById('usuarioRol');
        const usuarioNombres = document.getElementById('usuarioNombres');
        const usuarioApellidos = document.getElementById('usuarioApellidos');
        const usuarioPassword = document.getElementById('usuarioPassword');
        const modalTitle = document.getElementById('modalUsuarioTitle');

        if (!usuarioId || !usuarioUsername || !usuarioEmail || !usuarioRol) {
            showToast('Error', 'Formulario no encontrado. Recarga la página.', 'error');
            return;
        }

        usuarioId.value = usuario.id;
        usuarioUsername.value = usuario.username;
        usuarioEmail.value = usuario.email || '';
        usuarioRol.value = usuario.rol?.nombre || '';
        if (usuarioNombres) usuarioNombres.value = usuario.nombres || '';
        if (usuarioApellidos) usuarioApellidos.value = usuario.apellidos || '';

        // La contraseña se deja vacía (opcional al editar)
        if (usuarioPassword) {
            usuarioPassword.value = '';
            usuarioPassword.required = false;
        }

        // Cambiar el título del modal
        if (modalTitle) modalTitle.textContent = 'Editar Usuario';

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('modalUsuario'));
        modal.show();
    } catch (error) {
        console.error('Error editing usuario:', error);
        showToast('Error', 'Error al cargar datos del usuario', 'error');
    }
}

/**
 * Elimina un usuario
 */
async function deleteUsuario(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
        const result = await IAMService.deleteUser(id);

        if (result.success) {
            showToast('Éxito', 'Usuario eliminado correctamente', 'success');
            loadUsuarios(); // Recargar la lista
        } else {
            showToast('Error', result.error || 'Error al eliminar usuario', 'error');
        }
    } catch (error) {
        console.error('Error deleting usuario:', error);
        showToast('Error', 'Error al eliminar usuario', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}
