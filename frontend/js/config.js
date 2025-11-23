// ============================================
// CONFIGURACIÓN DEL FRONTEND
// Este archivo puede ser reemplazado por ConfigMap en Kubernetes
// ============================================

/**
 * Configuración de URLs de los servicios backend
 * 
 * DESARROLLO LOCAL:
 * - Usa localhost con puertos específicos
 * 
 * PRODUCCIÓN/KUBERNETES:
 * - Reemplaza este archivo con valores del ConfigMap
 * - Ejemplo: http://iam-service.default.svc.cluster.local
 */
window.APP_CONFIG = {
    // URLs de los microservicios
    API_ENDPOINTS: {
        IAM_SERVICE: 'http://localhost:8001',
        ACADEMICO_SERVICE: 'http://localhost:8002',
        PERSONAS_SERVICE: 'http://localhost:8003',
        NOTAS_SERVICE: 'http://localhost:8004'
    },
    
    // Configuración de autenticación
    AUTH: {
        TOKEN_KEY: 'sga_auth_token',
        USER_KEY: 'sga_user_data',
        TOKEN_EXPIRY_HOURS: 24
    },
    
    // Configuración de la aplicación
    APP: {
        NAME: 'Sistema de Gestión de Notas',
        VERSION: '1.0.0',
        ENVIRONMENT: 'development' // development | staging | production
    },
    
    // Configuración de UI
    UI: {
        ITEMS_PER_PAGE: 20,
        MAX_ITEMS_PER_PAGE: 100,
        TOAST_DURATION: 3000,
        ALERT_DURATION: 5000
    },
    
    // Feature flags (para activar/desactivar funcionalidades)
    FEATURES: {
        ENABLE_REGISTRATION: true,
        ENABLE_PASSWORD_RESET: false,
        ENABLE_NOTIFICATIONS: true,
        ENABLE_EXPORTS: true
    },
    
    // URLs externas (si aplica)
    EXTERNAL: {
        DOCS_URL: '/docs',
        SUPPORT_URL: 'mailto:soporte@colegio.com',
        HELP_URL: '/help'
    }
};

// Validar que las configuraciones estén completas
(function validateConfig() {
    const required = ['IAM_SERVICE', 'ACADEMICO_SERVICE', 'PERSONAS_SERVICE', 'NOTAS_SERVICE'];
    const missing = required.filter(key => !window.APP_CONFIG.API_ENDPOINTS[key]);
    
    if (missing.length > 0) {
        console.error('⚠️ Configuración incompleta. Faltan:', missing);
        console.warn('Usando configuración por defecto para desarrollo local');
    } else {
        console.log('✅ Configuración cargada correctamente');
        console.log('   Ambiente:', window.APP_CONFIG.APP.ENVIRONMENT);
        console.log('   Versión:', window.APP_CONFIG.APP.VERSION);
    }
})();
