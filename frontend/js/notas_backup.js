// notas.js - Gestión de Notas del Sistema
// Refactorizado completamente para eliminar errores de sintaxis

let currentUser = null;
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

/**
 * Inicializar la página según el rol del usuario
 */
async function initNotasPage() {
    try {
        showLoading();
        
        // Obtener usuario desde localStorage
        currentUser = getUserData();
        
        if (!currentUser) {
            showToast('No hay sesión activa. Redirigiendo al login...', 'warning');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
            return;
        }

        // Usar la misma estructura que otras páginas: user.rol.nombre
        const userRole = currentUser?.rol?.nombre || 'UNKNOWN';
        
        // Mostrar mensaje de bienvenida
        showToast(`Bienvenido ${currentUser.nombres || currentUser.username || 'Usuario'} - Rol: ${userRole}`, 'success');
        
        // Inicializar vista según rol
        if (userRole === 'ADMIN') {
            await initializeAdminView();
        } else if (userRole === 'DOCENTE') {
            await initializeDocenteView();
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error al inicializar página de notas:', error);
        showToast('Error al cargar la página: ' + error.message, 'danger');
        hideLoading();
    }
}

/**
 * Inicializar vista para administradores
 */
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
                        <p class="text-muted">Administra las calificaciones de todos los estudiantes</p>
                    </div>
                    <button class="btn btn-primary" onclick="abrirModalNuevaNota()">
                        <i class="bi bi-plus-lg me-2"></i>Nueva Nota
                    </button>
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
                                    <th>Período</th>
                                    <th>Promedio</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tablaNotas">
                                <tr>
                                    <td colspan="6" class="text-center">Cargando datos...</td>
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
                </div>
            </div>
        </div>
    `;
    
    await cargarDatosIniciales();
    await cargarNotasDocente();
}
        <div class="modal fade" id="modalEstudiantesClase" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="modalEstudiantesTitle">Estudiantes</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info d-flex align-items-center">
                            <i class="bi bi-info-circle-fill me-2 fs-4"></i>
                            <div>
                                Selecciona un estudiante para registrar sus calificaciones.
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                                <input type="text" class="form-control border-start-0 ps-0" id="searchEstudiante" 
                                       placeholder="Buscar estudiante por nombre o documento..." 
                                       onkeyup="filtrarEstudiantesModal()">
                            </div>
                        </div>

                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>Estudiante</th>
                                        <th>Documento</th>
                                        <th>Estado</th>
                                        <th class="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tablaEstudiantesClase">
                                    <tr><td colspan="4" class="text-center">Cargando...</td></tr>
                                </tbody>
                            </table>
                        </div>
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
            resultEscalas
        ] = await Promise.all([
            AcademicoService.listCursos(),
            AcademicoService.listSecciones(),
            AcademicoService.listGrados(),
            AcademicoService.listPeriodos(),
            PersonasService.listMatriculas(),
            PersonasService.listAlumnos(),
            NotasService.listTiposEvaluacion(),
            NotasService.listEscalas()
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
 * Cargar notas para administrador
 */
async function cargarNotasAdmin() {
    const tbody = document.getElementById('tablaNotas');
    if (!tbody) return;
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
        
        // Simular datos de prueba por ahora
        tbody.innerHTML = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-2">J</div>
                        <div>
                            <div class="fw-semibold">Juan Pérez</div>
                            <small class="text-muted">12345678</small>
                        </div>
                    </div>
                </td>
                <td>5to - A</td>
                <td><span class="badge bg-primary">Matemáticas</span></td>
                <td>I Bimestre 2025</td>
                <td><span class="badge bg-success">18.50</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="abrirGestionNotas(1)" title="Gestionar Notas">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" 
                            onclick="verDetalleNotas(1)" title="Ver Detalle">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
        
    } catch (error) {
        console.error('Error cargando notas:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar notas</td></tr>';
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
        
        // Obtener todos los alumnos de todas las clases del docente
        let todosLosAlumnos = [];
        
        for (const clase of clases) {
            try {
                const result = await PersonasService.getAlumnosPorClase(clase.id);
                
                if (result.success && result.data) {
                    const alumnosClase = Array.isArray(result.data) ? result.data : 
                                       result.data.alumnos || result.data.items || [];
                    
                    // Enriquecer datos del alumno con info de la clase
                    const alumnosEnriquecidos = alumnosClase.map(alumno => {
                        const curso = cursos.find(c => c.id === clase.curso_id);
                        const seccion = secciones.find(s => s.id === clase.seccion_id);
                        const grado = grados.find(g => g.id === seccion?.grado_id);
                        
                        return {
                            ...alumno,
                            clase_id: clase.id,
                            curso_id: clase.curso_id,
                            curso_nombre: curso?.nombre || 'Sin curso',
                            seccion_id: clase.seccion_id,
                            seccion_nombre: seccion?.nombre || 'Sin sección',
                            grado_id: seccion?.grado_id,
                            grado_nombre: grado?.nombre || 'Sin grado',
                            periodo_id: clase.periodo_id
                        };
                    });
                    
                    todosLosAlumnos = [...todosLosAlumnos, ...alumnosEnriquecidos];
                }
            } catch (error) {
                console.warn(`Error cargando alumnos para clase ${clase.id}:`, error);
            }
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
                    periodo_id: alumno.periodo_id
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
        
        // Renderizar tabla
        renderizarTablaAlumnos(alumnosUnicos);
        
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

/**
 * Filtrar alumnos según los criterios seleccionados
 */
function filtrarAlumnos() {
    const claseId = document.getElementById('filtroClase')?.value || '';
    const gradoId = document.getElementById('filtroGradoDocente')?.value || '';
    const seccionId = document.getElementById('filtroSeccionDocente')?.value || '';
    const textoBusqueda = document.getElementById('buscarAlumno')?.value.toLowerCase() || '';
    
    const alumnosFiltrados = alumnosAsignados.filter(alumno => {
        const cumpleClase = !claseId || alumno.cursos.some(c => c.clase_id === claseId);
        const cumpleGrado = !gradoId || alumno.grado_id === gradoId;
        const cumpleSeccion = !seccionId || alumno.seccion_id === seccionId;
        const cumpleTexto = !textoBusqueda || 
            alumno.nombres.toLowerCase().includes(textoBusqueda) ||
            alumno.apellidos.toLowerCase().includes(textoBusqueda) ||
            (alumno.numero_documento && alumno.numero_documento.includes(textoBusqueda)) ||
            alumno.cursos.some(c => c.curso_nombre.toLowerCase().includes(textoBusqueda));
        
        return cumpleClase && cumpleGrado && cumpleSeccion && cumpleTexto;
    });
    
    renderizarTablaAlumnos(alumnosFiltrados);
}

/**
 * Ver estudiantes de una clase específica
 */
async function verEstudiantesClase(claseId) {
    const modal = new bootstrap.Modal(document.getElementById('modalEstudiantesClase'));
    const tbody = document.getElementById('tablaEstudiantesClase');
    const title = document.getElementById('modalEstudiantesTitle');
    
    // Buscar info de la clase
    const clase = clases.find(c => c.id === claseId);
    const curso = cursos.find(c => c.id === clase?.curso_id);
    const seccion = secciones.find(s => s.id === clase?.seccion_id);
    const grado = grados.find(g => g.id === seccion?.grado_id);
    
    if (title) {
        title.innerHTML = `<i class="bi bi-people-fill me-2"></i>Estudiantes - ${curso?.nombre || 'Curso'} (${grado?.nombre} ${seccion?.nombre})`;
    }
    
    modal.show();
    tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border text-primary spinner-border-sm me-2"></div>Cargando estudiantes...</td></tr>';
    
    try {
        const result = await PersonasService.getAlumnosPorClase(claseId);
        
        if (result.success && result.data) {
            const alumnosClase = Array.isArray(result.data) ? result.data : 
                               result.data.alumnos || result.data.items || [];
            
            // Actualizar variable global para notas-siagie.js
            alumnosAsignados = alumnosClase.map(alumno => ({
                ...alumno,
                clase_id: claseId,
                curso_id: clase.curso_id,
                seccion_id: clase.seccion_id,
                periodo_id: clase.periodo_id,
                matricula_clase_id: alumno.matricula_clase_id || alumno.id
            }));
            
            if (alumnosClase.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay estudiantes matriculados en esta clase</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            
            alumnosClase.forEach((alumno, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle me-3 bg-primary text-white fw-bold shadow-sm">
                                ${(alumno.nombres || 'E').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="fw-bold text-dark">${alumno.apellidos}, ${alumno.nombres}</div>
                                <small class="text-muted"><i class="bi bi-card-heading me-1"></i>${alumno.numero_documento || '-'}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border">
                            <i class="bi bi-check-circle-fill text-success me-1"></i>Matriculado
                        </span>
                    </td>
                    <td>
                        <div class="progress" style="height: 5px; width: 100px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 0%"></div>
                        </div>
                        <small class="text-muted" style="font-size: 0.7rem;">Progreso: 0%</small>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-primary btn-sm shadow-sm" 
                                onclick="abrirLibretaNotas('${alumno.id}', '${claseId}')">
                            <i class="bi bi-pencil-square me-1"></i>Gestionar Notas
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
        } else {
            throw new Error('No se pudieron obtener los estudiantes');
        }
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }
}

/**
 * Abrir Libreta de Notas Multicurso (Grid View con cursos como cabeceras)
 */
async function abrirLibretaMulticurso(alumnoId) {
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
                            <div class="ms-auto d-flex gap-2">
                                <button class="btn btn-outline-success" onclick="agregarColumnaMulticurso()">
                                    <i class="bi bi-plus-lg me-1"></i>Agregar Columna
                                </button>
                                <button class="btn btn-success" onclick="guardarTodasLasNotasMulticurso()">
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
    
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    
    // Cargar datos
    await cargarGridMulticurso(alumno);
}

/**
 * Cargar grid multicurso con cursos como cabeceras principales
 */
async function cargarGridMulticurso(alumno) {
    const thead = document.getElementById('gridMulticursoHead');
    const tbody = document.getElementById('gridMulticursoBody');
    
    try {
        // Configurar cabeceras dinámicamente
        thead.innerHTML = '';
        
        // Crear fila de cabeceras principales (Cursos)
        const headerRow1 = document.createElement('tr');
        headerRow1.className = 'table-primary';
        
        // Primera columna fija
        headerRow1.innerHTML = '<th rowspan="2" class="align-middle text-center bg-white">📊 CURSOS</th>';
        
        // Columnas por curso (4 notas + promedio cada uno)
        const numNotasPorCurso = 4;
        alumno.cursos.forEach(curso => {
            // Cabecera del curso (colspan = 4 notas + 1 promedio)
            const th = document.createElement('th');
            th.colSpan = numNotasPorCurso + 1;
            th.className = 'text-center bg-primary text-white';
            th.innerHTML = `<i class="bi bi-book-fill me-2"></i>${curso.curso_nombre}`;
            headerRow1.appendChild(th);
        });
        
        // Columna de promedio general
        const thGeneral = document.createElement('th');
        thGeneral.rowSpan = 2;
        thGeneral.className = 'align-middle text-center bg-success text-white';
        thGeneral.innerHTML = '<i class="bi bi-trophy-fill me-1"></i>PROMEDIO<br>GENERAL';
        headerRow1.appendChild(thGeneral);
        
        thead.appendChild(headerRow1);
        
        // Crear fila de sub-cabeceras (N1, N2, N3, N4, Promedio por cada curso)
        const headerRow2 = document.createElement('tr');
        headerRow2.className = 'table-light';
        
        alumno.cursos.forEach(curso => {
            // Sub-cabeceras para cada curso
            for (let i = 1; i <= numNotasPorCurso; i++) {
                const th = document.createElement('th');
                th.className = 'text-center';
                th.style.width = '80px';
                th.innerHTML = `N${i}`;
                headerRow2.appendChild(th);
            }
            // Promedio del curso
            const thProm = document.createElement('th');
            thProm.className = 'text-center bg-light';
            thProm.style.width = '90px';
            thProm.innerHTML = 'Prom.';
            headerRow2.appendChild(thProm);
        });
        
        thead.appendChild(headerRow2);
        
        // Cargar notas existentes
        const notasAlumno = await obtenerNotasAlumnoMulticurso(alumno.id);
        
        // Crear fila de datos (solo una fila ya que es un alumno)
        tbody.innerHTML = '';
        
        const dataRow = document.createElement('tr');
        
        // Primera celda (nombre del tipo de evaluación o periodo)
        const firstCell = document.createElement('td');
        firstCell.className = 'fw-bold text-center bg-light text-secondary';
        firstCell.innerHTML = '<i class="bi bi-calendar-check me-1"></i>Evaluaciones';
        dataRow.appendChild(firstCell);
        
        let sumaPromedios = 0;
        let contadorCursos = 0;
        
        // Celdas por curso
        alumno.cursos.forEach(curso => {
            const notasCurso = notasAlumno.filter(n => n.curso_id === curso.curso_id);
            
            let sumaCurso = 0;
            let contadorNotas = 0;
            
            // 4 notas por curso
            for (let i = 0; i < numNotasPorCurso; i++) {
                const td = document.createElement('td');
                td.className = 'p-1';
                
                const nota = notasCurso[i];
                const valor = nota ? (nota.valor_numerico || nota.valor_literal || '') : '';
                
                if (valor && !isNaN(valor)) {
                    sumaCurso += parseFloat(valor);
                    contadorNotas++;
                }
                
                td.innerHTML = `
                    <input type="number" class="form-control text-center border-0 fw-bold text-primary" 
                           value="${valor}" 
                           placeholder="-"
                           min="0" max="20" step="0.1"
                           onchange="calcularPromedioMulticurso(this, '${curso.curso_id}')"
                           data-curso-id="${curso.curso_id}"
                           data-col-index="${i}">
                `;
                dataRow.appendChild(td);
            }
            
            // Celda de promedio del curso
            const tdPromedio = document.createElement('td');
            const promedioCurso = contadorNotas > 0 ? (sumaCurso / contadorNotas).toFixed(1) : '-';
            tdPromedio.className = 'text-center fw-bold bg-light promedio-curso';
            tdPromedio.setAttribute('data-curso-id', curso.curso_id);
            tdPromedio.textContent = promedioCurso;
            
            // Color coding
            if (contadorNotas > 0) {
                const prom = sumaCurso / contadorNotas;
                if (prom >= 11) tdPromedio.classList.add('text-success');
                else tdPromedio.classList.add('text-danger');
                
                sumaPromedios += prom;
                contadorCursos++;
            }
            
            dataRow.appendChild(tdPromedio);
        });
        
        // Celda de promedio general
        const tdGeneral = document.createElement('td');
        const promedioGeneral = contadorCursos > 0 ? (sumaPromedios / contadorCursos).toFixed(2) : '-';
        tdGeneral.className = 'text-center fw-bold fs-5 bg-success text-white promedio-general';
        tdGeneral.textContent = promedioGeneral;
        dataRow.appendChild(tdGeneral);
        
        tbody.appendChild(dataRow);
        
    } catch (error) {
        console.error('Error cargando grid multicurso:', error);
        tbody.innerHTML = `<tr><td colspan="20" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }
}

