/**
 * Archivo centralizado de mensajes de la aplicación.
 * Permite mantener consistencia y facilita el mantenimiento de textos.
 */
const MSG = {
    // Mensajes Generales
    GENERAL: {
        ERROR: 'Error',
        EXITO: 'Éxito',
        ADVERTENCIA: 'Advertencia',
        OPERACION_NO_PERMITIDA: 'Operación no permitida',
        ERROR_GENERICO: 'Ocurrió un error inesperado. Por favor, intente nuevamente.',
        CAMPOS_REQUERIDOS: 'Por favor completa todos los campos requeridos.',
        CONFIRM_ELIMINAR_TITULO: '¿Eliminar registro?',
        CONFIRM_ELIMINAR_MSG: (nombre) => `¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`
    },

    // Módulo de Secciones
    SECCIONES: {
        CREAR_EXITO: 'Sección creada correctamente.',
        ACTUALIZAR_EXITO: 'Sección actualizada correctamente.',
        ELIMINAR_EXITO: 'Sección eliminada correctamente.',
        NO_ENCONTRADA: 'Sección no encontrada.',

        // Mensajes de Validación Específicos
        ERROR_INACTIVAR_CON_ALUMNOS: (count) => `No es posible inactivar esta sección porque tiene <b>${count} alumnos matriculados</b>.<br>Debe dar de baja a los alumnos primero.`,
        ERROR_ELIMINAR_CON_ALUMNOS: (count) => `No es posible eliminar esta sección porque tiene <b>${count} alumnos matriculados</b>.<br>Debe dar de baja a los alumnos antes de eliminar la sección.`,

        // Títulos de Modales
        TITULO_NUEVA: 'Nueva Sección',
        TITULO_EDITAR: 'Editar Sección'
    },

    // Módulo de Periodos
    PERIODOS: {
        ERROR_ELIMINAR_CON_CLASES: (count) => `No es posible eliminar este periodo porque tiene <b>${count} clases activas</b>.<br>Debe finalizar o cancelar las clases antes de eliminar el periodo.`,
        ERROR_CERRAR_CON_CLASES: (count) => `No es posible cerrar este periodo porque tiene <b>${count} clases activas</b>.<br>Debe finalizar las clases primero.`
    }
};
