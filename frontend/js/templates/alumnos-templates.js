// Alumnos Templates - Separación de HTML y JavaScript
// Este archivo contiene todos los templates HTML para el módulo de Alumnos

const AlumnoTemplates = {
    /**
     * Template para una fila de alumno en la tabla
     */
    row(alumno) {
        return `
            <tr>
                <td>${alumno.codigo_alumno}</td>
                <td>${alumno.apellidos}, ${alumno.nombres}</td>
                <td>${alumno.dni || 'N/A'}</td>
                <td>${alumno.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toLocaleDateString() : 'N/A'}</td>
                <td>${alumno.genero === 'M' ? 'Masculino' : 'Femenino'}</td>
                <td>${alumno.email || 'N/A'}</td>
                <td>
                    <span class="badge ${alumno.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                        ${alumno.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editAlumno('${alumno.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="verFamiliares('${alumno.id}')" title="Familiares">
                        <i class="bi bi-people"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAlumno('${alumno.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    /**
     * Template para estado de carga
     */
    loading(colspan = 8) {
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
    empty(message = 'No hay alumnos registrados', colspan = 8) {
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
    error(message = 'Error al cargar datos', colspan = 8) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>${message}
                </td>
            </tr>
        `;
    },

    /**
     * Template para fila de familiar en el modal
     */
    familiarRow(relacion) {
        return `
            <tr>
                <td>${relacion.padre.apellidos}, ${relacion.padre.nombres}</td>
                <td>${relacion.padre.dni}</td>
                <td><span class="badge bg-info">${relacion.tipo_relacion}</span></td>
                <td>${relacion.es_contacto_principal ? '<i class="bi bi-check-circle-fill text-success"></i>' : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRelacion('${relacion.id}')" title="Eliminar relación">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    /**
     * Template para estado de carga de familiares
     */
    familiaresLoading() {
        return `
            <tr>
                <td colspan="5" class="text-center">Cargando...</td>
            </tr>
        `;
    },

    /**
     * Template para estado vacío de familiares
     */
    familiaresEmpty() {
        return `
            <tr>
                <td colspan="5" class="text-center text-muted py-3">
                    <i class="bi bi-people me-2"></i>No hay familiares asignados
                </td>
            </tr>
        `;
    },

    /**
     * Template para resultado de búsqueda de padre
     */
    padreSearchResult(padre) {
        return `
            <a href="#" class="list-group-item list-group-item-action" 
               onclick="selectPadre('${padre.id}', '${padre.apellidos}, ${padre.nombres}'); return false;">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${padre.apellidos}, ${padre.nombres}</strong>
                        <br><small class="text-muted">DNI: ${padre.dni || 'N/A'}</small>
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
        return `<div class="list-group-item text-muted">No se encontraron padres disponibles</div>`;
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

// Exportar para uso en alumnos.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlumnoTemplates;
}
