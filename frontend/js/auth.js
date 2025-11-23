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
    localStorage.setItem(AUTH_KEY, token);
}

/**
 * Obtiene el token de autenticación
 */
function getAuthToken() {
    return localStorage.getItem(AUTH_KEY);
}

/**
 * Guarda los datos del usuario
 */
function saveUserData(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

/**
 * Obtiene los datos del usuario
 */
function getUserData() {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
}

/**
 * Verifica si el usuario está autenticado
 */
function isAuthenticated() {
    return getAuthToken() !== null;
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
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
        window.location.href = '/frontend/index.html';
        return false;
    }
    return true;
}

/**
 * Protege una página requiriendo un rol específico
 */
function requireRole(allowedRoles) {
    if (!requireAuth()) return false;
    
    const userRole = getUserRole();
    if (!allowedRoles.includes(userRole)) {
        showToast('No tienes permisos para acceder a esta página', 'danger');
        setTimeout(() => {
            window.location.href = '/frontend/pages/dashboard.html';
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
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
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
