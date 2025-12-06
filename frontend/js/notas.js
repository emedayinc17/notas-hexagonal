// notas.js - Gestión de Notas del Sistema
// Refactorizado completamente para eliminar errores de sintaxis

// Evitar redeclaraciones si otros scripts ya definieron `currentUser`
if (typeof currentUser === 'undefined') currentUser = null;
let tiposEvaluacion = [];
let cursos = [];
let secciones = [];
let grados = [];
let periodos = [];
let docentes = [];
let alumnos = [];
let matriculas = [];
let clases = [];
let alumnosAsignados = []; // Alumnos asignados al docente (para notas-siagie.js)
let escalas = []; // Escalas de calificación

// Paginación específica para la vista de DOCENTE
let docentePagination = { page: 1, pageSize: 20, totalPages: 1, totalItems: 0 };

let vistaMulticursoCompacta = false;
let vistaIndividualCompacta = false;
let vistaMulticursoExtendida = false;
let vistaIndividualExtendida = false;

const estadoMulticurso = {
    alumno: null,
    notas: [],
    numNotas: 4,
    valores: null
};

const estadoIndividual = {
    alumnoId: null,
    claseActual: null,
    clasesSeccion: [],
    notas: [],
    numNotas: 4,
    valores: null
};

// Admin cache / pagination
// Client-side cache (legacy) and server-mode pagination state
let adminStudentsList = [];
let adminPagination = { page: 1, pageSize: 20, totalPages: 1 };

// Server-side pagination mode: don't fetch entire dataset, request pages from backend
let adminServerMode = true;
let adminServerPageItems = []; // items for current server page
let adminServerPagination = { page: 1, pageSize: 20, totalPages: 1, totalItems: 0 };

// Configurables: pueden sobreescribirse desde `window.APP_CONFIG` antes de cargar este script
const ALUMNOS_CACHE_TTL_MS = (window.APP_CONFIG && parseInt(window.APP_CONFIG.ALUMNOS_CACHE_TTL_MS)) || (10 * 60 * 1000); // 10 minutos
const ALUMNOS_CONCURRENCY = (window.APP_CONFIG && parseInt(window.APP_CONFIG.ALUMNOS_CONCURRENCY)) || 8;

async function initNotasPage() {
    try {
        showLoading();

        currentUser = getUserData();
        if (!currentUser) {
            showToast('No hay sesión activa. Redirigiendo al login...', 'warning');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
            return;
        }

        const userRole = currentUser?.rol?.nombre || 'UNKNOWN';

        showToast(`Bienvenido ${currentUser.nombres || currentUser.username || 'Usuario'} - Rol: ${userRole}`, 'success');

        loadSidebarMenu();

        if (userRole === 'ADMIN') {
            // Temporalmente desactivar la vista de Notas para ADMIN (evita cargas largas/errores).
            showToast('La sección de Notas está temporalmente deshabilitada para administradores.', 'info');
            setTimeout(() => { window.location.href = '../pages/dashboard.html'; }, 800);
            return;
        } else if (userRole === 'DOCENTE') {
            await initializeDocenteView();
        } else {
            showToast(`Acceso denegado para el rol ${userRole}`, 'danger');
            setTimeout(() => {
                window.location.href = '../pages/dashboard.html';
            }, 2000);
            return;
        }

        hideLoading();
    } catch (error) {
        console.error('Error al inicializar página de notas:', error);
        showToast('Error al cargar la página: ' + error.message, 'danger');
        hideLoading();
    }
}

/**
 * Carga el menú del sidebar
 */
function loadSidebarMenu() {
    const userRole = currentUser?.rol?.nombre || 'UNKNOWN';
    const sidebarMenu = document.getElementById('sidebarMenu');
    if (!sidebarMenu) return;

    let menuItems = [];

    if (userRole === 'DOCENTE') {
        menuItems = [
            { page: '../pages/dashboard.html', label: 'Dashboard', icon: 'grid-fill', active: false },
            { page: 'mis-clases.html', label: 'Mis Clases', icon: 'door-open-fill', active: false },
            { page: 'notas.html', label: 'Gestionar Notas', icon: 'clipboard-check', active: true }
        ];
    } else if (userRole === 'ADMIN') {
        // Admin menu items - temporal: ocultamos el acceso directo a Notas mientras se investiga fallo
        menuItems = [
            { page: '../pages/dashboard.html', label: 'Dashboard', icon: 'grid-fill', active: false }
        ];
    }

    sidebarMenu.innerHTML = menuItems.map(item => `
        <li>
            <a href="${item.page}" class="${item.active ? 'active' : ''}">
                <i class="bi bi-${item.icon}"></i>
                <span class="menu-text">${item.label}</span>
            </a>
        </li>
    `).join('');
}

async function initializeAdminView() {
    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <!-- Content Area -->
        <div class="content-wrapper">
            <div class="page-header mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 class="page-title">
                            <i class="bi bi-clipboard-data me-2"></i>Gestión de Notas
                        </h2>
                        <p class="text-muted">Consulta las calificaciones de los estudiantes</p>
                    </div>
                </div>
            </div>

            <!-- Filters Card -->
            <div class="card shadow-soft mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Período</label>
                            <select class="form-select" id="filtroPeriodo" onchange="filtrarDatos()">
                                <option value="">Todos los períodos</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Grado</label>
                            <select class="form-select" id="filtroGrado" onchange="onGradoChange()">
                                <option value="">Todos los grados</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Sección</label>
                            <select class="form-select" id="filtroSeccion" onchange="filtrarDatos()">
                                <option value="">Todas las secciones</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Curso</label>
                            <select class="form-select" id="filtroCurso" onchange="filtrarDatos()">
                                <option value="">Todos los cursos</option>
                            </select>
                        </div>
                    </div>
                </div>

                        <!-- Search + Pagination Controls -->
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div style="width:40%">
                                <input id="filtroBusquedaAdmin" class="form-control" type="text" placeholder="Buscar alumno, documento o palabra clave" onkeyup="filtrarDatos()">
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <label class="me-2">Mostrar</label>
                                <select id="adminPageSize" class="form-select form-select-sm" style="width:90px;" onchange="onAdminPageSizeChange()">
                                    <option value="10">10</option>
                                    <option value="20" selected>20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <div id="notasPagination" class="btn-group ms-3" role="group"></div>
                            </div>
                        </div>
            </div>

            <!-- Notes Table -->
            <div class="card shadow-soft">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Alumno</th>
                                    <th>Grado y Sección</th>
                                    <th>Curso</th>
                                    <th>Docente</th>
                                    <th>Período</th>
                                    <th>Promedio</th>
                                    <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tablaNotas">
                                    <tr>
                                        <td colspan="7" class="text-center">Cargando datos...</td>
                                    </tr>
                                </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    await cargarDatosIniciales();
    await cargarNotasAdmin();
}

/**
 * Inicializar vista para docentes
 */
async function initializeDocenteView() {
    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <!-- Content Area -->
        <div class="content-wrapper">
            <div class="page-header mb-4">
                <h2 class="page-title">
                    <i class="bi bi-clipboard-data me-2"></i>Gestionar Notas
                </h2>
                <p class="text-muted">Lista de alumnos para gestionar calificaciones por clase y curso</p>
            </div>

            <!-- Filters Card -->
            <div class="card shadow-soft mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Clase/Curso</label>
                            <select class="form-select" id="filtroClase" onchange="filtrarAlumnos()">
                                <option value="">Todas las clases</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Grado</label>
                            <select class="form-select" id="filtroGradoDocente" onchange="filtrarAlumnos()">
                                <option value="">Todos los grados</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Sección</label>
                            <select class="form-select" id="filtroSeccionDocente" onchange="filtrarAlumnos()">
                                <option value="">Todas las secciones</option>
                            </select>
                        </div>
                        <!-- Page size control removed to respect global UX (default 10 items per page) -->
                        <div class="col-md-3">
                            <label class="form-label">Buscar Alumno</label>
                            <input type="text" class="form-control" id="buscarAlumno" placeholder="Nombre o documento" onkeyup="filtrarAlumnos()">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Students Table -->
            <div class="card shadow-soft">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Alumno</th>
                                    <th>Cursos Asignados</th>
                                    <th>Grado y Sección</th>
                                    <th>Estado</th>
                                    <th>Progreso General</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tablaAlumnosDocente">
                                <tr>
                                    <td colspan="6" class="text-center py-4">
                                        <div class="spinner-border text-primary" role="status"></div>
                                        <p class="mt-2 mb-0">Cargando alumnos asignados...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div id="pagination" class="d-flex align-items-center"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await cargarDatosIniciales();
    await cargarNotasDocente();
}

/**
 * Cargar datos iniciales necesarios
 */
async function cargarDatosIniciales() {
    try {
        // Cargar datos en paralelo
        const [
            resultCursos,
            resultSecciones,
            resultGrados,
            resultPeriodos,
            resultMatriculas,
            resultAlumnos,
            resultTiposEval,
            resultEscalas,
            resultDocentes
        ] = await Promise.all([
            AcademicoService.listCursos(),
            AcademicoService.listSecciones(),
            AcademicoService.listGrados(),
            AcademicoService.listPeriodos(),
            PersonasService.listMatriculas(),
            PersonasService.listAlumnos(),
            NotasService.listTiposEvaluacion(),
            NotasService.listEscalas(),
            AcademicoService.getDocentesActivos()
        ]);

        // Asignar datos - extraer los arrays de la estructura {data: Array, total: number}
        cursos = resultCursos.success ? (resultCursos.data.cursos || resultCursos.data || []) : [];
        secciones = resultSecciones.success ? (resultSecciones.data.secciones || resultSecciones.data || []) : [];
        grados = resultGrados.success ? (resultGrados.data.grados || resultGrados.data || []) : [];
        periodos = resultPeriodos.success ? (resultPeriodos.data.periodos || resultPeriodos.data || []) : [];
        matriculas = resultMatriculas.success ? (resultMatriculas.data.matriculas || resultMatriculas.data || []) : [];
        alumnos = resultAlumnos.success ? (resultAlumnos.data.alumnos || resultAlumnos.data || []) : [];
        tiposEvaluacion = resultTiposEval.success ? (resultTiposEval.data.tipos_evaluacion || resultTiposEval.data || []) : [];
        escalas = resultEscalas.success ? (resultEscalas.data.escalas || resultEscalas.data || []) : [];
        docentes = resultDocentes && resultDocentes.success ? (resultDocentes.data.docentes || resultDocentes.data || []) : [];

        // Si no hay tipos de evaluación, usar defaults
        if (tiposEvaluacion.length === 0) {
            tiposEvaluacion = [
                { id: '1', nombre: 'Examen Parcial' },
                { id: '2', nombre: 'Examen Final' },
                { id: '3', nombre: 'Práctica' },
                { id: '4', nombre: 'Tarea' }
            ];
        }
        const userRole = currentUser?.rol?.nombre || 'UNKNOWN';

        if (userRole === 'DOCENTE') {
            // Para docentes, usar el endpoint específico
            const resultClasesDocente = await AcademicoService.getClasesDocente();
            clases = resultClasesDocente.success ? (resultClasesDocente.data.clases || resultClasesDocente.data || []) : [];
            console.log('Clases del docente cargadas:', clases.length);
        } else {
            // Para admin, cargar todas las clases
            const resultClases = await AcademicoService.listClases();
            clases = resultClases.success ? (resultClases.data.clases || resultClases.data || []) : [];
        }

        // Debug: Verificar estructura de los datos
        console.log('Datos cargados correctamente:');
        console.log('- Cursos (', cursos.length, '):', cursos.slice(0, 2));
        console.log('- Clases (', clases.length, '):', clases.slice(0, 2));
        console.log('- Alumnos (', alumnos.length, '):', alumnos.slice(0, 2));
        console.log('- Matriculas (', matriculas.length, '):', matriculas.slice(0, 2));

        // Asegurar que son arrays
        if (!Array.isArray(cursos)) cursos = [];
        if (!Array.isArray(secciones)) secciones = [];
        if (!Array.isArray(grados)) grados = [];
        if (!Array.isArray(periodos)) periodos = [];
        if (!Array.isArray(matriculas)) matriculas = [];
        if (!Array.isArray(clases)) clases = [];
        if (!Array.isArray(alumnos)) alumnos = [];

        // Llenar selectores
        llenarSelectores();

    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showToast('Error al cargar datos iniciales', 'danger');
    }
}

/**
 * Llenar selectores con datos
 */
