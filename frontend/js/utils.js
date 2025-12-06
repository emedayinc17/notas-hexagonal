// ============================================
// CONFIGURACIÓN DE LA API
// ============================================
// DEPRECADO: Usar window.APP_CONFIG.API_ENDPOINTS desde config.js
// Mantenido por compatibilidad
const API_CONFIG = window.APP_CONFIG?.API_ENDPOINTS || {
    IAM_SERVICE: 'http://localhost:8001',
    ACADEMICO_SERVICE: 'http://localhost:8002',
    PERSONAS_SERVICE: 'http://localhost:8003',
    NOTAS_SERVICE: 'http://localhost:8004'
};

// ============================================
// UTILIDADES GENERALES
// ============================================

/**
 * Formatea una fecha a formato legible
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formatea una fecha corta
 */
function formatDateShort(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

/**
 * Formatea fecha y hora
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
}

/**
 * Muestra una alerta en el contenedor especificado
 */
function showAlert(message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    const alertId = `alert-${Date.now()}`;
    const iconMap = {
        success: 'check-circle-fill',
        danger: 'exclamation-triangle-fill',
        warning: 'exclamation-circle-fill',
        info: 'info-circle-fill'
    };

    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-${iconMap[type]} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    container.innerHTML = alertHTML;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            bsAlert.close();
        }
    }, 5000);
}

/**
 * Muestra un toast notification
 */
/**
 * Muestra un toast notification
 * Soporta firmas: (message, type) o (title, message, type)
 */
function showToast(arg1, arg2, arg3) {
    let title, message, type;

    if (arg3) {
        // Firma: (title, message, type)
        title = arg1;
        message = arg2;
        type = arg3;
    } else {
        // Firma: (message, type)
        message = arg1;
        type = arg2 || 'success';
    }

    // Normalizar tipos
    if (type === 'error') type = 'danger';

    // Crear contenedor de toasts si no existe
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toastId = `toast-${Date.now()}`;
    const iconMap = {
        success: 'check-circle-fill',
        danger: 'exclamation-triangle-fill',
        warning: 'exclamation-circle-fill',
        info: 'info-circle-fill'
    };

    const bgClass = `bg-${type}`;
    const icon = iconMap[type] || 'info-circle-fill';

    // Construir contenido
    const content = title ? `<strong>${title}</strong><br>${message}` : message;

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-${icon} me-2"></i>
                    <span>${content}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    toast.show();

    // Remover del DOM después de ocultarse
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Muestra un loading overlay
 */
function showLoading(message = 'Cargando...') {
    const loadingHTML = `
        <div id="loadingOverlay" class="loading-overlay">
            <div class="text-center">
                <div class="spinner-custom mb-3"></div>
                <p class="text-white fs-5">${message}</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

/**
 * Oculta el loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Valida un email
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valida una contraseña (min 8 chars, 1 mayúscula, 1 número)
 */
function isValidPassword(password) {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password);
}

/**
 * Valida DNI peruano (8 dígitos)
 */
function isValidDNI(dni) {
    return /^\d{8}$/.test(dni);
}

/**
 * Formatea un número con separadores de miles
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Capitaliza la primera letra
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Trunca un texto
 */
function truncate(str, maxLength = 50) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * Escapa texto para inserción segura en HTML
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Obtiene las iniciales de un nombre
 */
function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Genera un color aleatorio para avatares
 */
function getRandomColor() {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#fee140', '#30cfd0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Genera un badge HTML para el rol del usuario
 */
function getRoleBadge(roleName) {
    if (!roleName) return '<span class="badge bg-secondary">Sin Rol</span>';

    const roleBadges = {
        'ADMIN': '<span class="badge bg-danger">ADMIN</span>',
        'DOCENTE': '<span class="badge bg-primary">DOCENTE</span>',
        'PADRE': '<span class="badge bg-success">PADRE</span>',
        'ALUMNO': '<span class="badge bg-info">ALUMNO</span>',
        'DIRECTOR': '<span class="badge bg-warning">DIRECTOR</span>'
    };

    return roleBadges[roleName] || `<span class="badge bg-secondary">${roleName}</span>`;
}

/**
 * Genera un badge HTML para el estado
 */
function getStatusBadge(status) {
    const badges = {
        'ACTIVO': '<span class="badge bg-success">ACTIVO</span>',
        'INACTIVO': '<span class="badge bg-secondary">INACTIVO</span>',
        'SUSPENDIDO': '<span class="badge bg-warning text-dark">SUSPENDIDO</span>'
    };
    return badges[status] || `<span class="badge bg-light text-dark border">${status}</span>`;
}

/**
 * Debounce function para búsquedas
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// SIDEBAR & NAVIGATION
// ============================================

/**
 * Configura el menú del sidebar según el rol
 */
function setupSidebar() {
    const user = getUserData();
    if (!user) return;

    const role = user.rol?.nombre;
    const menuItems = getMenuItemsByRole(role);
    const sidebarMenu = document.getElementById('sidebarMenu');

    if (!sidebarMenu) return;

    sidebarMenu.innerHTML = menuItems.map(item => {
        // Normalize link to point to /pages/<file> for consistent navigation
        const pagePath = item.page.startsWith('/') ? item.page : `/pages/${item.page}`;
        const activeClass = isCurrentPage(item.page) || isCurrentPage(pagePath) ? 'active' : '';
        return `
        <li>
            <a href="${pagePath}" onclick="navigateToPage('${item.page}')" class="${activeClass}">
                <i class="bi bi-${item.icon}"></i>
                <span class="menu-text">${item.label}</span>
            </a>
        </li>
        `;
    }).join('');
}

/**
 * Retorna los items del menú según el rol
 */
function getMenuItemsByRole(role) {
    const menus = {
        'ADMIN': [
            { page: 'dashboard.html', label: 'Dashboard', icon: 'grid-fill' },
            { page: 'grados.html', label: 'Grados', icon: 'bookmark-fill' },
            { page: 'cursos.html', label: 'Cursos', icon: 'book-fill' },
            { page: 'secciones.html', label: 'Secciones', icon: 'collection-fill' },
            { page: 'periodos.html', label: 'Periodos', icon: 'calendar-range-fill' },
            { page: 'clases.html', label: 'Clases', icon: 'door-open-fill' },
            { page: 'alumnos.html', label: 'Alumnos', icon: 'people-fill' },
            { page: 'matriculas.html', label: 'Matrículas', icon: 'journal-check' },
            { page: 'usuarios.html', label: 'Usuarios', icon: 'person-gear' }
        ],
        'DOCENTE': [
            { page: 'dashboard.html', label: 'Dashboard', icon: 'grid-fill' },
            { page: 'mis-clases.html', label: 'Mis Clases', icon: 'door-open-fill' },
            { page: 'notas.html', label: 'Gestionar Notas', icon: 'clipboard-check' }
        ],
        'PADRE': [
            { page: 'dashboard.html', label: 'Dashboard', icon: 'grid-fill' },
            { page: 'notas-hijos.html', label: 'Notas de mis Hijos', icon: 'card-checklist' }
        ]
    };

    return menus[role] || [];
}

/**
 * Navega a una página
 */
function navigateToPage(page) {
    // Compute candidate paths
    const candidate = page.startsWith('/') ? page : `/pages/${page}`;

    // Si ya estamos en la página, no hacer nada
    if (isCurrentPage(page) || isCurrentPage(candidate)) return;

    // Navegar a la ruta normalizada
    window.location.href = candidate;
}

/**
 * Verifica si es la página actual
 */
function isCurrentPage(page) {
    if (!page) return false;

    // Normalize
    const normalized = page.startsWith('/') ? page : `/pages/${page}`;

    const path = window.location.pathname || '';

    return path.endsWith(page) || path.includes(page) || path.endsWith(normalized) || path.includes(normalized);
}

/**
 * Muestra un diálogo de confirmación
 */
async function showConfirm(title, message) {
    return new Promise((resolve) => {
        const result = window.confirm(`${title}\n\n${message}`);
        resolve(result);
    });
}

// ============================================
// Helpers globales: cargar información de usuario y sidebar
// ============================================
/**
 * Carga la información del usuario en la cabecera (nombre, rol y avatar)
 */
function loadUserInfo() {
    try {
        const user = getUserData();
        if (!user) return;

        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        const avatarEl = document.getElementById('userAvatar');

        if (nameEl) {
            const full = [user.nombres, user.apellidos].filter(Boolean).join(' ');
            nameEl.textContent = full || user.username || user.email || '';
        }

        if (roleEl) {
            roleEl.innerHTML = getRoleBadge(user.rol?.nombre);
        }

        if (avatarEl) {
            const initials = getInitials(user.nombres || user.username || user.email || '??');
            const color = getRandomColor();
            avatarEl.innerHTML = `<div class="avatar-circle" style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600">${initials}</div>`;
        }
    } catch (e) {
        console.warn('loadUserInfo error:', e);
    }
}

