// Padres Templates - Separación de HTML y JavaScript
// Este archivo contiene todos los templates HTML para el módulo de Padres

const PadreTemplates = {
    /**
     * Template para una fila de padre en la tabla
     */
    row(padre) {
        return `
            <tr>
                <td>${padre.apellidos}, ${padre.nombres}</td>
                <td>${padre.dni || 'N/A'}</td>
                <td>${padre.email || 'N/A'}</td>
                <td>${padre.celular || 'N/A'}</td>
                <td class="text-center">
                    <span class="badge bg-info">${padre.hijos_count || 0}</span>
                </td>
                <td>
                    <span class="badge ${padre.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                        ${padre.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editPadre('${padre.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="verHijos('${padre.id}')" title="Hijos">
                        <i class="bi bi-people"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePadre('${padre.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    /**
     * Template para estado de carga
     */
    loading(colspan = 7) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Template para estado vacío
     */
    empty(message = 'No hay padres registrados', colspan = 7) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center text-muted py-4">
                    <i class="bi bi-inbox me-2"></i>${message}
                </td>
            </tr>
        `;
    },

    /**
     * Template para error
     */
    error(message = 'Error al cargar datos', colspan = 7) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>${message}
                </td>
            </tr>
        `;
    },

    /**
     * Template para fila de hijo en el modal
     */
    hijoRow(hijo) {
        return `
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
        `;
    },

    /**
     * Template para estado de carga de hijos
     */
    hijosLoading() {
        return `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                </td>
            </tr>
        `;
    },

    /**
     * Template para estado vacío de hijos
     */
    hijosEmpty() {
        return `
            <tr>
                <td colspan="4" class="text-center text-muted">No tiene hijos asignados</td>
            </tr>
        `;
    },

    /**
     * Template para resultado de búsqueda de alumno
     */
    alumnoSearchResult(alumno) {
        return `
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
        `;
    },

    /**
     * Template para mensaje de no resultados en búsqueda
     */
    noSearchResults() {
        return `<div class="list-group-item text-muted">No se encontraron alumnos disponibles</div>`;
    },

    /**
     * Template para item de menú
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
    }
};

// Exportar para uso en padres.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PadreTemplates;
}