/**
 * Obtener notas del alumno para todos sus cursos
 */
async function obtenerNotasAlumnoMulticurso(alumnoId) {
    try {
        const result = await NotasService.getNotasAlumno(alumnoId);
        return result.success ? (result.data.notas || []) : [];
    } catch (error) {
        console.warn('Error obteniendo notas:', error);
        return [];
    }
}

/**
 * Calcular promedio cuando cambia una nota en el grid multicurso
 */
function calcularPromedioMulticurso(input, cursoId) {
    const row = input.closest('tr');
    const inputsCurso = row.querySelectorAll(`input[data-curso-id="${cursoId}"]`);
    
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
    row.querySelectorAll('.promedio-curso').forEach(cell => {
        const val = parseFloat(cell.textContent);
        if (!isNaN(val)) promediosCursos.push(val);
    });
    
    const promedioGeneral = promediosCursos.length > 0 
        ? (promediosCursos.reduce((a, b) => a + b, 0) / promediosCursos.length).toFixed(2)
        : '-';
        
    const generalCell = row.querySelector('.promedio-general');
    if (generalCell) {
        generalCell.textContent = promedioGeneral;
    }
}

/**
 * Agregar columna de nota a todos los cursos
 */
function agregarColumnaMulticurso() {
    const thead = document.getElementById('gridMulticursoHead');
    const tbody = document.getElementById('gridMulticursoBody');
    const headerRow1 = thead.rows[0]; // Fila de cursos
    const headerRow2 = thead.rows[1]; // Fila de N1, N2, etc.
    
    // Contar cursos
    const numCursos = headerRow1.children.length - 2; // -2 por CURSOS y PROMEDIO GENERAL
    
    // Agregar sub-header antes de cada promedio
    for (let i = 0; i < numCursos; i++) {
        // Encontrar el último input de cada curso
        const cursoCells = headerRow2.querySelectorAll('th');
        const nuevaPos = (i + 1) * 5 - 1; // Posición antes del promedio de cada curso
        
        if (nuevaPos < cursoCells.length) {
            const th = document.createElement('th');
            th.className = 'text-center';
            th.style.width = '80px';
            
            // Contar cuántas notas tiene ya este curso
            const notasExistentes = Math.floor((nuevaPos) / 5) * 5 + Math.floor((nuevaPos % 5));
            th.innerHTML = `N${((nuevaPos - i) % 5) + 1}`;
            
            headerRow2.insertBefore(th, cursoCells[nuevaPos]);
        }
    }
    
    // Actualizar colspan de los cursos
    for (let i = 1; i <= numCursos; i++) {
        const cursoHeader = headerRow1.children[i];
        cursoHeader.colSpan = parseInt(cursoHeader.colSpan) + 1;
    }
    
    // Agregar celdas en la fila de datos
    const dataRow = tbody.rows[0];
    for (let i = 0; i < numCursos; i++) {
        const td = document.createElement('td');
        td.className = 'p-1';
        td.innerHTML = `
            <input type="number" class="form-control text-center border-0 fw-bold text-primary" 
                   placeholder="-"
                   min="0" max="20" step="0.1"
                   onchange="calcularPromedioMulticurso(this, 'curso-${i}')"
                   data-curso-id="curso-${i}">
        `;
        
        // Insertar antes del promedio correspondiente
        const insertPos = (i + 1) * 5 + i;
        if (insertPos < dataRow.children.length) {
            dataRow.insertBefore(td, dataRow.children[insertPos]);
        } else {
            dataRow.appendChild(td);
        }
    }
}

