// ============================================
// CLIENTE API - TODAS LAS PETICIONES HTTP
// ============================================

// API_CONFIG se declara en utils.js, que se carga primero
// No redeclaramos aquí para evitar errores de sintaxis

// Global fetch wrapper: añade headers de auth y logging ligero (temporal, para debugging)
(() => {
    try {
        const nativeFetch = window.fetch.bind(window);
        window.fetch = async function (input, init) {
            init = init || {};
            try {
                // Merge auth headers if available
                if (typeof getAuthHeaders === 'function') {
                    init.headers = Object.assign({}, init.headers || {}, getAuthHeaders());
                }
            } catch (e) {
                console.warn('[API] getAuthHeaders error', e);
            }

            try {
                console.debug('[API] Request', (init.method || 'GET'), input, 'Auth?', !!(init.headers && (init.headers.Authorization || init.headers.authorization)));
            } catch (e) { }

            const res = await nativeFetch(input, init);

            try {
                const clone = res.clone();
                const text = await clone.text();
                console.debug('[API] Response', input, res.status, text);
            } catch (e) {
                // ignore body parse errors
            }

            return res;
        };
    } catch (e) {
        console.warn('[API] No se pudo envolver fetch globalmente', e);
    }
})();

// ============================================
// IAM SERVICE - AUTENTICACIÓN Y USUARIOS
// ============================================