function llenarSelectores() {
    // Selector de períodos
    const selectPeriodo = document.getElementById('filtroPeriodo');
    if (selectPeriodo) {
        selectPeriodo.innerHTML = '<option value="">Todos los períodos</option>';
        periodos.forEach(periodo => {
            const option = document.createElement('option');
            option.value = periodo.id;
            option.textContent = periodo.nombre;
            selectPeriodo.appendChild(option);
        });

        // Auto-seleccionar período actual
        const periodoActual = periodos.find(p => p.activo);
        if (periodoActual) {
            selectPeriodo.value = periodoActual.id;
        }
    }

    // Selector de grados (solo para admin)
    const selectGrado = document.getElementById('filtroGrado');
    if (selectGrado) {
        selectGrado.innerHTML = '<option value="">Todos los grados</option>';
        grados.forEach(grado => {
            const option = document.createElement('option');
            option.value = grado.id;
            option.textContent = grado.nombre;
            selectGrado.appendChild(option);
        });
    }

    // Selector de secciones (solo para admin)
    const selectSeccion = document.getElementById('filtroSeccion');
    if (selectSeccion) {
        selectSeccion.innerHTML = '<option value="">Todas las secciones</option>';
    }

    // Selector de cursos (solo para admin)
    const selectCurso = document.getElementById('filtroCurso');
    if (selectCurso) {
        selectCurso.innerHTML = '<option value="">Todos los cursos</option>';
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id;
            option.textContent = curso.nombre;
            selectCurso.appendChild(option);
        });
    }

    // Selector de clases (solo para docente)
    const selectClase = document.getElementById('filtroClase');
    if (selectClase) {
        selectClase.innerHTML = '<option value="">Todas las clases</option>';
        clases.forEach(clase => {
            const curso = cursos.find(c => c.id === clase.curso_id);
            const seccion = secciones.find(s => s.id === clase.seccion_id);
            const periodo = periodos.find(p => p.id === clase.periodo_id);

            if (curso && seccion && periodo) {
                const option = document.createElement('option');
                option.value = clase.id;
                option.textContent = `${curso.nombre} - ${seccion.nombre} (${periodo.nombre})`;
                selectClase.appendChild(option);
            }
        });
    }
}

/**
 * Abrir gestión de notas estilo SIAGIE
 * La implementación real está en notas-siagie.js
 */
// function abrirGestionNotas(alumnoId) { ... } - Eliminado para usar la versión de notas-siagie.js

/**
 * Cargar notas para administrador (paginación por servidor).
 * Esta versión solicita páginas al backend en lugar de traer todo con un limit grande.
 */
