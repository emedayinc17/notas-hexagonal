// ============================================
// PÁGINA DE CONFIGURACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y rol ADMIN
    if (!requireAuth()) return;
    if (!requireRole('ADMIN')) {
        showToast('Acceso denegado', 'Solo administradores pueden acceder a configuración', 'error');
        window.location.href = '/pages/dashboard.html';
        return;
    }

    // Cargar datos del usuario en navbar
    loadUserInfo();
    
    // Cargar menú del sidebar
    loadSidebarMenu();
    
    // Cargar configuración actual
    loadCurrentSettings();

    // Event listener para sidebar collapse
    document.getElementById('sidebarCollapse')?.addEventListener('click', toggleSidebar);
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
        
        if (userRoleEl) {
            const role = user.rol?.nombre;
            userRoleEl.textContent = role;
            userRoleEl.className = 'badge';
            if (role === 'ADMIN') userRoleEl.classList.add('bg-danger');
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
        { page: 'clases.html', label: 'Clases', icon: 'door-open-fill' },
        { page: 'alumnos.html', label: 'Alumnos', icon: 'people-fill' },
        { page: 'matriculas.html', label: 'Matrículas', icon: 'journal-check' },
        { page: 'configuracion.html', label: 'Configuración', icon: 'gear-fill', active: true }
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
 * Carga la configuración actual en el formulario
 */
function loadCurrentSettings() {
    const settings = AppSettings.get();
    
    // Paginación
    document.getElementById('itemsPerPage').value = settings.pagination.itemsPerPage;
    document.getElementById('maxVisiblePages').value = settings.pagination.maxVisiblePages;
    document.getElementById('showPageInfo').checked = settings.pagination.showPageInfo;
    
    // Tabla
    document.getElementById('stripedRows').checked = settings.table.stripedRows;
    document.getElementById('hoverEffect').checked = settings.table.hoverEffect;
    document.getElementById('compactMode').checked = settings.table.compactMode;
    
    // Visualización
    document.getElementById('dateFormat').value = settings.display.dateFormat;
    
    // Filtros
    document.getElementById('autoApply').checked = settings.filters.autoApply;
    document.getElementById('debounceTime').value = settings.filters.debounceTime;
}

/**
 * Guarda la configuración
 */
function saveSettings() {
    const settings = {
        pagination: {
            itemsPerPage: parseInt(document.getElementById('itemsPerPage').value),
            maxVisiblePages: parseInt(document.getElementById('maxVisiblePages').value),
            showPageInfo: document.getElementById('showPageInfo').checked
        },
        table: {
            stripedRows: document.getElementById('stripedRows').checked,
            hoverEffect: document.getElementById('hoverEffect').checked,
            compactMode: document.getElementById('compactMode').checked
        },
        display: {
            dateFormat: document.getElementById('dateFormat').value,
            timeFormat: '24h',
            theme: 'light'
        },
        filters: {
            autoApply: document.getElementById('autoApply').checked,
            debounceTime: parseInt(document.getElementById('debounceTime').value)
        }
    };
    
    if (AppSettings.save(settings)) {
        showToast('Éxito', 'Configuración guardada correctamente. Los cambios se aplicarán en la próxima carga de página.', 'success');
    } else {
        showToast('Error', 'No se pudo guardar la configuración', 'error');
    }
}

/**
 * Resetea la configuración a valores por defecto
 */
function resetSettings() {
    if (confirm('¿Estás seguro de restaurar la configuración a los valores por defecto? Esta acción no se puede deshacer.')) {
        if (AppSettings.reset()) {
            loadCurrentSettings();
            showToast('Éxito', 'Configuración restaurada a valores por defecto', 'success');
        } else {
            showToast('Error', 'No se pudo resetear la configuración', 'error');
        }
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}