const IAMService = {
    /**
     * Registro de nuevo usuario
     */
    async register(userData) {
        try {
            const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el registro');
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Login de usuario
     */
    async login(email, password) {
        try {
            const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Credenciales inválidas');
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener usuario actual
     */
    async getCurrentUser() {
        try {
            const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/users/me`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener usuario');

            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Listar todos los usuarios (ADMIN)
     */
    async listUsers(offset = 0, limit = 20) {
        try {
            const response = await fetch(
                `${API_CONFIG.IAM_SERVICE}/v1/admin/users?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar usuarios');

            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Crear nuevo usuario (ADMIN)
     */
    async createUser(userData) {
        try {
            const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/admin/users`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear usuario');
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar usuario existente (ADMIN)
     */
    /**
     * Actualizar usuario existente (ADMIN)
     */
    async updateUser(userId, userData) {
        try {
            const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/admin/users/${userId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar usuario');
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Eliminar usuario (ADMIN)
     */
    async deleteUser(userId) {
        try {
            const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/admin/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar usuario');
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener perfil del docente (DOCENTE)
     */
    async getDocentePerfil() {
        try {
            const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/docentes/perfil`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener perfil del docente');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Listar colegas docentes (DOCENTE)
     */
    async getDocenteColegas() {
        try {
            const response = await fetch(`${API_CONFIG.IAM_SERVICE}/v1/docentes/colegas`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener lista de colegas');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// ACADÉMICO SERVICE - ESTRUCTURA ACADÉMICA
// ============================================

const AcademicoService = {
    /**
     * GRADOS
     */
    async createGrado(gradoData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/grados`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(gradoData)
            });

            if (!response.ok) throw new Error('Error al crear grado');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async listGrados(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/grados?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar grados');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateGrado(gradoId, gradoData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/grados/${gradoId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(gradoData)
            });

            if (!response.ok) throw new Error('Error al actualizar grado');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteGrado(gradoId) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/grados/${gradoId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar grado');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * CURSOS
     */
    async createCurso(cursoData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/cursos`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(cursoData)
            });

            if (!response.ok) throw new Error('Error al crear curso');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async listCursos(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/cursos?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar cursos');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateCurso(cursoId, cursoData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/cursos/${cursoId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(cursoData)
            });

            if (!response.ok) throw new Error('Error al actualizar curso');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteCurso(cursoId) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/cursos/${cursoId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar curso');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * SECCIONES
     */
    async createSeccion(seccionData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/secciones`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(seccionData)
            });

            if (!response.ok) throw new Error('Error al crear sección');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async listSecciones(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/secciones?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar secciones');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateSeccion(seccionId, seccionData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/secciones/${seccionId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(seccionData)
            });

            if (!response.ok) throw new Error('Error al actualizar sección');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteSeccion(seccionId) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/secciones/${seccionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar sección');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * PERIODOS
     */
    async listTiposPeriodo(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/periodos/tipos?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar tipos de periodo');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async createTipoPeriodo(tipoData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/periodos/tipos`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(tipoData)
            });

            if (!response.ok) throw new Error('Error al crear tipo de periodo');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async createPeriodo(periodoData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/periodos`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(periodoData)
            });

            if (!response.ok) throw new Error('Error al crear periodo');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async listPeriodos(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/periodos?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar periodos');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Backwards-compatible aliases (métodos antiguos usados en algunas páginas)
    async getPeriodos(offset = 0, limit = 50) {
        return this.listPeriodos(offset, limit);
    },
    async getCursos(offset = 0, limit = 50) {
        return this.listCursos(offset, limit);
    },
    async getClases(offset = 0, limit = 50) {
        return this.listClases(offset, limit);
    },

    async updatePeriodo(periodoId, periodoData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/periodos/${periodoId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(periodoData)
            });

            if (!response.ok) throw new Error('Error al actualizar periodo');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deletePeriodo(periodoId) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/periodos/${periodoId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar periodo');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * CLASES
     */
    async createClase(claseData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/clases`, {
                method: 'POST',
                headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
                body: JSON.stringify(claseData)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data.message || data.error || 'Error al crear clase';
                return { success: false, error: message, status: response.status };
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async listClases(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/clases?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar clases');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getClasesDocente() {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/docente/clases`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al obtener clases del docente');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Alias para compatibilidad
    async listClasesDocente() {
        return this.getClasesDocente();
    },

    async updateClase(claseId, claseData) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/clases/${claseId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(claseData)
            });

            if (!response.ok) throw new Error('Error al actualizar clase');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteClase(claseId) {
        try {
            const response = await fetch(`${API_CONFIG.ACADEMICO_SERVICE}/v1/clases/${claseId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar clase');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * ESCALAS DE CALIFICACIÓN
     */
    async listEscalas(offset = 0, limit = 20) {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/escalas?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar escalas');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * DOCENTES ACTIVOS
     */
    async getDocentesActivos() {
        try {
            const response = await fetch(
                `${API_CONFIG.ACADEMICO_SERVICE}/v1/docentes-activos`,
                { headers: getAuthHeaders() }
            );

            if (response.ok) {
                return { success: true, data: await response.json() };
            }

            // Si el servidor responde 403 (forbidden), intentar fallback a IAM
            if (response.status === 403) {
                try {
                    const iam = await IAMService.listUsers(0, 200);
                    if (iam.success) {
                        const users = iam.data.users || iam.data || [];
                        const docentes = users.filter(u => u.rol?.nombre === 'DOCENTE');
                        return { success: true, data: { docentes } };
                    }
                } catch (e) {
                    // continue to error return below
                }
                return { success: false, error: 'Acceso denegado al servicio Académico (403)', status: 403 };
            }

            // Otros errores: parsear mensaje si hay
            let body = {};
            try { body = await response.json(); } catch (e) { }
            return { success: false, error: body.message || body.error || `Error ${response.status}`, status: response.status };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// PERSONAS SERVICE - ALUMNOS Y PADRES
// ============================================

const PersonasService = {
    /**
     * ALUMNOS
     */
    async createAlumno(alumnoData) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/alumnos`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(alumnoData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Error al crear alumno');
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error en createAlumno:', error);
            return { success: false, error: error.message };
        }
    },

    async listAlumnos(offset = 0, limit = 50, search = null) {
        try {
            const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
            if (search) params.append('search', search);
            
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/alumnos?${params.toString()}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar alumnos');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Alias para compatibilidad
    async getAlumnos(offset = 0, limit = 100) {
        return this.listAlumnos(offset, limit);
    },

    async getAlumno(id) {
        try {
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/alumnos/${id}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al obtener alumno');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateAlumno(alumnoId, alumnoData) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/alumnos/${alumnoId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(alumnoData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Error al actualizar alumno');
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error en updateAlumno:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteAlumno(alumnoId) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/alumnos/${alumnoId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar alumno');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getNextCodigoAlumno() {
        try {
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/alumnos/next-codigo`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al obtener siguiente código');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * CLASES Y ALUMNOS
     */
    async getAlumnosPorClase(claseId) {
        try {
            // Detectar rol del usuario para usar el endpoint correcto
            const userData = getUserData();
            const rol = userData?.rol?.nombre;

            // Llamar directamente al Personas Service para evitar doble verificación
            // El endpoint admin de Personas acepta DOCENTE y ADMIN y retorna alumnos.
            const endpoint = `${API_CONFIG.PERSONAS_SERVICE}/v1/clases/${claseId}/alumnos`;
            const response = await fetch(endpoint, { headers: getAuthHeaders() });

            if (!response.ok) throw new Error('Error al obtener alumnos de la clase');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * PADRES
     */
    async createPadre(padreData) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/padres`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(padreData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Error al crear padre');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error('Error en createPadre:', error);
            return { success: false, error: error.message };
        }
    },

    async listPadres(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/padres?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar padres');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updatePadre(padreId, padreData) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/padres/${padreId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(padreData)
            });

            if (!response.ok) throw new Error('Error al actualizar padre');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deletePadre(padreId) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/padres/${padreId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar padre');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * RELACIONES PADRE-ALUMNO
     */
    async createRelacion(relacionData) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/relaciones`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(relacionData)
            });

            if (!response.ok) {
                // Intentar obtener el mensaje de error del backend
                try {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || errorData.error || `Error ${response.status}`;
                    return { success: false, error: errorMessage, status: response.status };
                } catch {
                    return { success: false, error: `Error ${response.status}: ${response.statusText}`, status: response.status };
                }
            }

            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getPadresDeAlumno(alumnoId) {
        try {
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/relaciones/alumno/${alumnoId}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al obtener padres del alumno');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getHijosDePadre(padreId) {
        try {
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/relaciones/padre/${padreId}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al obtener hijos del padre');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * MATRÍCULAS
     */
    async createMatricula(matriculaData) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/matriculas`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(matriculaData)
            });

            // Intentar parsear cuerpo de respuesta para mensajes de error explícitos
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data.message || data.error || `Error ${response.status}`;
                return { success: false, error: message, status: response.status };
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getMatricula(id) {
        try {
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/matriculas/${id}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al obtener matrícula');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async listMatriculas(offset = 0, limit = 50, alumnoId = null, claseId = null, periodoId = null, search = null, status = null) {
        try {
            // Construir parámetros con soporte para filtros opcionales
            const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
            if (alumnoId) params.append('alumno_id', alumnoId);
            if (claseId) params.append('clase_id', claseId);
            if (periodoId) params.append('periodo_id', periodoId);
            if (search) params.append('search', search);
            if (status) params.append('status', status);
            params.append('_ts', String(Date.now())); // cache-buster

            const url = `${API_CONFIG.PERSONAS_SERVICE}/v1/matriculas?${params.toString()}`;
            const response = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data.message || data.error || `Error ${response.status}`;
                return { success: false, error: message, status: response.status };
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Backwards-compatible alias para llamadas antiguas desde frontend
    async getMatriculas(offset = 0, limit = 50) {
        return this.listMatriculas(offset, limit);
    },

    async deleteMatricula(matriculaId) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/matriculas/${matriculaId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar matrícula');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Vincular padre con alumno
     */
    async linkPadreAlumno(relacionData) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/relaciones`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(relacionData)
            });

            if (!response.ok) throw new Error('Error al vincular padre con alumno');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Desvincular padre de alumno
     */
    async unlinkPadreAlumno(relacionId) {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/relaciones/${relacionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al desvincular padre de alumno');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// NOTAS SERVICE - CALIFICACIONES Y ALERTAS
// ============================================

const NotasService = {
    /**
     * NOTAS
     */
    async createNota(notaData) {
        try {
            const response = await fetch(`${API_CONFIG.NOTAS_SERVICE}/v1/notas`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(notaData)
            });

            if (!response.ok) throw new Error('Error al registrar nota');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async createNotasBatch(notasData) {
        try {
            const response = await fetch(`${API_CONFIG.NOTAS_SERVICE}/v1/notas/batch`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ notas: notasData })
            });

            if (!response.ok) throw new Error('Error al registrar notas en lote');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async listNotas(alumnoId = null, claseId = null, periodoId = null, offset = 0, limit = 100) {
        try {
            const params = new URLSearchParams({
                offset: offset.toString(),
                limit: limit.toString()
            });

            if (alumnoId) params.append('alumno_id', alumnoId);
            if (claseId) params.append('clase_id', claseId);
            if (periodoId) params.append('periodo_id', periodoId);

            const response = await fetch(
                `${API_CONFIG.NOTAS_SERVICE}/v1/notas?${params}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar notas');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Listar notas para panel admin con soporte de filtros y paginación del servidor.
     * filters: { periodo_id, grado_id, seccion_id, curso_id, search }
     */
    async listNotasAdmin(filters = {}, offset = 0, limit = 20) {
        try {
            const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
            if (filters.periodo_id) params.append('periodo_id', filters.periodo_id);
            if (filters.grado_id) params.append('grado_id', filters.grado_id);
            if (filters.seccion_id) params.append('seccion_id', filters.seccion_id);
            if (filters.curso_id) params.append('curso_id', filters.curso_id);
            if (filters.search) params.append('search', filters.search);
            // cache-buster
            params.append('_ts', String(Date.now()));

            const url = `${API_CONFIG.NOTAS_SERVICE}/v1/notas?${params.toString()}`;
            const response = await fetch(url, { headers: getAuthHeaders() });

            if (!response.ok) throw new Error('Error al listar notas (admin)');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Compatibilidad: alias antiguo getNotas()
    async getNotas(alumnoId = null, claseId = null, periodoId = null, offset = 0, limit = 100) {
        return this.listNotas(alumnoId, claseId, periodoId, offset, limit);
    },

    async getNotasAlumno(alumnoId, offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.NOTAS_SERVICE}/v1/notas?alumno_id=${alumnoId}&offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al obtener notas del alumno');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateNota(notaId, notaData) {
        try {
            const response = await fetch(`${API_CONFIG.NOTAS_SERVICE}/v1/notas/${notaId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(notaData)
            });

            if (!response.ok) throw new Error('Error al actualizar nota');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteNota(notaId) {
        try {
            const response = await fetch(`${API_CONFIG.NOTAS_SERVICE}/v1/notas/${notaId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar nota');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * TIPOS DE EVALUACIÓN
     */
    async listTiposEvaluacion(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.NOTAS_SERVICE}/v1/tipos-evaluacion?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar tipos de evaluación');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * ESCALAS DE CALIFICACIÓN (Proxy a Academico Service con endpoints diferenciados)
     */
    async listEscalas(offset = 0, limit = 20) {
        try {
            const userData = getUserData();
            const rol = userData?.rol?.nombre;

            let endpoint = `${API_CONFIG.ACADEMICO_SERVICE}/v1/escalas`; // Default/Fallback

            if (rol === 'ADMIN') {
                endpoint = `${API_CONFIG.ACADEMICO_SERVICE}/v1/admin/escalas`;
            } else if (rol === 'DOCENTE') {
                endpoint = `${API_CONFIG.ACADEMICO_SERVICE}/v1/docente/escalas`;
            }

            const response = await fetch(
                `${endpoint}?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar escalas');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * ALERTAS
     */
    async getAlertas(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.NOTAS_SERVICE}/v1/alertas?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al obtener alertas');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async marcarAlertaLeida(alertaId) {
        try {
            const response = await fetch(
                `${API_CONFIG.NOTAS_SERVICE}/v1/alertas/${alertaId}/marcar-leida`,
                {
                    method: 'PATCH',
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) throw new Error('Error al marcar alerta como leída');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Alias para mantener consistencia con el código frontend
    async getNotasPorAlumno(alumnoId, offset = 0, limit = 50) {
        return this.getNotasAlumno(alumnoId, offset, limit);
    }
    ,

    /**
     * DASHBOARD - endpoints agregados en backend
     */
    async getDashboardAdmin() {
        try {
            const response = await fetch(`${API_CONFIG.NOTAS_SERVICE}/v1/dashboard/admin`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener dashboard admin');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getDashboardDocente() {
        try {
            const response = await fetch(`${API_CONFIG.NOTAS_SERVICE}/v1/dashboard/docente`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener dashboard docente');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getDashboardPadre() {
        try {
            const response = await fetch(`${API_CONFIG.NOTAS_SERVICE}/v1/dashboard/padre`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener dashboard padre');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// SERVICIO ESPECÍFICO PARA PADRES
// ============================================

const PadreService = {
    /**
     * HIJOS DEL PADRE ACTUAL
     */
    async getMisHijos() {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/padres/mis-hijos`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) throw new Error('Error al obtener mis hijos');
            return { success: true, data: await response.json() };
        } catch (error) {
            console.error('Error in getMisHijos:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * PERFIL DEL PADRE ACTUAL
     */
    async getPerfilPadre() {
        try {
            const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/padres/perfil`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) throw new Error('Error al obtener perfil padre');
            return { success: true, data: await response.json() };
        } catch (error) {
            console.error('Error in getPerfilPadre:', error);
            return { success: false, error: error.message };
        }
    }
};