/**
 * Carga/construye el menú lateral según el rol del usuario
 */
function loadSidebarMenu() {
    try {
        setupSidebar();
    } catch (e) {
        console.warn('loadSidebarMenu error:', e);
    }
}

// Compatibilidad: populateSelect global (si no está definida en otras páginas)
if (typeof populateSelect === 'undefined') {
    /**
     * populateSelect(selectId, data, valueField = 'id', labelField = 'nombre', defaultLabel = null, isFilter = false)
     * Rellena un <select> con un array de objetos. Compatibilidad con distintas firmas usadas en el repo.
     */
    function populateSelect(selectId, data, valueField = 'id', labelField = 'nombre', defaultLabel = null, isFilter = false) {
        try {
            const select = document.getElementById(selectId);
            if (!select) return;

            // Normalizar data a array
            let items = [];
            if (Array.isArray(data)) items = data;
            else if (data && Array.isArray(data.items)) items = data.items;
            else if (data && Array.isArray(data.periodos)) items = data.periodos;
            else if (data && Array.isArray(data.cursos)) items = data.cursos;
            else if (data && Array.isArray(data.clases)) items = data.clases;
            else if (data && Array.isArray(data.secciones)) items = data.secciones;

            const defaultOption = defaultLabel !== null ? defaultLabel : (isFilter ? 'Todos' : 'Seleccionar...');
            select.innerHTML = `<option value="">${defaultOption}</option>`;

            items.forEach(item => {
                const value = item[valueField] || item.id || '';
                const label = (item[labelField] !== undefined) ? item[labelField] : (item.nombre || item.nombre_corto || value);
                select.innerHTML += `<option value="${value}">${label}</option>`;
            });
        } catch (e) {
            console.warn('populateSelect error:', e);
        }
    }
}
