// ============================================
// CONFIGURACIÓN GLOBAL DE LA APLICACIÓN
// ============================================

/**
 * Configuración almacenada en localStorage
 */
const APP_SETTINGS_KEY = 'sga_app_settings';

/**
 * Configuración por defecto
 */
const DEFAULT_SETTINGS = {
    pagination: {
        itemsPerPage: 20,
        showPageInfo: true,
        maxVisiblePages: 5
    },
    table: {
        stripedRows: true,
        hoverEffect: true,
        compactMode: false
    },
    filters: {
        autoApply: false, // true = aplicar filtros automáticamente, false = botón filtrar
        debounceTime: 500 // milisegundos para búsqueda
    },
    display: {
        dateFormat: 'es-PE', // formato de fecha
        timeFormat: '24h',
        theme: 'light'
    }
};

/**
 * Obtiene la configuración actual
 */
function getAppSettings() {
    try {
        const stored = localStorage.getItem(APP_SETTINGS_KEY);
        if (stored) {
            const settings = JSON.parse(stored);
            // Merge con defaults para agregar nuevas configuraciones
            return mergeDeep(DEFAULT_SETTINGS, settings);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
}

/**
 * Guarda la configuración
 */
function saveAppSettings(settings) {
    try {
        localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

/**
 * Actualiza una configuración específica
 */
function updateSetting(path, value) {
    const settings = getAppSettings();
    const keys = path.split('.');
    let obj = settings;
    
    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = value;
    return saveAppSettings(settings);
}

/**
 * Obtiene una configuración específica
 */
function getSetting(path, defaultValue = null) {
    const settings = getAppSettings();
    const keys = path.split('.');
    let value = settings;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return defaultValue;
        }
    }
    
    return value;
}

/**
 * Resetea la configuración a valores por defecto
 */
function resetAppSettings() {
    return saveAppSettings({ ...DEFAULT_SETTINGS });
}

/**
 * Merge profundo de objetos
 */
function mergeDeep(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
}

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// Exportar para uso global
window.AppSettings = {
    get: getAppSettings,
    save: saveAppSettings,
    update: updateSetting,
    getSetting: getSetting,
    reset: resetAppSettings,
    DEFAULT: DEFAULT_SETTINGS
};
