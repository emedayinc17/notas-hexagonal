// Common Templates - Templates reutilizables para todos los módulos
// Este archivo contiene templates HTML comunes que se usan en múltiples módulos

const CommonTemplates = {
    /**
     * Template para estado de carga genérico
     */
    loading(colspan = 1, message = 'Cargando...') {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">${message}</span>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Template para estado vacío genérico
     */
    empty(message, icon = 'inbox', colspan = 1) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center text-muted py-4">
                    <i class="bi bi-${icon} me-2"></i>${message}
                </td>
            </tr>
        `;
    },

    /**
     * Template para error genérico
     */
    error(message, colspan = 1) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>${message}
                </td>
            </tr>
        `;
    },

    /**
     * Template para badge de estado
     */
    statusBadge(status) {
        const variant = status === 'ACTIVO' ? 'success' : 'secondary';
        return `<span class="badge bg-${variant}">${status}</span>`;
    },

    /**
     * Template para badge de rol
     */
    roleBadge(rol) {
        const variants = {
            'ADMIN': 'danger',
            'DOCENTE': 'primary',
            'PADRE': 'info',
            'ALUMNO': 'success'
        };
        const variant = variants[rol] || 'secondary';
        return `<span class="badge bg-${variant}">${rol}</span>`;
    },

    /**
     * Template para botón de acción
     */
    actionButton(icon, variant, title, onclick) {
        return `
            <button class="btn btn-sm btn-outline-${variant}" 
                    onclick="${onclick}" 
                    title="${title}">
                <i class="bi bi-${icon}"></i>
            </button>
        `;
    },

    /**
     * Template para grupo de botones de acción estándar
     */
    actionButtons(id, hasEdit = true, hasDelete = true, customButtons = []) {
        let buttons = '';

        if (hasEdit) {
            buttons += this.actionButton('pencil', 'primary', 'Editar', `edit('${id}')`);
        }

        customButtons.forEach(btn => {
            buttons += this.actionButton(btn.icon, btn.variant, btn.title, btn.onclick);
        });

        if (hasDelete) {
            buttons += this.actionButton('trash', 'danger', 'Eliminar', `deleteItem('${id}')`);
        }

        return buttons;
    },

    /**
     * Template para item de menú del sidebar
     */
    menuItem(item) {
        return `
            <li>
                <a href="${item.url}" class="nav-link ${item.active ? 'active' : ''}">
                    <i class="bi bi-${item.icon} me-2"></i>
                    ${item.label}
                </a>
            </li>
        `;
    },

    /**
     * Template para opción de select
     */
    selectOption(value, text, selected = false) {
        return `<option value="${value}" ${selected ? 'selected' : ''}>${text}</option>`;
    },

    /**
     * Template para spinner inline
     */
    spinnerInline(size = 'sm') {
        return `
            <div class="spinner-border spinner-border-${size} text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        `;
    },

    /**
     * Template para alert
     */
    alert(message, type = 'info', dismissible = true) {
        return `
            <div class="alert alert-${type} ${dismissible ? 'alert-dismissible fade show' : ''}" role="alert">
                ${message}
                ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' : ''}
            </div>
        `;
    },

    /**
     * Template para card vacío
     */
    emptyCard(title, message, icon = 'inbox') {
        return `
            <div class="card">
                <div class="card-body text-center py-5">
                    <i class="bi bi-${icon} display-1 text-muted mb-3"></i>
                    <h5 class="text-muted">${title}</h5>
                    <p class="text-muted">${message}</p>
                </div>
            </div>
        `;
    },

    /**
     * Template para paginación
     */
    pagination(currentPage, totalPages, onPageClick) {
        if (totalPages <= 1) return '';

        let html = '<nav><ul class="pagination pagination-sm justify-content-center">';

        // Botón anterior
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="${onPageClick}(${currentPage - 1}); return false;">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="${onPageClick}(${i}); return false;">${i}</a>
                    </li>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Botón siguiente
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="${onPageClick}(${currentPage + 1}); return false;">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;

        html += '</ul></nav>';
        return html;
    },

    /**
     * Template para breadcrumb
     */
    breadcrumb(items) {
        return `
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    ${items.map((item, index) => `
                        <li class="breadcrumb-item ${index === items.length - 1 ? 'active' : ''}">
                            ${index === items.length - 1
                ? item.label
                : `<a href="${item.url}">${item.label}</a>`
            }
                        </li>
                    `).join('')}
                </ol>
            </nav>
        `;
    },

    /**
     * Template para modal de confirmación
     */
    confirmModal(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return `
            <div class="modal fade" id="confirmModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                            <button type="button" class="btn btn-primary" id="confirmButton">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommonTemplates;
}
