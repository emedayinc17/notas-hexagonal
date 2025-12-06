// ============================================
// GESTIÓN DE AUTENTICACIÓN Y JWT
// ============================================

// Obtener configuración desde config.js
const AUTH_CONFIG = window.APP_CONFIG?.AUTH || {
    TOKEN_KEY: 'sga_auth_token',
    USER_KEY: 'sga_user_data',
    TOKEN_EXPIRY_HOURS: 24
};

const AUTH_KEY = AUTH_CONFIG.TOKEN_KEY;
const USER_KEY = AUTH_CONFIG.USER_KEY;

/**
 * Guarda el token de autenticación
 */
function saveAuthToken(token) {
    // Guardar en memoria como fallback (por si el navegador bloquea storage)
    try {
        localStorage.setItem(AUTH_KEY, token);
    } catch (e) {
        console.warn('[AUTH] localStorage inaccesible, usando fallback en memoria');
    }
    try { window.__AUTH_TOKEN = token; } catch (e) { }
    // Guardar cookie como fallback para navegadores con Tracking Prevention
    try { setCookie(AUTH_KEY, token, AUTH_CONFIG.TOKEN_EXPIRY_HOURS); } catch (e) { }
}

// Helper: set cookie (simple, dev-only usage)
function setCookie(name, value, hours) {
    try {
        const d = new Date();
        d.setTime(d.getTime() + (hours || AUTH_CONFIG.TOKEN_EXPIRY_HOURS) * 60 * 60 * 1000);
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + "; " + expires + "; path=/";
    } catch (e) { }
}

function getCookie(name) {
    try {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    } catch (e) { }
    return null;
}

/**
 * Obtiene el token de autenticación
 */
function getAuthToken() {
    // Intentar leer de storage, si falla usar fallback en memoria
    try {
        const t = localStorage.getItem(AUTH_KEY);
        if (t) return t;
    } catch (e) {
        console.warn('[AUTH] Lectura de localStorage falló, usando fallback si existe');
    }
    try {
        // Intentar cookie antes del fallback en memoria
        const c = getCookie(AUTH_KEY);
        if (c) return c;
    } catch (e) { }
    try { return window.__AUTH_TOKEN || null; } catch (e) { return null; }
}

/**
 * Guarda los datos del usuario
 */
function saveUserData(userData) {
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (e) {
        console.warn('[AUTH] No se pudo guardar userData en localStorage');
        try { window.__USER_DATA = userData; } catch (e) { }
    }
}

/**
 * Obtiene los datos del usuario
 */
function getUserData() {
    try {
        const data = localStorage.getItem(USER_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        try { return window.__USER_DATA || null; } catch (e) { return null; }
    }
    try { return window.__USER_DATA || null; } catch (e) { return null; }
}

/**
 * Verifica si el usuario está autenticado
 */
function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;
    return !isTokenExpired();
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    // Borrar cookie también
    document.cookie = `${AUTH_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    window.location.href = '/';
}

/**
 * Obtiene el rol del usuario actual
 */
function getUserRole() {
    const userData = getUserData();
    return userData?.rol?.nombre || null;
}

/**
 * Verifica si el usuario tiene un rol específico
 */
function hasRole(role) {
    return getUserRole() === role;
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 */
function hasAnyRole(roles) {
    const userRole = getUserRole();
    return roles.includes(userRole);
}

/**
 * Protege una página requiriendo autenticación
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

/**
 * Protege una página requiriendo un rol específico
 */
function requireRole(allowedRoles) {
    if (!requireAuth()) return false;

    // Aceptar tanto string como array
    if (typeof allowedRoles === 'string') allowedRoles = [allowedRoles];

    const userRole = getUserRole();
    if (!Array.isArray(allowedRoles) || !allowedRoles.includes(userRole)) {
        showToast('No tienes permisos para acceder a esta página', 'danger');
        setTimeout(() => {
            window.location.href = '/pages/dashboard.html';
        }, 2000);
        return false;
    }
    return true;
}

/**
 * Obtiene headers con autenticación para peticiones HTTP
 */
function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        // No token disponible — log para debugging (temporal)
        console.warn('[AUTH] getAuthHeaders: no token disponible');
    }
    return headers;
}

/**
 * Decodifica un JWT token (sin verificar firma)
 */
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error decoding JWT:', e);
        return null;
    }
}

/**
 * Verifica si el token ha expirado
 */
function isTokenExpired() {
    const token = getAuthToken();
    if (!token) return true;

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
}

/**
 * Actualiza la información del usuario desde el servidor
 */
async function refreshUserData() {
    try {
        const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/users/me`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const userData = await response.json();
            saveUserData(userData);
            return userData;
        } else if (response.status === 401) {
            logout();
        }
    } catch (error) {
        console.error('Error refreshing user data:', error);
    }
    return null;
}

/**
 * Middleware para verificar autenticación antes de cada petición
 */
function checkAuthBeforeRequest() {
    if (isTokenExpired()) {
        showToast('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'warning');
        setTimeout(logout, 2000);
        return false;
    }
    return true;
}

/**
 * Inicializa el sistema de autenticación en cada página
 */
function initAuth() {
    // Verificar token expirado cada 5 minutos
    setInterval(() => {
        if (isAuthenticated() && isTokenExpired()) {
            showToast('Tu sesión ha expirado', 'warning');
            setTimeout(logout, 2000);
        }
    }, 5 * 60 * 1000);
}

// Inicializar autenticación al cargar el script
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initAuth);
}
