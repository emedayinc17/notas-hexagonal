// ============================================
// CLIENTE API - TODAS LAS PETICIONES HTTP
// ============================================

// API_CONFIG se declara en utils.js, que se carga primero
// No redeclaramos aquí para evitar errores de sintaxis

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
                headers: getAuthHeaders(),
                body: JSON.stringify(claseData)
            });

            if (!response.ok) throw new Error('Error al crear clase');
            return { success: true, data: await response.json() };
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

            if (!response.ok) throw new Error('Error al obtener docentes activos');
            return { success: true, data: await response.json() };
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

    async listAlumnos(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/alumnos?offset=${offset}&limit=${limit}`,
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

    /**
     * CLASES Y ALUMNOS
     */
    async getAlumnosPorClase(claseId) {
        try {
            // Detectar rol del usuario para usar el endpoint correcto
            const userData = getUserData();
            const rol = userData?.rol?.nombre;

            let endpoint;
            if (rol === 'ADMIN') {
                endpoint = `${API_CONFIG.ACADEMICO_SERVICE}/v1/admin/clases/${claseId}/alumnos`;
            } else if (rol === 'DOCENTE') {
                endpoint = `${API_CONFIG.ACADEMICO_SERVICE}/v1/docente/clases/${claseId}/alumnos`;
            } else {
                throw new Error('Rol no autorizado para ver alumnos de clases');
            }

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

            if (!response.ok) throw new Error('Error al crear relación');
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

            if (!response.ok) throw new Error('Error al crear matrícula');
            return { success: true, data: await response.json() };
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

    async listMatriculas(offset = 0, limit = 50) {
        try {
            const response = await fetch(
                `${API_CONFIG.PERSONAS_SERVICE}/v1/matriculas?offset=${offset}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) throw new Error('Error al listar matrículas');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
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
