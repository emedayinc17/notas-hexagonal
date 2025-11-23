// ============================================
// LIMPIAR BACKDROPS RESIDUALES DE BOOTSTRAP
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Limpiar backdrops de dropdown al cerrar
    document.addEventListener('hidden.bs.dropdown', function() {
        const backdrops = document.querySelectorAll('.dropdown-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
    });

    // Limpiar backdrops de modal al cerrar
    document.addEventListener('hidden.bs.modal', function() {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        // Asegurar que body no tenga clases residuales
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    });

    // Verificar y limpiar backdrops huérfanos periódicamente
    setInterval(function() {
        // Si no hay modales ni dropdowns abiertos, eliminar backdrops
        const openModals = document.querySelectorAll('.modal.show');
        const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
        
        if (openModals.length === 0 && openDropdowns.length === 0) {
            // Eliminar todos los backdrops encontrados
            const backdrops = document.querySelectorAll('.modal-backdrop, .dropdown-backdrop, [class*="backdrop"]');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Limpiar clases del body
            if (openModals.length === 0) {
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        }
    }, 500); // Reducir intervalo a 500ms para limpieza más rápida
});