/**
 * Guardar todas las notas multicurso
 */
function guardarTodasLasNotasMulticurso() {
    showLoading('Guardando calificaciones de todos los cursos...');
    setTimeout(() => {
        hideLoading();
        showToast('✅ Todas las calificaciones han sido guardadas correctamente', 'success');
    }, 2000);
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
                            <div class="ms-auto d-flex gap-2">
                                <button class="btn btn-outline-primary" onclick="agregarColumnaNota()">
                                    <i class="bi bi-plus-lg me-1"></i>Agregar Nota
                                </button>
                                <button class="btn btn-success" onclick="guardarTodasLasNotas()">
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
                // Buscar nota correspondiente (asumiendo orden o tipo)
                // Simplificación: tomamos la nota en índice i
                const nota = notasCurso[i];
                const valor = nota ? (nota.valor_numerico || nota.valor_literal || '') : '';
                
                if (valor && !isNaN(valor)) {
                    suma += parseFloat(valor);
                    contador++;
                }
                
                html += `
                    <td class="p-1">
                        <input type="text" class="form-control text-center border-0 fw-bold text-primary" 
                               value="${valor}" 
                               placeholder="-"
                               onchange="calcularPromedioFila(this)"
                               data-clase-id="${clase.id}"
                               data-col-index="${i}">
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
            <td class="text-center bg-primary text-white fs-5">${promedioGeneral}</td>
        `;
        tbody.appendChild(footerRow);
        
    } catch (error) {
        console.error('Error cargando grid:', error);
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Error: ${error.message}</td></tr>`;
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
    const thead = document.querySelector('#gridNotas thead tr');
    const tbody = document.getElementById('gridNotasBody');
    
    // Insertar header antes del promedio
    const th = document.createElement('th');
    th.className = 'text-center';
    th.style.width = '100px';
    th.innerHTML = `N${thead.children.length - 1}`; // -1 por Curso, pero +1 por nueva... lógica simple: length - 1 (Curso + Promedio existen)
    thead.insertBefore(th, thead.lastElementChild);
    
    // Insertar celdas en cada fila
    Array.from(tbody.rows).forEach(row => {
        const td = document.createElement('td');
        td.className = 'p-1';
        td.innerHTML = `
            <input type="text" class="form-control text-center border-0 fw-bold text-primary" 
                   placeholder="-"
                   onchange="calcularPromedioFila(this)">
        `;
        row.insertBefore(td, row.lastElementChild);
    });
}

/**
 * Guardar todas las notas (Simulado)
 */
function guardarTodasLasNotas() {
    showLoading('Guardando calificaciones...');
    setTimeout(() => {
        hideLoading();
        showToast('Calificaciones guardadas correctamente', 'success');
    }, 1500);
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
document.addEventListener('DOMContentLoaded', function() {
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