async function cargarNotasAdmin(page = 1) {
    const tbody = document.getElementById('tablaNotas');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';

        // Leer filtros
        const periodoId = document.getElementById('filtroPeriodo')?.value || null;
        const gradoId = document.getElementById('filtroGrado')?.value || null;
        const seccionId = document.getElementById('filtroSeccion')?.value || null;
        const cursoId = document.getElementById('filtroCurso')?.value || null;
        const searchTerm = (document.getElementById('filtroBusquedaAdmin')?.value || null);

        // Página y tamaño
        const pageSize = parseInt(document.getElementById('adminPageSize')?.value || '20', 10) || 20;
        adminServerPagination.pageSize = pageSize;
        adminServerPagination.page = page || 1;

        const offset = (adminServerPagination.page - 1) * adminServerPagination.pageSize;

        // Llamada al backend pasando filtros (si backend los soporta serán aplicados allí)
        const filters = { periodo_id: periodoId, grado_id: gradoId, seccion_id: seccionId, curso_id: cursoId, search: searchTerm };
        const res = await NotasService.listNotasAdmin(filters, offset, adminServerPagination.pageSize);

        if (!res || !res.success) {
            throw new Error(res?.error || 'Error al obtener notas desde el servidor');
        }

        const data = res.data || {};

        // Determinar items y total si backend lo ofrece
        let notasItems = [];
        let responseType = 'raw_notes';
        if (Array.isArray(data.alumnos)) {
            notasItems = data.alumnos;
            responseType = 'aggr_students';
        } else if (Array.isArray(data.low_students)) {
            notasItems = data.low_students;
            responseType = 'aggr_students';
        } else if (Array.isArray(data.notas) || Array.isArray(data.items) || Array.isArray(data.notes)) {
            notasItems = data.notas || data.items || data.notes || [];
            responseType = 'raw_notes';
        } else if (Array.isArray(data)) {
            notasItems = data;
            responseType = 'raw_notes';
        }

        // Total (si el backend lo devuelve)
        const totalItems = data.total || data.total_items || data.count || (data.meta && data.meta.total) || null;
        adminServerPagination.totalItems = totalItems != null ? parseInt(totalItems, 10) : null;
        if (adminServerPagination.totalItems) {
            adminServerPagination.totalPages = Math.max(1, Math.ceil(adminServerPagination.totalItems / adminServerPagination.pageSize));
        } else {
            // Si no hay total, calcular al menos 1 página (backend no devolvió total)
            adminServerPagination.totalPages = Math.max(1, Math.ceil((notasItems.length || 0) / adminServerPagination.pageSize));
        }

        // Extraer y enriquecer items si hace falta
        function enrichAlumnoFromSources(item) {
            const out = {
                grado_nombre: item.grado_nombre || item.grado || '',
                seccion_nombre: item.seccion_nombre || item.seccion || '',
                curso_nombre: '',
                periodo_nombre: item.periodo_nombre || item.periodo || '',
                docente_nombre: item.docente_nombre || item.docente || ''
            };
            if (Array.isArray(item.cursos) && item.cursos.length > 0) {
                const c = item.cursos[0];
                out.curso_nombre = c.nombre || c.curso_nombre || c.curso || c.nombre_curso || '';
                out.seccion_nombre = out.seccion_nombre || c.seccion_nombre || c.seccion || '';
                out.grado_nombre = out.grado_nombre || c.grado_nombre || c.grado || '';
                out.periodo_nombre = out.periodo_nombre || c.periodo_nombre || c.periodo || '';
                out.docente_nombre = out.docente_nombre || c.docente_nombre || c.docente || '';
                return out;
            }
            try {
                const alumnoId = item.alumno_id || item.id || (item.alumno && item.alumno.id) || null;
                if (alumnoId) {
                    const mats = Array.isArray(matriculas) ? matriculas : [];
                    const m = mats.find(x => String(x.alumno_id) === String(alumnoId) || String(x.alumno) === String(alumnoId));
                    if (m) {
                        const claseId = m.clase_id || m.clase || m.claseId;
                        const claseObj = clases.find(c => String(c.id) === String(claseId));
                        if (claseObj) {
                            const cursoObj = cursos.find(cc => String(cc.id) === String(claseObj.curso_id));
                            const seccionObj = secciones.find(s => String(s.id) === String(claseObj.seccion_id));
                            const periodoObj = periodos.find(p => String(p.id) === String(claseObj.periodo_id));
                            out.curso_nombre = out.curso_nombre || (cursoObj && (cursoObj.nombre || cursoObj.nombre_curso)) || '';
                            out.seccion_nombre = out.seccion_nombre || (seccionObj && seccionObj.nombre) || '';
                            const gradoObj = seccionObj ? grados.find(g => String(g.id) === String(seccionObj.grado_id)) : null;
                            out.grado_nombre = out.grado_nombre || (gradoObj && gradoObj.nombre) || '';
                            out.periodo_nombre = out.periodo_nombre || (periodoObj && periodoObj.nombre) || '';
                            const docenteId = claseObj.docente_id || claseObj.docente || claseObj.docenteId;
                            if (docenteId) {
                                const docenteObj = Array.isArray(docentes) ? docentes.find(d => String(d.id) === String(docenteId)) : null;
                                if (docenteObj) {
                                    out.docente_nombre = out.docente_nombre || ((docenteObj.apellidos || docenteObj.last_name) ? `${docenteObj.apellidos || ''}, ${docenteObj.nombres || docenteObj.first_name || ''}` : (docenteObj.nombre || ''));
                                } else {
                                    out.docente_nombre = out.docente_nombre || (claseObj.docente_nombre || claseObj.docente || '');
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('enrichAlumnoFromSources error', e);
            }
            return out;
        }

        async function enrichItemsWithMatriculas(items) {
            if (!Array.isArray(items) || items.length === 0) return items;
            const promises = items.map(async item => {
                try {
                    const alumnoId = item.alumno_id || item.id || (item.alumno && item.alumno.id) || null;
                    if (!alumnoId) return item;
                    const enriched = enrichAlumnoFromSources(item);
                    if (enriched.curso_nombre || enriched.grado_nombre || enriched.periodo_nombre || enriched.docente_nombre) {
                        item.grado_nombre = item.grado_nombre || enriched.grado_nombre;
                        item.seccion_nombre = item.seccion_nombre || enriched.seccion_nombre;
                        item.periodo_nombre = item.periodo_nombre || enriched.periodo_nombre;
                        item.docente_nombre = item.docente_nombre || enriched.docente_nombre;
                        return item;
                    }
                    try {
                        const resMat = await PersonasService.listMatriculas(0, 100, alumnoId, null, periodoId || null);
                        if (resMat && resMat.success && resMat.data) {
                            const mats = resMat.data.matriculas || resMat.data.items || resMat.data || [];
                            if (Array.isArray(mats) && mats.length > 0) {
                                const m = mats[0];
                                const claseId = m.clase_id || m.clase || m.claseId;
                                const claseObj = clases.find(c => String(c.id) === String(claseId));
                                if (claseObj) {
                                    const cursoObj = cursos.find(cc => String(cc.id) === String(claseObj.curso_id));
                                    const seccionObj = secciones.find(s => String(s.id) === String(claseObj.seccion_id));
                                    const periodoObj = periodos.find(p => String(p.id) === String(claseObj.periodo_id));
                                    item.cursos = item.cursos || [];
                                    item.cursos.unshift({ curso_id: cursoObj?.id, nombre: cursoObj?.nombre });
                                    item.grado_nombre = item.grado_nombre || (seccionObj ? (grados.find(g=>String(g.id)===String(seccionObj.grado_id))?.nombre) : '') || item.grado_nombre;
                                    item.seccion_nombre = item.seccion_nombre || (seccionObj && seccionObj.nombre) || item.seccion_nombre;
                                    item.periodo_nombre = item.periodo_nombre || (periodoObj && periodoObj.nombre) || item.periodo_nombre;
                                    const docenteId = claseObj.docente_id || claseObj.docente || claseObj.docenteId;
                                    if (docenteId) {
                                        const docenteObj = (Array.isArray(docentes) ? docentes.find(d=>String(d.id)===String(docenteId)) : null) || null;
                                        item.docente_nombre = item.docente_nombre || (docenteObj ? ((docenteObj.apellidos? `${docenteObj.apellidos}, ${docenteObj.nombres}` : (docenteObj.nombre||''))) : (claseObj.docente_nombre || claseObj.docente || ''));
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('enrichItemsWithMatriculas API error for alumno', alumnoId, e);
                    }
                } catch (e) {
                    console.warn('enrichItemsWithMatriculas error', e);
                }
                return item;
            });
            return Promise.all(promises);
        }

        // Enriquecer si viene vacío algunos campos
        try {
            notasItems = await enrichItemsWithMatriculas(notasItems);
        } catch (e) {
            console.warn('Error enriching notasItems:', e);
        }

        // Normalizar items a filas por alumno (como antes), pero solo con los items de la página
        let studentsArr = [];
        if (responseType === 'aggr_students') {
            studentsArr = (notasItems || []).map(item => {
                const alumnoId = item.alumno_id || item.id || (item.alumno && item.alumno.id) || '';
                const nombres = item.nombres || (item.alumno && item.alumno.nombres) || item.nombre || '';
                const apellidos = item.apellidos || (item.alumno && item.alumno.apellidos) || '';
                const doc = item.numero_documento || (item.alumno && item.alumno.numero_documento) || '';
                const enriched = enrichAlumnoFromSources(item);
                const promedio = (item.promedio || item.promedio_general || item.avg || item.media) || '-';
                const cursosList = item.cursos || item.courses || [];
                return {
                    id: alumnoId,
                    nombres,
                    apellidos,
                    numero_documento: doc,
                    grado_nombre: enriched.grado_nombre || '',
                    seccion_nombre: enriched.seccion_nombre || '',
                    periodo_nombre: enriched.periodo_nombre || '',
                    docente_nombre: enriched.docente_nombre || '',
                    promedio,
                    cursos: Array.isArray(cursosList) ? cursosList : []
                };
            });
        } else {
            // raw_notes: agrupar por alumno dentro de la página
            const mapa = {};
            (notasItems || []).forEach(n => {
                const alumnoId = n.alumno_id || (n.alumno && n.alumno.id) || n.student_id || n.alumnoId || '';
                if (!alumnoId) return;
                if (!mapa[alumnoId]) mapa[alumnoId] = { notas: [], alumno: {} };
                mapa[alumnoId].notas.push(n);
                if (n.alumno) mapa[alumnoId].alumno = Object.assign({}, mapa[alumnoId].alumno, n.alumno);
                if (n.nombres) mapa[alumnoId].alumno.nombres = mapa[alumnoId].alumno.nombres || n.nombres;
                if (n.apellidos) mapa[alumnoId].alumno.apellidos = mapa[alumnoId].alumno.apellidos || n.apellidos;
                if (n.numero_documento) mapa[alumnoId].alumno.numero_documento = mapa[alumnoId].alumno.numero_documento || n.numero_documento;
            });

            const rows = Object.keys(mapa).map(alumnoId => {
                const entry = mapa[alumnoId];
                const alumno = entry.alumno || {};
                const nombres = alumno.nombres || '';
                const apellidos = alumno.apellidos || '';
                const doc = alumno.numero_documento || '';

                const valores = entry.notas.map(x => {
                    const v = x.valor_numerico != null ? parseFloat(x.valor_numerico) : (x.valor_literal != null ? parseFloat(x.valor_literal) : NaN);
                    return isNaN(v) ? null : v;
                }).filter(v => v !== null && !isNaN(v));

                const promedio = valores.length ? (valores.reduce((a,b)=>a+b,0)/valores.length).toFixed(2) : '-';

                const cursosSet = new Map();
                entry.notas.forEach(n => {
                    const cid = n.curso_id || n.clase_id || n.course_id || n.cursoId || n.claseId;
                    const nombre = n.curso_nombre || n.curso || (cid ? (cursos.find(c=>String(c.id)===String(cid))?.nombre) : null) || n.nombre_curso || n.course_name || '';
                    if (cid) cursosSet.set(cid, nombre || cid);
                });

                const primera = entry.notas[0] || {};
                const enriched = enrichAlumnoFromSources(Object.assign({}, entry.alumno || {}, primera));
                const gradoSec = ((enriched.grado_nombre || '') + (enriched.seccion_nombre ? ` \"${enriched.seccion_nombre}\"` : '')).trim();
                const periodo = enriched.periodo_nombre || '';
                const docenteNombre = enriched.docente_nombre || '';

                return {
                    id: alumnoId,
                    nombres,
                    apellidos,
                    numero_documento: doc,
                    grado_nombre: gradoSec || '',
                    seccion_nombre: '',
                    periodo_nombre: periodo || '',
                    docente_nombre: docenteNombre || '',
                    promedio,
                    cursos: Array.from(cursosSet.values()).map(name => ({ nombre: name }))
                };
            });

            studentsArr = studentsArr.concat(rows);
        }

        // Dedupe and set server page items
        const uniqMap = new Map();
        studentsArr.forEach(s => { if (s && s.id && !uniqMap.has(String(s.id))) uniqMap.set(String(s.id), s); });
        adminServerPageItems = Array.from(uniqMap.values());

        // Si el backend no devolvió totalItems, intentar inferir totalPages mínimas
        if (!adminServerPagination.totalItems) {
            adminServerPagination.totalPages = Math.max(1, Math.ceil(adminServerPageItems.length / adminServerPagination.pageSize));
        }

        // Renderizar usando items de la página
        renderAdminStudentsPage();
        return;

    } catch (error) {
        console.error('Error cargando notas (admin):', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar notas</td></tr>';
    }
}

/**
 * Cargar alumnos asignados al docente en formato de tabla
 */
async function cargarNotasDocente() {
    const tbody = document.getElementById('tablaAlumnosDocente');
    if (!tbody) return;

    try {
        // Llenar selectores primero
        await llenarSelectoresDocente();

        // Verificar que tenemos clases del docente
        if (!Array.isArray(clases) || clases.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="alert alert-warning m-0">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            No tienes clases asignadas en este momento.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando alumnos...</td></tr>';

        // Obtener todos los alumnos de todas las clases del docente (con cache y concurrencia limitada)
        let todosLosAlumnos = [];

        // Helper: obtener alumnos con cache en sessionStorage
        async function fetchAlumnosConCache(clase) {
            try {
                const key = `alumnos_clase_${clase.id}`;
                const cached = sessionStorage.getItem(key);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        // soporte backward-compatible: si está guardado como raw array
                        if (parsed && parsed.ts && parsed.data) {
                            const age = Date.now() - parsed.ts;
                            if (age <= ALUMNOS_CACHE_TTL_MS) {
                                return { clase, result: { success: true, data: parsed.data } };
                            } else {
                                sessionStorage.removeItem(key);
                            }
                        } else {
                            // raw data (antiguo) - aceptar pero no tiene ts
                            return { clase, result: { success: true, data: parsed } };
                        }
                    } catch (e) {
                        sessionStorage.removeItem(key);
                    }
                }

                const res = await PersonasService.getAlumnosPorClase(clase.id);
                if (res && res.success && res.data) {
                    try {
                        const toStore = { ts: Date.now(), data: res.data };
                        sessionStorage.setItem(key, JSON.stringify(toStore));
                    } catch (e) {
                        // Ignore storage errors (quota)
                    }
                }
                return { clase, result: res };
            } catch (error) {
                return { clase, result: { success: false, error: error.message } };
            }
        }

        // Intentar usar un endpoint bulk si existe en PersonasService
        const bulkFnCandidates = ['getAlumnosPorClases', 'getAlumnosPorClasesBulk', 'getAlumnosBulk', 'getAlumnosForClasses'];
        const bulkFnName = bulkFnCandidates.find(n => typeof PersonasService[n] === 'function');
        if (bulkFnName) {
            try {
                const claseIds = clases.map(c => c.id);
                const bulkRes = await PersonasService[bulkFnName](claseIds);
                if (bulkRes && bulkRes.success && bulkRes.data) {
                    // Esperamos un objeto { claseId: [alumnos] } o un array por clase
                    const map = bulkRes.data;
                    clases.forEach(clase => {
                        const resultData = map[clase.id] || (Array.isArray(map) ? map.find(x => x.clase_id === clase.id)?.alumnos : null);
                        if (resultData) {
                            const alumnosClase = Array.isArray(resultData) ? resultData : resultData.alumnos || [];
                            const curso = cursos.find(c => c.id === clase.curso_id);
                            const seccion = secciones.find(s => s.id === clase.seccion_id);
                            const grado = grados.find(g => g.id === seccion?.grado_id);
                            const alumnosEnriquecidos = alumnosClase.map(alumno => ({
                                ...alumno,
                                clase_id: clase.id,
                                curso_id: clase.curso_id,
                                curso_nombre: curso?.nombre || 'Sin curso',
                                seccion_id: clase.seccion_id,
                                seccion_nombre: seccion?.nombre || 'Sin sección',
                                grado_id: seccion?.grado_id,
                                grado_nombre: grado?.nombre || 'Sin grado',
                                periodo_id: clase.periodo_id
                            }));
                            todosLosAlumnos = todosLosAlumnos.concat(alumnosEnriquecidos);
                            // cache individual clase
                            try { sessionStorage.setItem(`alumnos_clase_${clase.id}`, JSON.stringify({ ts: Date.now(), data: alumnosClase })); } catch (e) { }
                        }
                    });
                }
            } catch (e) {
                console.warn('Bulk fetch alumnos failed, falling back to per-class fetch:', e.message);
            }
        }

        // Ejecutar en lotes para limitar concurrencia (por ejemplo, 8 simultáneas)
        const CONCURRENCY = ALUMNOS_CONCURRENCY || 8;
        for (let i = 0; i < clases.length; i += CONCURRENCY) {
            const batch = clases.slice(i, i + CONCURRENCY);
            const batchPromises = batch.map(clase => fetchAlumnosConCache(clase));
            const batchResults = await Promise.all(batchPromises);

            batchResults.forEach(({ clase, result }) => {
                if (result && result.success && result.data) {
                    const alumnosClase = Array.isArray(result.data) ? result.data : result.data.alumnos || result.data.items || [];
                    const curso = cursos.find(c => c.id === clase.curso_id);
                    const seccion = secciones.find(s => s.id === clase.seccion_id);
                    const grado = grados.find(g => g.id === seccion?.grado_id);

                    const alumnosEnriquecidos = alumnosClase.map(alumno => ({
                        ...alumno,
                        clase_id: clase.id,
                        curso_id: clase.curso_id,
                        curso_nombre: curso?.nombre || 'Sin curso',
                        seccion_id: clase.seccion_id,
                        seccion_nombre: seccion?.nombre || 'Sin sección',
                        grado_id: seccion?.grado_id,
                        grado_nombre: grado?.nombre || 'Sin grado',
                        periodo_id: clase.periodo_id
                    }));

                    todosLosAlumnos = todosLosAlumnos.concat(alumnosEnriquecidos);
                } else {
                    console.warn(`No se pudieron obtener alumnos para la clase ${clase.id}:`, result?.error || 'Sin resultado');
                }
            });
        }

        // Agrupar alumnos por ID (eliminar duplicados y agrupar cursos)
        const alumnosAgrupados = {};

        todosLosAlumnos.forEach(alumno => {
            if (!alumnosAgrupados[alumno.id]) {
                alumnosAgrupados[alumno.id] = {
                    ...alumno,
                    cursos: [],
                    clases_ids: []
                };
            }

            // Agregar curso si no está ya agregado
            const cursoExiste = alumnosAgrupados[alumno.id].cursos.find(c => c.curso_id === alumno.curso_id);
            if (!cursoExiste) {
                alumnosAgrupados[alumno.id].cursos.push({
                    clase_id: alumno.clase_id,
                    curso_id: alumno.curso_id,
                    curso_nombre: alumno.curso_nombre,
                    seccion_id: alumno.seccion_id,
                    periodo_id: alumno.periodo_id,
                    matricula_clase_id: alumno.matricula_clase_id // asegurar matricula por curso
                });
                alumnosAgrupados[alumno.id].clases_ids.push(alumno.clase_id);
            }
        });

        const alumnosUnicos = Object.values(alumnosAgrupados);

        // Guardar en variable global
        alumnosAsignados = alumnosUnicos;

        if (alumnosUnicos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                        <br>No hay alumnos matriculados en tus clases.
                    </td>
                </tr>
            `;
            return;
        }

        // Guardar en variable global y renderizar (con paginación)
        alumnosAsignados = alumnosUnicos;
        // Inicializar paginación (default 10 por página)
        docentePagination.page = 1;
        docentePagination.pageSize = 10;
        docentePagination.totalItems = alumnosAsignados.length;
        docentePagination.totalPages = Math.max(1, Math.ceil(docentePagination.totalItems / docentePagination.pageSize));

        // Renderizar con filtros/paginación
        filtrarAlumnos();

    } catch (error) {
        console.error('Error cargando alumnos del docente:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    Error al cargar los alumnos: ${error.message}
                </td>
            </tr>
        `;
    }
}

/**
 * Llenar selectores para filtros
 */
async function llenarSelectoresDocente() {
    const selectClase = document.getElementById('filtroClase');
    const selectGrado = document.getElementById('filtroGradoDocente');
    const selectSeccion = document.getElementById('filtroSeccionDocente');

    if (selectClase) {
        selectClase.innerHTML = '<option value="">Todas las clases</option>';
        clases.forEach(clase => {
            const curso = cursos.find(c => c.id === clase.curso_id);
            const seccion = secciones.find(s => s.id === clase.seccion_id);
            if (curso && seccion) {
                const option = document.createElement('option');
                option.value = clase.id;
                option.textContent = `${curso.nombre} - ${seccion.nombre}`;
                selectClase.appendChild(option);
            }
        });
    }

    if (selectGrado) {
        selectGrado.innerHTML = '<option value="">Todos los grados</option>';
        const gradosUnicos = [...new Set(secciones.map(s => s.grado_id))];
        gradosUnicos.forEach(gradoId => {
            const grado = grados.find(g => g.id === gradoId);
            if (grado) {
                const option = document.createElement('option');
                option.value = grado.id;
                option.textContent = grado.nombre;
                selectGrado.appendChild(option);
            }
        });
    }

    if (selectSeccion) {
        selectSeccion.innerHTML = '<option value="">Todas las secciones</option>';
        secciones.forEach(seccion => {
            const option = document.createElement('option');
            option.value = seccion.id;
            option.textContent = seccion.nombre;
            selectSeccion.appendChild(option);
        });
    }
}

/**
 * Renderizar tabla de alumnos (agrupados por alumno con múltiples cursos)
 */
function renderizarTablaAlumnos(alumnos) {
    const tbody = document.getElementById('tablaAlumnosDocente');
    tbody.innerHTML = '';

    alumnos.forEach((alumno, index) => {
        // Crear badges para los cursos
        const cursoBadges = alumno.cursos.map(curso =>
            `<span class="badge bg-primary rounded-pill me-1 mb-1">${curso.curso_nombre}</span>`
        ).join('');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3 bg-primary text-white fw-bold shadow-sm">
                        ${(alumno.nombres || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="fw-bold text-dark">${alumno.apellidos}, ${alumno.nombres}</div>
                        <small class="text-muted">
                            <i class="bi bi-card-heading me-1"></i>${alumno.numero_documento || 'Sin documento'}
                        </small>
                    </div>
                </div>
            </td>
            <td>
                <div class="d-flex flex-wrap">
                    ${cursoBadges}
                </div>
                <small class="text-muted">${alumno.cursos.length} curso(s)</small>
            </td>
            <td>
                <span class="text-muted">${alumno.grado_nombre} "${alumno.seccion_nombre}"</span>
            </td>
            <td>
                <span class="badge bg-success">
                    <i class="bi bi-check-circle-fill me-1"></i>Matriculado
                </span>
            </td>
            <td>
                <div class="progress" style="height: 6px; width: 100px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: 75%"></div>
                </div>
                <small class="text-muted" style="font-size: 0.75rem;">75% completado</small>
            </td>
            <td>
                <button class="btn btn-primary btn-sm" 
                        onclick="abrirLibretaMulticurso('${alumno.id}')">
                    <i class="bi bi-pencil-square me-1"></i>Gestionar Notas
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderAdminStudentsPage() {
    const tbody = document.getElementById('tablaNotas');
    if (!tbody) return;
    let pageItems = [];
    let page = 1;
    let size = 20;
    if (adminServerMode) {
        page = adminServerPagination.page || 1;
        size = adminServerPagination.pageSize || 20;
        pageItems = adminServerPageItems || [];
    } else {
        page = adminPagination.page || 1;
        size = adminPagination.pageSize || 20;
        const start = (page - 1) * size;
        pageItems = adminStudentsList.slice(start, start + size);
    }

    if (!pageItems || pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay registros en esta página.</td></tr>';
        buildAdminPaginationControls();
        return;
    }

    const rows = pageItems.map(item => {
        const cursoBadges = (item.cursos || []).slice(0,3).map(c => `<span class="badge bg-primary me-1">${escapeHtml(c.nombre || c.curso_nombre || c)}</span>`).join('');
        const gradoSec = ((item.grado_nombre || '') + (item.seccion_nombre ? ` \"${item.seccion_nombre}\"` : '')).trim();
        const periodo = item.periodo_nombre || '';
        const docente = item.docente_nombre || '';
        const promedio = item.promedio || '-';

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-2">${(item.nombres||'U').charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="fw-semibold">${escapeHtml(item.apellidos)}, ${escapeHtml(item.nombres)}</div>
                            <small class="text-muted">${escapeHtml(item.numero_documento || '')}</small>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(gradoSec)}</td>
                <td>${cursoBadges}</td>
                <td>${escapeHtml(docente)}</td>
                <td>${escapeHtml(periodo)}</td>
                <td><span class="badge bg-success">${escapeHtml(String(promedio))}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="abrirLibretaMulticurso('${item.id}', true)" title="Ver Detalle">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>`;
    });

    tbody.innerHTML = rows.join('');
    buildAdminPaginationControls();
}

/**
 * Renderiza controles de paginación para la vista de DOCENTE (consistente con otras páginas)
 */
function renderDocentePagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const page = docentePagination.page || 1;
    const total = docentePagination.totalPages || 1;
    const totalItems = docentePagination.totalItems || 0;

    container.innerHTML = '';
    container.className = 'd-flex justify-content-between align-items-center w-100';

    // Left: prev / info / next
    const left = document.createElement('div');
    left.className = 'pagination-left';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-sm btn-outline-primary me-2';
    prevBtn.disabled = page <= 1;
    prevBtn.innerHTML = '« Prev';
    prevBtn.onclick = () => {
        if (docentePagination.page > 1) {
            docentePagination.page = Math.max(1, docentePagination.page - 1);
            filtrarAlumnos();
        }
    };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-sm btn-outline-primary ms-2';
    nextBtn.disabled = page >= total;
    nextBtn.innerHTML = 'Next »';
    nextBtn.onclick = () => {
        if (docentePagination.page < total) {
            docentePagination.page = Math.min(total, docentePagination.page + 1);
            filtrarAlumnos();
        }
    };

    const info = document.createElement('span');
    info.className = 'mx-2 text-muted';
    info.textContent = `Página ${page} de ${total} • ${totalItems} alumnos`;

    left.appendChild(prevBtn);
    left.appendChild(info);
    left.appendChild(nextBtn);

    // Right: page size selector (si no existe en filtros)
    const right = document.createElement('div');
    right.className = 'pagination-right d-flex align-items-center';

    // Intencionalmente no mostramos selector de tamaño para respetar UX del proyecto

    container.appendChild(left);
    container.appendChild(right);
}

function buildAdminPaginationControls() {
    const container = document.getElementById('notasPagination');
    if (!container) return;
    const page = adminServerMode ? (adminServerPagination.page || 1) : (adminPagination.page || 1);
    const total = adminServerMode ? (adminServerPagination.totalPages || 1) : (adminPagination.totalPages || 1);
    container.innerHTML = '';

    const btnPrev = document.createElement('button');
    btnPrev.className = 'btn btn-sm btn-outline-secondary';
    btnPrev.disabled = page <= 1;
    btnPrev.innerHTML = '<i class="bi bi-chevron-left"></i>';
    btnPrev.onclick = () => {
        const nextPage = Math.max(1, page - 1);
        if (adminServerMode) cargarNotasAdmin(nextPage); else { adminPagination.page = nextPage; renderAdminStudentsPage(); }
    };

    const btnNext = document.createElement('button');
    btnNext.className = 'btn btn-sm btn-outline-secondary';
    btnNext.disabled = page >= total;
    btnNext.innerHTML = '<i class="bi bi-chevron-right"></i>';
    btnNext.onclick = () => {
        const nextPage = Math.min(total, page + 1);
        if (adminServerMode) cargarNotasAdmin(nextPage); else { adminPagination.page = nextPage; renderAdminStudentsPage(); }
    };

    const info = document.createElement('span');
    info.className = 'btn btn-sm btn-light disabled mx-2';
    info.textContent = `Página ${page} de ${total}`;

    container.appendChild(btnPrev);
    container.appendChild(info);
    container.appendChild(btnNext);
}

function onAdminPageSizeChange() {
    const el = document.getElementById('adminPageSize');
    const val = parseInt(el?.value || '20', 10) || 20;
    if (adminServerMode) {
        adminServerPagination.pageSize = val;
        adminServerPagination.page = 1;
        // Request first page with new page size
        cargarNotasAdmin(1);
    } else {
        adminPagination.pageSize = val;
        adminPagination.page = 1;
        adminPagination.totalPages = Math.max(1, Math.ceil(adminStudentsList.length / adminPagination.pageSize));
        renderAdminStudentsPage();
    }
}

/**
 * Filtrar alumnos según los criterios seleccionados
 */
function filtrarAlumnos() {
    const filtroClase = document.getElementById('filtroClase')?.value;
    const filtroGrado = document.getElementById('filtroGradoDocente')?.value;
    const filtroSeccion = document.getElementById('filtroSeccionDocente')?.value;
    const terminoBusqueda = document.getElementById('buscarAlumno')?.value?.toLowerCase();

    let resultados = alumnosAsignados;

    // Filtrar por Clase
    if (filtroClase) {
        resultados = resultados.filter(a => a.clases_ids.includes(filtroClase));
    }

    // Filtrar por Grado
    if (filtroGrado) {
        resultados = resultados.filter(a => {
            return a.cursos.some(c => {
                const seccion = secciones.find(s => s.id === c.seccion_id);
                return seccion && seccion.grado_id === filtroGrado;
            });
        });
    }

    // Filtrar por Sección
    if (filtroSeccion) {
        resultados = resultados.filter(a => a.cursos.some(c => c.seccion_id === filtroSeccion));
    }

    // Filtrar por búsqueda de texto (nombre o documento)
    if (terminoBusqueda) {
        resultados = resultados.filter(a =>
            (a.nombres && a.nombres.toLowerCase().includes(terminoBusqueda)) ||
            (a.apellidos && a.apellidos.toLowerCase().includes(terminoBusqueda)) ||
            (a.numero_documento && a.numero_documento.toLowerCase().includes(terminoBusqueda))
        );
    }

    // Paginación
    const pageSizeEl = document.getElementById('pageSize');
    const newPageSize = pageSizeEl ? parseInt(pageSizeEl.value, 10) : 10; // default 10
    // Si cambió pageSize, reiniciar página actual
    if (docentePagination.pageSize !== newPageSize) {
        docentePagination.page = 1;
    }
    docentePagination.pageSize = newPageSize;

    const totalResultados = resultados.length;
    docentePagination.totalItems = totalResultados;
    docentePagination.totalPages = Math.max(1, Math.ceil(totalResultados / docentePagination.pageSize));
    if (docentePagination.page > docentePagination.totalPages) docentePagination.page = docentePagination.totalPages;

    const start = (docentePagination.page - 1) * docentePagination.pageSize;
    const resultadosPaginados = resultados.slice(start, start + docentePagination.pageSize);

    renderizarTablaAlumnos(resultadosPaginados);

    // Mensaje cuando no hay resultados
    const tbody = document.getElementById('tablaAlumnosDocente');
    if (totalResultados === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    No se encontraron alumnos con los filtros seleccionados.
                </td>
            </tr>
        `;
    }

    // Construir controles de paginación compatibles con el resto del proyecto
    renderDocentePagination();
}

/**
 * Filtrar alumnos según los criterios seleccionados
 */
function agregarColumnaMulticurso() {
    if (!estadoMulticurso.alumno) return;
    estadoMulticurso.valores = capturarValoresMulticurso();
    estadoMulticurso.numNotas += 1;
    renderTablaMulticurso();
    actualizarVistaMulticurso();
}

function eliminarColumnaMulticurso() {
    if (!estadoMulticurso.alumno) return;
    if (estadoMulticurso.numNotas <= 1) {
        showToast('Debe existir al menos una columna de notas.', 'info');
        return;
    }
    estadoMulticurso.valores = capturarValoresMulticurso();
    Object.keys(estadoMulticurso.valores || {}).forEach(cursoId => {
        const valores = estadoMulticurso.valores[cursoId] || [];
        if (valores.length > 0) {
            valores.splice(valores.length - 1, 1);
        }
        estadoMulticurso.valores[cursoId] = valores;
    });
    estadoMulticurso.numNotas = Math.max(estadoMulticurso.numNotas - 1, 1);
    renderTablaMulticurso();
    actualizarVistaMulticurso();
}

/**
 * Abrir Libreta de Notas Multicurso (Grid View con cursos como cabeceras)
 */
async function abrirLibretaMulticurso(alumnoId, readOnly = false) {
    // Buscar datos del alumno
    const alumno = alumnosAsignados.find(a => a.id === alumnoId) ||
        { nombres: 'Alumno', apellidos: 'Desconocido', cursos: [] };

    const nombreAlumno = `${alumno.apellidos}, ${alumno.nombres}`;

    // Crear modal dinámico si no existe
    const modalId = 'modalLibretaMulticurso';
    let modalEl = document.getElementById(modalId);

    if (!modalEl) {
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content bg-light">
                        <div class="modal-header bg-white border-bottom shadow-sm">
                            <div class="d-flex align-items-center">
                                <div class="avatar-circle bg-primary text-white me-3" id="libretaMultiAvatar">A</div>
                                <div>
                                    <h5 class="modal-title fw-bold mb-0" id="libretaMultiTitle">Libreta de Notas</h5>
                                    <small class="text-muted" id="libretaMultiSubtitle">Gestión integral de calificaciones</small>
                                </div>
                            </div>
                            <div class="ms-auto d-flex gap-2 flex-wrap justify-content-end">
                                <div class="btn-group" role="group">
                                    <button class="btn btn-secondary" id="toggleVistaMulticursoBtn" onclick="toggleVistaMulticurso()">
                                        <i class="bi bi-layout-split me-1"></i><span id="toggleVistaLabel">Vista Compacta</span>
                                    </button>
                                </div>
                                <div class="btn-group" role="group">
                                    <button id="btnAgregarColumna" class="btn btn-outline-primary" onclick="agregarColumnaMulticurso()">
                                        <i class="bi bi-plus-lg me-1"></i>Agregar Columna
                                    </button>
                                    <button id="btnEliminarColumna" class="btn btn-outline-danger" onclick="eliminarColumnaMulticurso()">
                                        <i class="bi bi-dash-lg me-1"></i>Quitar Columna
                                    </button>
                                </div>
                                <button id="btnGuardarMulticurso" class="btn btn-primary" onclick="guardarTodasLasNotasMulticurso()">
                                    <i class="bi bi-save me-1"></i>Guardar Todo
                                </button>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div class="modal-body p-4">
                            <div class="card shadow-sm border-0">
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-bordered mb-0 align-middle" id="gridMulticurso">
                                            <thead class="bg-light text-secondary" id="gridMulticursoHead">
                                                <!-- Las columnas se generarán dinámicamente -->
                                            </thead>
                                            <tbody id="gridMulticursoBody">
                                                <tr><td colspan="20" class="text-center py-5">Cargando cursos y notas...</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalEl = document.getElementById(modalId);
    }

    // Configurar modal
    document.getElementById('libretaMultiAvatar').textContent = nombreAlumno.charAt(0).toUpperCase();
    document.getElementById('libretaMultiTitle').textContent = nombreAlumno;
    document.getElementById('libretaMultiSubtitle').textContent = `${alumno.grado_nombre} "${alumno.seccion_nombre}" - Año Académico 2025`;

    // Modo solo lectura opcional
    window.LIBRETA_READ_ONLY = !!readOnly;
    try {
        const btnAdd = document.getElementById('btnAgregarColumna');
        const btnRem = document.getElementById('btnEliminarColumna');
        const btnSave = document.getElementById('btnGuardarMulticurso');
        if (window.LIBRETA_READ_ONLY) {
            if (btnAdd) btnAdd.style.display = 'none';
            if (btnRem) btnRem.style.display = 'none';
            if (btnSave) btnSave.style.display = 'none';
            const toggle = document.getElementById('toggleVistaMulticursoBtn');
            if (toggle) toggle.style.display = 'none';
        } else {
            if (btnAdd) btnAdd.style.display = '';
            if (btnRem) btnRem.style.display = '';
            if (btnSave) btnSave.style.display = '';
            const toggle = document.getElementById('toggleVistaMulticursoBtn');
            if (toggle) toggle.style.display = '';
        }
    } catch (e) { /* non-blocking */ }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Cargar datos
    await cargarGridMulticurso(alumno);

    actualizarVistaMulticurso();
}

/**
 * Cargar grid multicurso con cursos como cabeceras principales
 */
async function cargarGridMulticurso(alumno) {
    const thead = document.getElementById('gridMulticursoHead');
    const tbody = document.getElementById('gridMulticursoBody');

    try {
        const notasAlumno = await obtenerNotasAlumnoMulticurso(alumno.id);

        estadoMulticurso.alumno = alumno;
        estadoMulticurso.notas = notasAlumno;
        const maxNotasDetectadas = alumno.cursos.reduce((max, curso) => {
            const notasCurso = notasAlumno.filter(n => n.curso_id === curso.curso_id);
            return Math.max(max, notasCurso.length);
        }, 0);
        const defaultNotas = estadoMulticurso.numNotas || 4;
        estadoMulticurso.numNotas = Math.max(defaultNotas, maxNotasDetectadas, 4);
        estadoMulticurso.valores = null;

        renderTablaMulticurso();
    } catch (error) {
        console.error('Error cargando grid multicurso:', error);
        tbody.innerHTML = `<tr><td colspan="20" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }

    actualizarVistaMulticurso();
}

function toggleVistaMulticurso() {
    estadoMulticurso.valores = capturarValoresMulticurso();
    // Alternar entre Vista Extendida y Vista Compacta (inversa)
    vistaMulticursoExtendida = !vistaMulticursoExtendida;
    vistaMulticursoCompacta = !vistaMulticursoExtendida;
    renderTablaMulticurso();
    actualizarVistaMulticurso();
}

function toggleVistaMulticursoExtendida() {
    estadoMulticurso.valores = capturarValoresMulticurso();
    vistaMulticursoExtendida = !vistaMulticursoExtendida;
    if (vistaMulticursoExtendida) {
        vistaMulticursoCompacta = false;
    }
    renderTablaMulticurso();
    actualizarVistaMulticurso();
}

function actualizarVistaMulticurso() {
    const table = document.getElementById('gridMulticurso');
    const button = document.getElementById('toggleVistaMulticursoBtn');
    if (!button) return;

    if (vistaMulticursoCompacta) {
        if (table) table.classList.add('table-sm');
        button.classList.remove('btn-secondary');
        button.classList.add('btn-outline-secondary');
        button.innerHTML = '<i class="bi bi-arrows-angle-expand me-1"></i>Vista Extendida';
    } else {
        if (table) table.classList.remove('table-sm');
        button.classList.remove('btn-outline-secondary');
        button.classList.add('btn-secondary');
        button.innerHTML = '<i class="bi bi-arrows-angle-contract me-1"></i>Vista Compacta';
    }

    // Update single toggle button label and style
    const label = document.getElementById('toggleVistaLabel');
    if (vistaMulticursoExtendida) {
        button.classList.add('btn-secondary');
        button.classList.remove('btn-outline-secondary');
        if (label) label.textContent = 'Vista Extendida';
    } else if (vistaMulticursoCompacta) {
        button.classList.add('btn-outline-secondary');
        button.classList.remove('btn-secondary');
        if (label) label.textContent = 'Vista Compacta';
    } else {
        // default
        button.classList.remove('btn-outline-secondary');
        button.classList.add('btn-secondary');
        if (label) label.textContent = 'Vista Compacta';
    }
}

/**
 * Obtener notas del alumno para todos sus cursos
 */
async function obtenerNotasAlumnoMulticurso(alumnoId) {
    try {
        // Debug: log token and response to investigate intermittent UI mapping issues
        try { console.debug('[NOTAS] Usando token:', getAuthToken?.() || null); } catch (e) { console.warn('[NOTAS] No se pudo leer token para debug'); }
        const result = await NotasService.getNotasAlumno(alumnoId, 0, 100);
        console.debug('[NOTAS] Respuesta getNotasAlumno:', result);
        return result.success ? (result.data.notas || []) : [];
    } catch (error) {
        console.warn('Error obteniendo notas:', error);
        return [];
    }
}

function guardarValorPrevio(input) {
    input.dataset.prevValue = input.value;
}

function limitarEntradaNota(input) {
    if (!input) return;
    let valor = input.value.replace(/,/g, '.');
    valor = valor.replace(/[^0-9.]/g, '');
    const partes = valor.split('.');
    if (partes.length > 2) {
        valor = partes.shift() + '.' + partes.join('');
    }
    input.value = valor;
}

function validarValorNota(input) {
    if (!input) return false;
    const valorTexto = (input.value || '').trim();
    if (valorTexto === '') {
        input.classList.remove('is-invalid');
        input.dataset.prevValue = '';
        return true;
    }
    const valorNumero = parseFloat(valorTexto);
    if (Number.isNaN(valorNumero) || valorNumero < 0 || valorNumero > 20) {
        showToast('Ingresa una nota válida entre 0 y 20.', 'warning');
        if (Object.prototype.hasOwnProperty.call(input.dataset, 'prevValue')) {
            input.value = input.dataset.prevValue || '';
        } else {
            input.value = '';
        }
        input.classList.add('is-invalid');
        return false;
    }

    const valorNormalizado = Math.round(valorNumero * 10) / 10;
    input.value = valorNormalizado
        .toFixed(1)
        .replace(/\.0$/, '')
        .replace(/\.([1-9])0$/, '.$1');

    input.classList.remove('is-invalid');
    input.dataset.prevValue = input.value;
    return true;
}

function manejarCambioNotaMulticurso(input, cursoId) {
    if (!validarValorNota(input)) {
        return;
    }
    calcularPromedioMulticurso(input, cursoId);
}

function manejarCambioNotaIndividual(input) {
    if (!validarValorNota(input)) {
        return;
    }
    calcularPromedioFila(input);
}

function capturarValoresIndividual() {
    const valores = {};
    const rows = document.querySelectorAll('#gridNotasBody tr');
    rows.forEach(row => {
        const cursoId = row.dataset.cursoId;
        if (!cursoId) return;
        const inputs = row.querySelectorAll('input[data-curso-id]');
        inputs.forEach((input, index) => {
            if (!valores[cursoId]) valores[cursoId] = [];
            const colIndex = parseInt(input.dataset.colIndex || String(index), 10);
            valores[cursoId][colIndex] = input.value;
        });
    });
    return valores;
}

function capturarValoresMulticurso() {
    const valores = {};
    const inputs = document.querySelectorAll('#gridMulticursoBody input[data-curso-id]');
    inputs.forEach(input => {
        const cursoId = input.dataset.cursoId;
        const colIndex = parseInt(input.dataset.colIndex || '0', 10);
        if (!cursoId) return;
        if (!valores[cursoId]) valores[cursoId] = [];
        valores[cursoId][colIndex] = input.value;
    });
    return valores;
}

// Buscar matrícula en Personas Service por alumno y clase/curso
async function findMatriculaForAlumnoCurso(alumnoId, claseId, cursoId) {
    try {
        const params = new URLSearchParams();
        if (alumnoId) params.append('alumno_id', alumnoId);
        if (claseId) params.append('clase_id', claseId);
        if (cursoId) params.append('curso_id', cursoId);
        params.append('limit', '100');

        const response = await fetch(`${API_CONFIG.PERSONAS_SERVICE}/v1/matriculas?${params}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) return null;
        const data = await response.json();
        const mats = data.matriculas || [];
        return mats.length ? mats[0].id : null;
    } catch (e) {
        console.warn('Error buscando matrícula:', e);
        return null;
    }
}

// ---------------- Cache helpers ----------------
function getCachedAlumnos(claseId) {
    try {
        const raw = sessionStorage.getItem(`alumnos_clase_${claseId}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed) return null;
        return parsed.data || parsed; // soporta formato antiguo
    } catch (e) {
        return null;
    }
}

function setCachedAlumnos(claseId, alumnos) {
    try {
        const payload = { ts: Date.now(), data: alumnos };
        sessionStorage.setItem(`alumnos_clase_${claseId}`, JSON.stringify(payload));
    } catch (e) {
        // ignore quota errors
    }
}

function invalidateCachedAlumnos(claseId) {
    try { sessionStorage.removeItem(`alumnos_clase_${claseId}`); } catch (e) { }
}

function appendAlumnoToCache(claseId, alumno) {
    try {
        const existing = getCachedAlumnos(claseId) || [];
        if (!existing.find(a => a.id === alumno.id)) {
            const next = existing.concat([alumno]);
            setCachedAlumnos(claseId, next);
        }
    } catch (e) { }
}

function removeAlumnoFromCache(claseId, alumnoId) {
    try {
        const existing = getCachedAlumnos(claseId) || [];
        const next = existing.filter(a => a.id !== alumnoId);
        setCachedAlumnos(claseId, next);
    } catch (e) { }
}

// Exponer helpers globalmente para otros módulos si es necesario
window.__AlumnosCache = {
    get: getCachedAlumnos,
    set: setCachedAlumnos,
    invalidate: invalidateCachedAlumnos,
    append: appendAlumnoToCache,
    remove: removeAlumnoFromCache
};

/**
 * Calcular promedio cuando cambia una nota en el grid multicurso
 */
function calcularPromedioMulticurso(input, cursoId) {
    const row = input.closest('tr');
    const inputsCurso = row ? row.querySelectorAll(`input[data-curso-id="${cursoId}"]`) : [];

    let suma = 0;
    let contador = 0;

    inputsCurso.forEach(inp => {
        const val = parseFloat(inp.value);
        if (!isNaN(val)) {
            suma += val;
            contador++;
        }
    });

    // Actualizar promedio del curso
    const promedioCell = row.querySelector(`[data-curso-id="${cursoId}"].promedio-curso`);
    if (promedioCell) {
        const promedio = contador > 0 ? (suma / contador).toFixed(1) : '-';
        promedioCell.textContent = promedio;

        // Color coding
        promedioCell.classList.remove('text-success', 'text-danger');
        if (contador > 0) {
            const prom = suma / contador;
            if (prom >= 11) promedioCell.classList.add('text-success');
            else promedioCell.classList.add('text-danger');
        }
    }

    // Recalcular promedio general
    const promediosCursos = [];
    document.querySelectorAll('#gridMulticursoBody .promedio-curso').forEach(cell => {
        const val = parseFloat(cell.textContent);
        if (!isNaN(val)) promediosCursos.push(val);
    });

    const promedioGeneral = promediosCursos.length > 0
        ? (promediosCursos.reduce((a, b) => a + b, 0) / promediosCursos.length).toFixed(2)
        : '-';

    const generalCell = document.querySelector('#gridMulticursoBody .promedio-general');
    if (generalCell) {
        generalCell.textContent = promedioGeneral;
    }
}

function renderTablaMulticurso() {
    const thead = document.getElementById('gridMulticursoHead');
    const tbody = document.getElementById('gridMulticursoBody');
    const table = document.getElementById('gridMulticurso');
    if (!thead || !tbody || !estadoMulticurso.alumno) {
        return;
    }

    const alumno = estadoMulticurso.alumno;
    const notasAlumno = estadoMulticurso.notas || [];
    const numNotas = Math.max(estadoMulticurso.numNotas || 0, 1);
    const valoresPrevios = estadoMulticurso.valores || {};
    estadoMulticurso.valores = null;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (table) {
        table.classList.toggle('vista-extendida', vistaMulticursoExtendida);
        table.classList.toggle('table-sm', vistaMulticursoCompacta);
    }

    let sumaPromedios = 0;
    let contadorCursos = 0;

    if (!vistaMulticursoExtendida) {
        const headerRow1 = document.createElement('tr');
        headerRow1.className = 'table-primary';
        headerRow1.innerHTML = '<th rowspan="2" class="align-middle text-center bg-white">📊 CURSOS</th>';

        alumno.cursos.forEach(curso => {
            const th = document.createElement('th');
            th.colSpan = numNotas + 1;
            th.className = 'text-center bg-primary text-white';
            th.dataset.cursoId = curso.curso_id;
            th.innerHTML = `<i class="bi bi-book-fill me-2"></i>${curso.curso_nombre}`;
            headerRow1.appendChild(th);
        });

        const thGeneral = document.createElement('th');
        thGeneral.rowSpan = 2;
        thGeneral.className = 'align-middle text-center bg-success text-white';
        thGeneral.innerHTML = '<i class="bi bi-trophy-fill me-1"></i>PROMEDIO<br>GENERAL';
        headerRow1.appendChild(thGeneral);
        thead.appendChild(headerRow1);

        const headerRow2 = document.createElement('tr');
        headerRow2.className = 'table-light';

        alumno.cursos.forEach(curso => {
            for (let i = 1; i <= numNotas; i++) {
                const th = document.createElement('th');
                th.className = 'text-center';
                th.style.width = '80px';
                th.innerHTML = `N${i}`;
                headerRow2.appendChild(th);
            }
            const thProm = document.createElement('th');
            thProm.className = 'text-center bg-light promedio-header';
            thProm.dataset.cursoId = curso.curso_id;
            thProm.style.width = '90px';
            thProm.innerHTML = 'Prom.';
            headerRow2.appendChild(thProm);
        });

        thead.appendChild(headerRow2);

        const dataRow = document.createElement('tr');
        const firstCell = document.createElement('td');
        firstCell.className = 'fw-bold text-center bg-light text-secondary';
        firstCell.innerHTML = '<i class="bi bi-calendar-check me-1"></i>Evaluaciones';
        dataRow.appendChild(firstCell);

        alumno.cursos.forEach(curso => {
            const valoresCursoPrevios = valoresPrevios[curso.curso_id] || [];
            const notasCurso = notasAlumno.filter(n => n.curso_id === curso.curso_id);
            let sumaCurso = 0;
            let contadorNotas = 0;

            for (let i = 0; i < numNotas; i++) {
                const td = document.createElement('td');
                td.className = 'p-1';

                // Find note for this specific column (N1, N2, etc.)
                const colName = `N${i + 1}`;
                // Fallback to index if columna_nota is missing (backward compatibility)
                const notaObj = notasCurso.find(n => n.columna_nota === colName) || notasCurso[i];

                const nota = valoresCursoPrevios[i] !== undefined
                    ? valoresCursoPrevios[i]
                    : (notaObj ? (notaObj.valor_numerico ?? notaObj.valor_literal ?? '') : '');

                const valorNumero = parseFloat(nota);
                if (!Number.isNaN(valorNumero)) {
                    sumaCurso += valorNumero;
                    contadorNotas++;
                }

                // Respect read-only mode
                const readOnlyFlag = !!window.LIBRETA_READ_ONLY;
                const readonlyAttr = readOnlyFlag ? 'disabled' : '';
                const onchangeAttr = readOnlyFlag ? '' : `onchange="manejarCambioNotaMulticurso(this, '${curso.curso_id}')"`;

                td.innerHTML = `
                    <input type="text" class="form-control text-center border-0 fw-bold text-primary nota-input" 
                           inputmode="decimal" maxlength="5"
                           value="${nota ?? ''}" 
                           placeholder="-"
                           onfocus="guardarValorPrevio(this)"
                           oninput="limitarEntradaNota(this)"
                           ${onchangeAttr}
                           ${readonlyAttr}
                           data-curso-id="${curso.curso_id}"
                           data-col-index="${i}"
                           data-original-value="${nota ?? ''}">
                `;
                dataRow.appendChild(td);
            }

            const tdPromedio = document.createElement('td');
            const promedioCurso = contadorNotas > 0 ? (sumaCurso / contadorNotas).toFixed(1) : '-';
            tdPromedio.className = 'text-center fw-bold bg-light promedio-curso';
            tdPromedio.setAttribute('data-curso-id', curso.curso_id);
            tdPromedio.textContent = promedioCurso;

            if (contadorNotas > 0) {
                const prom = sumaCurso / contadorNotas;
                if (prom >= 11) tdPromedio.classList.add('text-success');
                else tdPromedio.classList.add('text-danger');
                sumaPromedios += prom;
                contadorCursos++;
            }

            dataRow.appendChild(tdPromedio);
        });

        const tdGeneral = document.createElement('td');
        const promedioGeneral = contadorCursos > 0 ? (sumaPromedios / contadorCursos).toFixed(2) : '-';
        tdGeneral.className = 'text-center fw-bold fs-5 bg-success text-dark promedio-general';
        tdGeneral.textContent = promedioGeneral;
        dataRow.appendChild(tdGeneral);

        tbody.appendChild(dataRow);
    } else {
        const headerRow = document.createElement('tr');
        headerRow.className = 'table-primary';
        headerRow.innerHTML = '<th class="text-start">📘 Curso</th>';

        for (let i = 1; i <= numNotas; i++) {
            const th = document.createElement('th');
            th.className = 'text-center';
            th.style.width = '100px';
            th.innerHTML = `N${i}`;
            headerRow.appendChild(th);
        }

        const thPromedio = document.createElement('th');
        thPromedio.className = 'text-center';
        thPromedio.style.width = '110px';
        thPromedio.innerHTML = '<i class="bi bi-bar-chart"></i> Prom.';
        headerRow.appendChild(thPromedio);

        thead.appendChild(headerRow);

        alumno.cursos.forEach(curso => {
            const row = document.createElement('tr');
            const cursoCell = document.createElement('td');
            cursoCell.className = 'fw-semibold text-secondary ps-4';
            cursoCell.textContent = curso.curso_nombre;
            row.appendChild(cursoCell);

            const valoresCursoPrevios = valoresPrevios[curso.curso_id] || [];
            const notasCurso = notasAlumno.filter(n => n.curso_id === curso.curso_id);
            let sumaCurso = 0;
            let contadorNotas = 0;

            for (let i = 0; i < numNotas; i++) {
                const td = document.createElement('td');
                td.className = 'p-1';

                const nota = valoresCursoPrevios[i] !== undefined
                    ? valoresCursoPrevios[i]
                    : (notasCurso[i] ? (notasCurso[i].valor_numerico ?? notasCurso[i].valor_literal ?? '') : '');

                const valorNumero = parseFloat(nota);
                if (!Number.isNaN(valorNumero)) {
                    sumaCurso += valorNumero;
                    contadorNotas++;
                }

                const readOnlyFlag = !!window.LIBRETA_READ_ONLY;
                const readonlyAttr = readOnlyFlag ? 'disabled' : '';
                const onchangeAttr = readOnlyFlag ? '' : `onchange="manejarCambioNotaMulticurso(this, '${curso.curso_id}')"`;

                td.innerHTML = `
                    <input type="text" class="form-control text-center border-0 fw-bold text-primary nota-input" 
                           inputmode="decimal" maxlength="5"
                           value="${nota ?? ''}" 
                           placeholder="-"
                           onfocus="guardarValorPrevio(this)"
                           oninput="limitarEntradaNota(this)"
                           ${onchangeAttr}
                           ${readonlyAttr}
                           data-curso-id="${curso.curso_id}"
                           data-col-index="${i}">
                `;
                row.appendChild(td);
            }

            const tdPromedio = document.createElement('td');
            const promedioCurso = contadorNotas > 0 ? (sumaCurso / contadorNotas).toFixed(1) : '-';
            tdPromedio.className = 'text-center fw-bold bg-light promedio-curso';
            tdPromedio.setAttribute('data-curso-id', curso.curso_id);
            tdPromedio.textContent = promedioCurso;

            if (contadorNotas > 0) {
                const prom = sumaCurso / contadorNotas;
                if (prom >= 11) tdPromedio.classList.add('text-success');
                else tdPromedio.classList.add('text-danger');
                sumaPromedios += prom;
                contadorCursos++;
            }

            row.appendChild(tdPromedio);
            tbody.appendChild(row);
        });

        const footerRow = document.createElement('tr');
        footerRow.className = 'table-light fw-bold';
        const footerLabel = document.createElement('td');
        footerLabel.colSpan = numNotas + 1;
        footerLabel.className = 'text-end pe-3';
        footerLabel.textContent = 'PROMEDIO GENERAL:';

        const footerProm = document.createElement('td');
        const promedioGeneral = contadorCursos > 0 ? (sumaPromedios / contadorCursos).toFixed(2) : '-';
        footerProm.className = 'text-center bg-success text-white fs-5 promedio-general';
        footerProm.textContent = promedioGeneral;

        footerRow.appendChild(footerLabel);
        footerRow.appendChild(footerProm);
        tbody.appendChild(footerRow);
    }
}

function renderTablaIndividual() {
    const table = document.getElementById('gridNotas');
    const thead = document.querySelector('#gridNotas thead');
    const tbody = document.getElementById('gridNotasBody');
    if (!table || !thead || !tbody || !estadoIndividual.clasesSeccion.length) {
        return;
    }

    const clasesSeccion = estadoIndividual.clasesSeccion;
    const notasAlumno = estadoIndividual.notas || [];
    const numNotas = Math.max(estadoIndividual.numNotas || 0, 1);
    const valoresPrevios = estadoIndividual.valores || {};
    estadoIndividual.valores = null;

    table.classList.toggle('vista-extendida', vistaIndividualExtendida);
    table.classList.toggle('table-sm', vistaIndividualCompacta);

    const theadRow = thead.querySelector('tr');
    if (theadRow) {
        theadRow.innerHTML = '';
        const thCurso = document.createElement('th');
        thCurso.style.width = '250px';
        thCurso.className = 'ps-4';
        thCurso.textContent = 'Curso';
        theadRow.appendChild(thCurso);

        for (let i = 1; i <= numNotas; i++) {
            const th = document.createElement('th');
            th.className = 'text-center';
            th.style.width = '100px';
            th.textContent = `N${i}`;
            theadRow.appendChild(th);
        }

        const thProm = document.createElement('th');
        thProm.className = 'text-center bg-light';
        thProm.style.width = '110px';
        thProm.textContent = 'Promedio';
        theadRow.appendChild(thProm);
    }

    tbody.innerHTML = '';

    const promediosCursos = [];

    clasesSeccion.forEach(clase => {
        const curso = cursos.find(c => c.id === clase.curso_id);
        if (!curso) return;

        const cursoId = curso.id;
        const valoresCursoPrevios = valoresPrevios[cursoId] || [];
        const notasCurso = notasAlumno.filter(n => n.clase_id === clase.id || n.curso_id === curso.id);

        if (vistaIndividualExtendida) {
            const separador = document.createElement('tr');
            separador.className = 'table-light';
            const separadorTd = document.createElement('td');
            separadorTd.colSpan = numNotas + 2;
            separadorTd.innerHTML = `<div class="fw-semibold text-primary"><i class="bi bi-book"></i> ${curso.nombre}</div>`;
            separador.appendChild(separadorTd);
            tbody.appendChild(separador);
        }

        const row = document.createElement('tr');
        row.dataset.cursoId = curso.id;
        row.dataset.claseId = clase.id;

        const cursoCell = document.createElement('td');
        cursoCell.className = 'ps-4 fw-semibold text-secondary';
        cursoCell.textContent = curso.nombre;
        row.appendChild(cursoCell);

        let suma = 0;
        let contador = 0;

        for (let i = 0; i < numNotas; i++) {
            const td = document.createElement('td');
            td.className = 'p-1';

            const nota = valoresCursoPrevios[i] !== undefined
                ? valoresCursoPrevios[i]
                : (notasCurso[i] ? (notasCurso[i].valor_numerico ?? notasCurso[i].valor_literal ?? '') : '');

            const valorNumero = parseFloat(nota);
            if (!Number.isNaN(valorNumero)) {
                suma += valorNumero;
                contador++;
            }

            td.innerHTML = `
                <input type="text" class="form-control text-center border-0 fw-bold text-primary nota-input" 
                       value="${nota ?? ''}" 
                       placeholder="-"
                       inputmode="decimal" maxlength="5"
                       onfocus="guardarValorPrevio(this)"
                       oninput="limitarEntradaNota(this)"
                       onchange="manejarCambioNotaIndividual(this)"
                       data-curso-id="${curso.id}"
                       data-col-index="${i}">
            `;
            row.appendChild(td);
        }

        const tdPromedio = document.createElement('td');
        const promedio = contador > 0 ? (suma / contador).toFixed(1) : '-';
        tdPromedio.className = 'text-center fw-bold bg-light text-dark promedio-cell';
        tdPromedio.textContent = promedio;
        row.appendChild(tdPromedio);

        tbody.appendChild(row);

        if (contador > 0) {
            const promedioNumero = suma / contador;
            if (promedioNumero >= 11) {
                tdPromedio.classList.add('text-success');
            } else {
                tdPromedio.classList.add('text-danger');
            }
            promediosCursos.push(promedioNumero);
        }
    });

    const promedioGeneral = promediosCursos.length > 0
        ? (promediosCursos.reduce((a, b) => a + b, 0) / promediosCursos.length).toFixed(2)
        : '-';

    const footerRow = document.createElement('tr');
    footerRow.className = 'table-light fw-bold';
    const footerLabel = document.createElement('td');
    footerLabel.colSpan = numNotas + 1;
    footerLabel.className = 'text-end pe-3';
    footerLabel.textContent = 'PROMEDIO GENERAL:';

    const footerProm = document.createElement('td');
    footerProm.className = 'text-center bg-primary text-white fs-5 promedio-general';
    footerProm.textContent = promedioGeneral;

    footerRow.appendChild(footerLabel);
    footerRow.appendChild(footerProm);
    tbody.appendChild(footerRow);
}



/**
 * Guardar todas las notas multicurso
 */
function guardarTodasLasNotasMulticurso() {
    if (window.LIBRETA_READ_ONLY) {
        showToast('Modo solo consulta: no se permiten cambios', 'warning');
        return;
    }

    (async () => {
        showLoading('Guardando calificaciones de todos los cursos...');
        try {
            console.debug('[NOTAS] Guardando multicurso — token:', getAuthToken?.() || null);
            const valores = capturarValoresMulticurso();
            if (!estadoMulticurso.alumno) {
                showToast('Alumno no seleccionado', 'warning');
                hideLoading();
                return;
            }

            // Determinar periodo/tipo/escala por defecto
            const periodoId = (document.getElementById('filtroPeriodo')?.value) || (periodos.find(p => p.activo)?.id) || (periodos[0]?.id);
            const tipoEvalId = tiposEvaluacion && tiposEvaluacion.length ? tiposEvaluacion[0].id : null;
            const escalaId = escalas && escalas.length ? escalas[0].id : null;

            if (!periodoId || !tipoEvalId || !escalaId) {
                hideLoading();
                showToast('No se pudo determinar período/tipo/escala para guardar las notas', 'danger');
                return;
            }

            const tasks = [];
            for (const cursoId of Object.keys(valores || {})) {
                const valoresCurso = valores[cursoId] || [];
                // Buscar la matricula para este curso
                const cursoEntry = (estadoMulticurso.alumno.cursos || []).find(c => c.curso_id === cursoId || c.clase_id === cursoId);
                let matriculaId = cursoEntry?.matricula_clase_id || estadoMulticurso.alumno?.matricula_clase_id || null;
                const claseId = cursoEntry?.clase_id || cursoEntry?.clase_id;

                // Si no encontramos matrícula localmente, intentar buscarla en Personas Service
                if (!matriculaId) {
                    matriculaId = await findMatriculaForAlumnoCurso(estadoMulticurso.alumno?.id, claseId, cursoId);
                    if (matriculaId) {
                        console.info('Matrícula encontrada via API para curso', cursoId, matriculaId);
                        // guardar en estructura local para evitar búsquedas repetidas
                        if (cursoEntry) cursoEntry.matricula_clase_id = matriculaId;
                    } else {
                        console.warn('No se encontró matrícula para curso', cursoId, estadoMulticurso.alumno);
                        continue;
                    }
                }

                valoresCurso.forEach((valor, index) => {
                    const v = ('' + (valor || '')).trim();

                    // Dirty check: Buscar el input para comparar con valor original
                    const input = document.querySelector(`input.nota-input[data-curso-id="${cursoId}"][data-col-index="${index}"]`);
                    if (input) {
                        const original = (input.dataset.originalValue || '').trim();
                        if (v === original) return;
                    }

                    if (!v) return;
                    const num = parseFloat(v.replace(/,/g, '.'));
                    if (Number.isNaN(num)) return;

                    const notaPayload = {
                        matricula_clase_id: matriculaId,
                        tipo_evaluacion_id: tipoEvalId,
                        periodo_id: periodoId,
                        escala_id: escalaId,
                        valor_numerico: num,
                        peso: 0,
                        columna_nota: `N${index + 1}`
                    };

                    tasks.push({ payload: notaPayload, claseId });
                });
            }

            // Ejecutar envío en lote (Batch)
            const notasPayloads = tasks.map(t => t.payload);

            if (notasPayloads.length === 0) {
                hideLoading();
                showToast('No hay notas para guardar', 'info');
                return;
            }

            const result = await NotasService.createNotasBatch(notasPayloads);

            hideLoading();

            if (result.success) {
                const successCount = result.data.processed || notasPayloads.length;
                showToast(`✅ Se guardaron ${successCount} calificaciones correctamente`, 'success');

                // Invalidate cache for affected classes
                const affectedClases = [...new Set(tasks.map(t => t.claseId).filter(id => id))];
                affectedClases.forEach(claseId => {
                    try { invalidateCachedAlumnos(claseId); } catch (e) { }
                });

                // Refrescar los datos del grid para mostrar las notas persistidas
                try { await cargarGridMulticurso(estadoMulticurso.alumno); } catch (e) { console.warn('Error recargando grid multicurso tras guardar:', e); }
            } else {
                console.error('Error guardando notas multicurso:', result.error);
                showToast('Error al guardar calificaciones: ' + (result.error || 'Error desconocido'), 'danger');
            }
        } catch (e) {
            hideLoading();
            console.error('Error guardando notas multicurso:', e);
            showToast('Error al guardar calificaciones: ' + e.message, 'danger');
        }
    })();
}
/**
 * Abrir Libreta de Notas Individual (Grid View) - Mantenido para compatibilidad
 */
async function abrirLibretaNotas(alumnoId, claseId) {
    const alumno = alumnos.find(a => a.id === alumnoId) ||
        alumnosAsignados.find(a => a.id === alumnoId) ||
        { nombres: 'Alumno', apellidos: 'Desconocido' };

    const nombreAlumno = `${alumno.apellidos}, ${alumno.nombres}`;

    // Crear modal dinámico si no existe
    const modalId = 'modalLibretaNotas';
    let modalEl = document.getElementById(modalId);

    if (!modalEl) {
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content bg-light">
                        <div class="modal-header bg-white border-bottom shadow-sm">
                            <div class="d-flex align-items-center">
                                <div class="avatar-circle bg-primary text-white me-3" id="libretaAvatar">A</div>
                                <div>
                                    <h5 class="modal-title fw-bold mb-0" id="libretaTitle">Libreta de Notas</h5>
                                    <small class="text-muted" id="libretaSubtitle">Gestión de calificaciones</small>
                                </div>
                            </div>
                            <div class="ms-auto d-flex gap-2 flex-wrap justify-content-end">
                                <div class="btn-group" role="group">
                                    <button class="btn btn-secondary" id="toggleVistaIndividualBtn" onclick="toggleVistaIndividual()">
                                        <i class="bi bi-arrows-angle-contract me-1"></i>Vista Compacta
                                    </button>
                                    <button class="btn btn-outline-secondary" id="toggleExtendidaIndividualBtn" onclick="toggleVistaIndividualExtendida()">
                                        <i class="bi bi-layout-split me-1"></i>Vista Extendida
                                    </button>
                                </div>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-outline-primary" onclick="agregarColumnaNota()">
                                        <i class="bi bi-plus-lg me-1"></i>Agregar Nota
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="eliminarColumnaNota()">
                                        <i class="bi bi-dash-lg me-1"></i>Quitar Nota
                                    </button>
                                </div>
                                <button class="btn btn-primary" onclick="guardarTodasLasNotas()">
                                    <i class="bi bi-save me-1"></i>Guardar Todo
                                </button>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div class="modal-body p-4">
                            <div class="card shadow-sm border-0">
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-hover table-bordered mb-0 align-middle" id="gridNotas">
                                            <thead class="bg-light text-secondary">
                                                <tr>
                                                    <th style="width: 250px; min-width: 200px;" class="ps-4">Curso</th>
                                                    <!-- Las columnas de notas se generarán dinámicamente -->
                                                    <th class="text-center bg-light" style="width: 100px;">Promedio</th>
                                                </tr>
                                            </thead>
                                            <tbody id="gridNotasBody">
                                                <tr><td colspan="10" class="text-center py-5">Cargando cursos y notas...</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalEl = document.getElementById(modalId);
    }

    // Configurar modal
    document.getElementById('libretaAvatar').textContent = nombreAlumno.charAt(0).toUpperCase();
    document.getElementById('libretaTitle').textContent = nombreAlumno;

    // Obtener info de la clase actual para saber grado/sección
    const claseActual = clases.find(c => c.id === claseId);
    const seccion = secciones.find(s => s.id === claseActual?.seccion_id);
    const grado = grados.find(g => g.id === seccion?.grado_id);

    document.getElementById('libretaSubtitle').textContent = `${grado?.nombre} "${seccion?.nombre}" - Año Académico 2025`;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Cargar datos
    await cargarGridNotas(alumnoId, claseActual);

    actualizarVistaIndividual();
}

/**
 * Cargar datos para el Grid de Notas
 */
async function cargarGridNotas(alumnoId, claseActual) {
    const tbody = document.getElementById('gridNotasBody');
    const thead = document.querySelector('#gridNotas thead tr');

    try {
        // 1. Obtener todos los cursos de la sección (simulado obteniendo todas las clases y filtrando)
        // En un sistema real, debería haber un endpoint: /academico/secciones/{id}/cursos
        const resultClases = await AcademicoService.listClases(0, 1000);
        let clasesSeccion = [];

        if (resultClases.success) {
            const todasClases = resultClases.data.clases || resultClases.data || [];
            clasesSeccion = todasClases.filter(c => c.seccion_id === claseActual.seccion_id);
        }

        if (clasesSeccion.length === 0) {
            // Fallback: mostrar al menos la clase actual
            clasesSeccion = [claseActual];
        }

        // 2. Obtener notas del alumno
        const resultNotas = await NotasService.getNotasAlumno(alumnoId);
        const notasAlumno = resultNotas.success ? (resultNotas.data.notas || []) : [];

        // 3. Configurar columnas (Default 4 notas)
        // Limpiar columnas de notas anteriores (mantener Curso y Promedio)
        while (thead.children.length > 2) {
            thead.removeChild(thead.children[1]);
        }

        // Insertar 4 columnas por defecto
        const numNotas = 4;
        for (let i = 0; i < numNotas; i++) {
            const th = document.createElement('th');
            th.className = 'text-center';
            th.style.width = '100px';
            th.innerHTML = `N${i + 1}`;
            thead.insertBefore(th, thead.lastElementChild);
        }

        // 4. Renderizar filas (Cursos)
        tbody.innerHTML = '';

        clasesSeccion.forEach(clase => {
            const curso = cursos.find(c => c.id === clase.curso_id);
            if (!curso) return;

            const row = document.createElement('tr');

            // Filtrar notas para este curso/clase
            const notasCurso = notasAlumno.filter(n => n.clase_id === clase.id || n.curso_id === curso.id); // Ajustar según backend

            // Celda Curso
            let html = `<td class="ps-4 fw-semibold text-secondary">${curso.nombre}</td>`;

            // Celdas Notas
            let suma = 0;
            let contador = 0;

            for (let i = 0; i < numNotas; i++) {
                // Buscar nota correspondiente por columna_nota
                const colName = `N${i + 1}`;
                const nota = notasCurso.find(n => n.columna_nota === colName) || notasCurso[i];
                const valor = nota ? (nota.valor_numerico || nota.valor_literal || '') : '';

                if (valor && !isNaN(valor)) {
                    suma += parseFloat(valor);
                    contador++;
                }

                html += `
                    <td class="p-1">
                        <input type="text" class="form-control text-center border-0 fw-bold text-primary nota-input" 
                               value="${valor}" 
                               placeholder="-"
                               inputmode="decimal" maxlength="5"
                               onfocus="guardarValorPrevio(this)"
                               oninput="limitarEntradaNota(this)"
                               onchange="manejarCambioNotaIndividual(this)"
                               data-clase-id="${clase.id}"
                               data-col-index="${i}"
                               data-original-value="${valor}">
                    </td>
                `;
            }

            // Celda Promedio
            const promedio = contador > 0 ? (suma / contador).toFixed(1) : '-';
            html += `
                <td class="text-center fw-bold bg-light text-dark promedio-cell">
                    ${promedio}
                </td>
            `;

            row.innerHTML = html;
            tbody.appendChild(row);
        });

        // Calcular promedio general
        const promediosCursos = [];
        tbody.querySelectorAll('.promedio-cell').forEach(cell => {
            const val = parseFloat(cell.textContent);
            if (!isNaN(val)) promediosCursos.push(val);
        });

        const promedioGeneral = promediosCursos.length > 0
            ? (promediosCursos.reduce((a, b) => a + b, 0) / promediosCursos.length).toFixed(2)
            : '-';

        // Agregar fila de promedio general
        const footerRow = document.createElement('tr');
        footerRow.className = 'table-light fw-bold';
        footerRow.innerHTML = `
            <td colspan="${numNotas + 1}" class="text-end pe-3">PROMEDIO GENERAL:</td>
            <td class="text-center bg-primary text-dark fs-5">${promedioGeneral}</td>
        `;
        tbody.appendChild(footerRow);

    } catch (error) {
        console.error('Error cargando grid:', error);
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }

    actualizarVistaIndividual();
}

function toggleVistaIndividual() {
    estadoIndividual.valores = capturarValoresIndividual();
    vistaIndividualCompacta = !vistaIndividualCompacta;
    if (vistaIndividualCompacta) {
        vistaIndividualExtendida = false;
    }
    renderTablaIndividual();
    actualizarVistaIndividual();
}

function toggleVistaIndividualExtendida() {
    estadoIndividual.valores = capturarValoresIndividual();
    vistaIndividualExtendida = !vistaIndividualExtendida;
    if (vistaIndividualExtendida) {
        vistaIndividualCompacta = false;
    }
    renderTablaIndividual();
    actualizarVistaIndividual();
}

function actualizarVistaIndividual() {
    const table = document.getElementById('gridNotas');
    const button = document.getElementById('toggleVistaIndividualBtn');
    const extendedButton = document.getElementById('toggleExtendidaIndividualBtn');
    if (!button) return;

    if (vistaIndividualCompacta) {
        if (table) table.classList.add('table-sm');
        button.classList.remove('btn-secondary');
        button.classList.add('btn-outline-secondary');
        button.innerHTML = '<i class="bi bi-arrows-angle-expand me-1"></i>Vista Extendida';
    } else {
        if (table) table.classList.remove('table-sm');
        button.classList.remove('btn-outline-secondary');
        button.classList.add('btn-secondary');
        button.innerHTML = '<i class="bi bi-arrows-angle-contract me-1"></i>Vista Compacta';
    }

    if (extendedButton) {
        if (vistaIndividualExtendida) {
            extendedButton.classList.add('btn-secondary');
            extendedButton.classList.remove('btn-outline-secondary');
        } else {
            extendedButton.classList.remove('btn-secondary');
            extendedButton.classList.add('btn-outline-secondary');
        }
    }
}

/**
 * Calcular promedio al cambiar un input
 */
function calcularPromedioFila(input) {
    const row = input.closest('tr');
    const inputs = row.querySelectorAll('input');
    let suma = 0;
    let contador = 0;

    inputs.forEach(inp => {
        const val = parseFloat(inp.value);
        if (!isNaN(val)) {
            suma += val;
            contador++;
        }
    });

    const promedioCell = row.querySelector('.promedio-cell');
    if (promedioCell) {
        promedioCell.textContent = contador > 0 ? (suma / contador).toFixed(1) : '-';

        // Color coding
        const prom = contador > 0 ? (suma / contador) : 0;
        if (prom >= 11) promedioCell.className = 'text-center fw-bold bg-light text-success promedio-cell';
        else if (prom > 0) promedioCell.className = 'text-center fw-bold bg-light text-danger promedio-cell';
        else promedioCell.className = 'text-center fw-bold bg-light text-muted promedio-cell';
    }

    // Recalcular promedio general
    const tbody = row.closest('tbody');
    const promedios = [];
    tbody.querySelectorAll('.promedio-cell').forEach(cell => {
        const val = parseFloat(cell.textContent);
        if (!isNaN(val)) promedios.push(val);
    });

    const promedioGeneral = promedios.length > 0
        ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2)
        : '-';

    const footerCell = tbody.lastElementChild.lastElementChild;
    if (footerCell && tbody.lastElementChild.textContent.includes('PROMEDIO GENERAL')) {
        footerCell.textContent = promedioGeneral;
    }
}

/**
 * Agregar nueva columna de nota
 */
function agregarColumnaNota() {
    if (!estadoIndividual.clasesSeccion.length) return;
    estadoIndividual.valores = capturarValoresIndividual();
    estadoIndividual.numNotas += 1;
    renderTablaIndividual();
    actualizarVistaIndividual();
}

function eliminarColumnaNota() {
    if (!estadoIndividual.clasesSeccion.length) return;
    if (estadoIndividual.numNotas <= 1) {
        showToast('Debe existir al menos una columna de notas.', 'info');
        return;
    }
    estadoIndividual.valores = capturarValoresIndividual();
    Object.keys(estadoIndividual.valores || {}).forEach(cursoId => {
        const valores = estadoIndividual.valores[cursoId] || [];
        if (valores.length > 0) {
            valores.splice(valores.length - 1, 1);
        }
        estadoIndividual.valores[cursoId] = valores;
    });
    estadoIndividual.numNotas = Math.max(estadoIndividual.numNotas - 1, 1);
    renderTablaIndividual();
    actualizarVistaIndividual();
}

/**
 * Guardar todas las notas (Simulado)
 */
function guardarTodasLasNotas() {
    if (window.LIBRETA_READ_ONLY) {
        showToast('Modo solo consulta: no se permiten cambios', 'warning');
        return;
    }

    (async () => {
        showLoading('Guardando calificaciones...');
        try {
            const tbody = document.getElementById('gridNotasBody');
            if (!tbody) {
                hideLoading();
                showToast('Grid no encontrado', 'warning');
                return;
            }

            const periodoId = (document.getElementById('filtroPeriodo')?.value) || (periodos.find(p => p.activo)?.id) || (periodos[0]?.id);
            const tipoEvalId = tiposEvaluacion && tiposEvaluacion.length ? tiposEvaluacion[0].id : null;
            const escalaId = escalas && escalas.length ? escalas[0].id : null;

            if (!periodoId || !tipoEvalId || !escalaId) {
                hideLoading();
                showToast('No se pudo determinar período/tipo/escala para guardar las notas', 'danger');
                return;
            }

            const inputs = tbody.querySelectorAll('input[data-clase-id]');
            const tasks = [];
            inputs.forEach(input => {
                const claseId = input.dataset.claseId;
                const valor = (input.value || '').trim();
                const originalValue = (input.dataset.originalValue || '').trim();

                // Dirty check: Si el valor no ha cambiado, saltar
                if (valor === originalValue) return;

                if (!valor) return; // TODO: Manejar borrado de notas si es necesario
                const num = parseFloat(valor.replace(/,/g, '.'));
                if (Number.isNaN(num)) return;

                // Buscar matricula para esta clase entre las matriculas globales
                // Primero buscar en alumnosAsignados (libreta individual normalmente carga alumno y clasesSeccion)
                let matriculaId = null;
                const currentAlumnoId = estadoIndividual.alumnoId || null;
                if (currentAlumnoId) {
                    const alumno = alumnosAsignados.find(a => a.id === currentAlumnoId) || alumnos.find(a => a.id === currentAlumnoId);
                    if (alumno) {
                        const cursoEntry = (alumno.cursos || []).find(c => c.clase_id === claseId || c.curso_id === claseId);
                        matriculaId = cursoEntry?.matricula_clase_id || alumno.matricula_clase_id || null;
                    }
                }

                if (!matriculaId) {
                    // As fallback, intentar buscar en matriculas global
                    const mat = matriculas.find(m => m.clase_id === claseId && (m.alumno_id === estadoIndividual.alumnoId));
                    if (mat) matriculaId = mat.id;
                }

                if (!matriculaId) {
                    console.warn('No se encontró matrícula para clase', claseId, 'input', input);
                    return;
                }

                const colIndex = parseInt(input.dataset.colIndex || '0', 10);
                const notaPayload = {
                    matricula_clase_id: matriculaId,
                    tipo_evaluacion_id: tipoEvalId,
                    periodo_id: periodoId,
                    escala_id: escalaId,
                    valor_numerico: num,
                    peso: 0,
                    columna_nota: `N${colIndex + 1}`
                };

                tasks.push({ payload: notaPayload, claseId });
            });

            // Ejecutar envío en lote (Batch)
            const notasPayloads = tasks.map(t => t.payload);

            if (notasPayloads.length === 0) {
                hideLoading();
                showToast('No hay notas para guardar', 'info');
                return;
            }

            const result = await NotasService.createNotasBatch(notasPayloads);

            hideLoading();

            if (result.success) {
                const successCount = result.data.processed || notasPayloads.length;
                showToast(`✅ Se guardaron ${successCount} calificaciones correctamente`, 'success');

                // Invalidate cache for affected classes
                const affectedClases = [...new Set(tasks.map(t => t.claseId).filter(id => id))];
                affectedClases.forEach(claseId => {
                    try { invalidateCachedAlumnos(claseId); } catch (e) { }
                });
            } else {
                console.error('Error guardando notas individuales:', result.error);
                showToast('Error al guardar calificaciones: ' + (result.error || 'Error desconocido'), 'danger');
            }
            // Recargar la página para sincronizar vista individual con datos persistidos
            try { window.location.reload(); } catch (e) { console.warn('No se pudo recargar la página automáticamente:', e); }
        } catch (e) {
            hideLoading();
            console.error('Error guardando notas individuales:', e);
            showToast('Error al guardar calificaciones: ' + e.message, 'danger');
        }
    })();
}


/**
 * Filtrar datos según los filtros seleccionados
 */
function filtrarDatos() {
    if (!currentUser) return;

    const userRole = currentUser?.rol?.nombre ||
        currentUser?.rol ||
        currentUser?.role ||
        currentUser?.numero ||
        'UNKNOWN';

    if (userRole === 'ADMIN') {
        cargarNotasAdmin();
    } else if (userRole === 'DOCENTE') {
        cargarNotasDocente();
    }
}

/**
 * Manejar cambio de grado (solo admin)
 */
function onGradoChange() {
    const gradoId = document.getElementById('filtroGrado')?.value;
    const selectSeccion = document.getElementById('filtroSeccion');

    if (selectSeccion) {
        selectSeccion.innerHTML = '<option value="">Todas las secciones</option>';
    }

    filtrarDatos();
}

/**
 * Abrir modal para nueva nota (solo admin)
 */
function abrirModalNuevaNota() {
    showToast('Función en desarrollo', 'info');
}

/**
 * Ver detalle de notas
 */
function verDetalleNotas(alumnoId) {
    showToast('Función en desarrollo', 'info');
}

/**
 * Filtrar estudiantes en el modal
 */
function filtrarEstudiantesModal() {
    const input = document.getElementById('searchEstudiante');
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById('tablaEstudiantesClase');
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const nombreCell = rows[i].getElementsByTagName('td')[0];
        const docCell = rows[i].getElementsByTagName('td')[1];

        if (nombreCell && docCell) {
            const txtValue = nombreCell.textContent || nombreCell.innerText;
            const docValue = docCell.textContent || docCell.innerText;

            if (txtValue.toLowerCase().indexOf(filter) > -1 || docValue.indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

// Inicializar página cuando se carga
document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticación básica
    if (!requireAuth()) return;

    // Verificar que el usuario sea ADMIN o DOCENTE
    const user = getUserData();
    const userRole = user?.rol?.nombre;

    if (!['ADMIN', 'DOCENTE'].includes(userRole)) {
        showToast(`Acceso denegado. Tu rol es: ${userRole}. Se requiere ADMIN o DOCENTE.`, 'danger');
        setTimeout(() => {
            window.location.href = '../pages/dashboard.html';
        }, 2000);
        return;
    }

    // Cargar datos del usuario en navbar si existe la función
    if (typeof loadUserInfo === 'function') {
        loadUserInfo();
    } else {
        // Fallback si no existe loadUserInfo (usualmente en dashboard.js)
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl) userNameEl.textContent = user.username || user.nombres;
        if (userRoleEl) userRoleEl.textContent = userRole;
        if (userAvatarEl) userAvatarEl.textContent = (user.username || 'U').charAt(0).toUpperCase();
    }

    // Cargar menú del sidebar
    if (typeof setupSidebar === 'function') {
        setupSidebar();
    }

    // Inicializar la página
    initNotasPage();
});


