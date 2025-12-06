// ============================================
// GESTIÓN DE MATRÍCULAS
// ============================================

let matriculas = [];
let alumnos = [];
let clases = [];
let cursos = [];
let secciones = [];
let periodos = [];
let docentes = [];
let grados = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticación y rol ADMIN
    if (!requireAuth()) return;
    if (!requireRole('ADMIN')) {
        showToast('Acceso denegado', 'Solo administradores pueden acceder a esta sección', 'error');
        window.location.href = '/pages/dashboard.html';
        return;
    }

    // Cargar datos del usuario en navbar
    loadUserInfo();

    // Cargar menú del sidebar
    loadSidebarMenu();

    // Cargar datos iniciales
    initializeData();

    // Event listeners
    document.getElementById('formMatricula').addEventListener('submit', handleSubmitMatricula);
    document.getElementById('searchInput').addEventListener('input', debounce(loadMatriculas, 500));
    document.getElementById('filterClase').addEventListener('change', loadMatriculas);
    document.getElementById('filterPeriodo').addEventListener('change', loadMatriculas);
    document.getElementById('filterEstado').addEventListener('change', loadMatriculas);
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Búsqueda incremental de alumnos en matrícula
    document.getElementById('matriculaAlumnoSearch').addEventListener('input', handleAlumnoSearch);
    document.getElementById('matriculaAlumnoSearch').addEventListener('focus', showAlumnosDropdown);
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#matriculaAlumnoSearch') && !e.target.closest('#alumnosDropdown')) {
            hideAlumnosDropdown();
        }
    });

    // Mostrar información de la clase al seleccionar
    document.getElementById('matriculaClase').addEventListener('change', showClaseInfo);
    // Re-evaluar estado del alumno seleccionado cada vez que cambia la clase
    document.getElementById('matriculaClase').addEventListener('change', function () {
        evaluateSelectedAlumnoStatus();
    });

    // Establecer fecha actual por defecto
    document.getElementById('matriculaFecha').value = new Date().toISOString().split('T')[0];

    // Reset form when modal closes
    document.getElementById('modalMatricula').addEventListener('hidden.bs.modal', function () {
        document.getElementById('formMatricula').reset();
        document.getElementById('matriculaId').value = '';
        document.getElementById('modalMatriculaTitle').textContent = 'Nueva Matrícula';
        document.getElementById('claseInfo').classList.add('d-none');
        document.getElementById('matriculaFecha').value = new Date().toISOString().split('T')[0];
        
        // Reset búsqueda de alumno
        document.getElementById('matriculaAlumnoSearch').value = '';
        document.getElementById('matriculaAlumno').value = '';
        hideAlumnosDropdown();
        
        // Remover badge/label de estado del alumno si existe
        const statusEl = document.getElementById('matriculaAlumnoStatus');
        if (statusEl) statusEl.remove();

        // Rehabilitar botón enviar por si estaba deshabilitado
        const submitBtn = document.querySelector('#formMatricula button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;

        resetFamiliaresMatricula();
    });

    // Al abrir el modal de matrícula, refrescar la lista desde el servidor
    // para evitar usar datos potencialmente stale en memoria.
    document.getElementById('modalMatricula').addEventListener('show.bs.modal', async function () {
        try {
            // Asegurar que tanto alumnos como clases estén actualizados
            await Promise.allSettled([loadAlumnos(), loadClases(), loadMatriculas()]);
        } catch (err) {
            console.warn('No se pudo refrescar datos al abrir modal:', err);
        }
    });

    // Event listeners para gestión de familiares
    document.getElementById('btnBuscarPadreMatricula').addEventListener('click', buscarPadreMatricula);
    document.getElementById('btnAgregarRelacionMatricula').addEventListener('click', agregarRelacionMatricula);
});

/**
 * Inicializa los datos necesarios
 */
async function initializeData() {
    console.log('🚀 Iniciando carga de datos para matrículas...');
    
    try {
        // Cargar datos en paralelo con Promise.allSettled para no fallar por un solo error
        const results = await Promise.allSettled([
            loadAlumnos(),
            loadClases(),
            loadCursos(),
            loadSecciones(),
            loadPeriodos(),
            loadDocentes(),
            loadGrados()
        ]);

        // Revisar qué cargó correctamente
        const operations = ['Alumnos', 'Clases', 'Cursos', 'Secciones', 'Periodos', 'Docentes', 'Grados'];
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`❌ Error cargando ${operations[index]}:`, result.reason);
            } else {
                console.log(`✅ ${operations[index]} cargado correctamente`);
            }
        });

        // Poblar los selects después de cargar todos los datos
        console.log('📝 Poblando selects de clases...');
        populateClasesSelect();

        console.log('📋 Cargando matrículas...');
        await loadMatriculas();
        
        console.log('🎉 Inicialización completada');
    } catch (error) {
        console.error('💥 Error en initializeData:', error);
        showToast('Error al inicializar datos', 'danger');
    }
}

/**
 * Carga la información del usuario en el navbar
 */
function loadUserInfo() {
    const user = getUserData();
    if (user) {
        document.getElementById('userName').textContent = user.username;
        document.getElementById('userRole').innerHTML = getRoleBadge(user.rol?.nombre);
        document.getElementById('userAvatar').textContent = getInitials(user.username);
    }
}

/**
 * Carga el menú del sidebar
 */
function loadSidebarMenu() {
    const menuItems = [
        { page: 'dashboard.html', label: 'Dashboard', icon: 'grid-fill' },
        { page: 'grados.html', label: 'Grados', icon: 'bookmark-fill' },
        { page: 'cursos.html', label: 'Cursos', icon: 'book-fill' },
        { page: 'secciones.html', label: 'Secciones', icon: 'collection-fill' },
        { page: 'periodos.html', label: 'Periodos', icon: 'calendar-range-fill' },
        { page: 'clases.html', label: 'Clases', icon: 'door-open-fill' },
        { page: 'alumnos.html', label: 'Alumnos', icon: 'people-fill' },
        { page: 'matriculas.html', label: 'Matrículas', icon: 'journal-check', active: true },
        { page: 'usuarios.html', label: 'Usuarios', icon: 'person-gear' },
        { page: 'notas.html', label: 'Notas', icon: 'clipboard-check' }
    ];

    const sidebarMenu = document.getElementById('sidebarMenu');
    sidebarMenu.innerHTML = menuItems.map(item => `
        <li>
            <a href="${item.page}" class="${item.active ? 'active' : ''}">
                <i class="bi bi-${item.icon}"></i>
                <span class="menu-text">${item.label}</span>
            </a>
        </li>
    `).join('');
}

/**
 * Carga los alumnos
 */
async function loadAlumnos() {
    try {
        const result = await PersonasService.listAlumnos(0, 100);
        if (result.success) {
            // Normalizar IDs a string para evitar comparaciones tipo-sensitive
            alumnos = (result.data.alumnos || result.data)
                .filter(a => a.status === 'ACTIVO')
                .map(a => Object.assign({}, a, { id: String(a.id) }));
            populateAlumnosSelect();
        }
    } catch (error) {
        console.error('Error loading alumnos:', error);
    }
}

/**
 * Pobla el selector de alumnos
 */
function populateAlumnosSelect() {
    // Ya no necesitamos poblar un select, usamos búsqueda incremental
    console.log(`Cargados ${alumnos.length} alumnos para búsqueda`);
}

/**
 * Maneja la búsqueda incremental de alumnos
 */
function handleAlumnoSearch() {
    const searchTerm = document.getElementById('matriculaAlumnoSearch').value.toLowerCase();
    const dropdown = document.getElementById('alumnosDropdown');

    if (searchTerm.length < 2) {
        hideAlumnosDropdown();
        return;
    }

    const filteredAlumnos = alumnos.filter(alumno => {
        const fullName = `${alumno.apellidos} ${alumno.nombres}`.toLowerCase();
        const codigo = (alumno.codigo_alumno || '').toLowerCase();
        return fullName.includes(searchTerm) || codigo.includes(searchTerm);
    });

    if (filteredAlumnos.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item text-muted">No se encontraron alumnos</div>';
    } else {
        dropdown.innerHTML = filteredAlumnos.slice(0, 10).map(alumno => {
            const fullName = `${alumno.apellidos}, ${alumno.nombres}`;
            const codigo = alumno.codigo_alumno ? `(${alumno.codigo_alumno})` : '';
            return `
                <div class="dropdown-item" data-id="${alumno.id}" style="cursor: pointer;">
                    <div class="fw-bold">${fullName}</div>
                    <small class="text-muted">${codigo}</small>
                </div>
            `;
        }).join('');

        // Event listeners para seleccionar alumno
        dropdown.querySelectorAll('.dropdown-item[data-id]').forEach(item => {
            item.addEventListener('click', function() {
                const alumnoId = this.dataset.id;
                const alumno = alumnos.find(a => a.id === alumnoId);
                if (alumno) {
                    selectAlumno(alumno);
                }
            });
        });
    }

    showAlumnosDropdown();
}

/**
 * Selecciona un alumno
 */
function selectAlumno(alumno) {
    document.getElementById('matriculaAlumnoSearch').value = `${alumno.apellidos}, ${alumno.nombres}`;
    document.getElementById('matriculaAlumno').value = alumno.id;
    hideAlumnosDropdown();

    // Verificar si el alumno ya está matriculado en esta clase y mostrar estado
    const ya = checkAlumnoMatriculado(alumno);
    if (ya) {
        showAlumnoStatus('Este alumno ya está matriculado en la clase seleccionada', 'matriculado');
        // Deshabilitar submit para evitar conflicto accidental
        const submitBtn = document.querySelector('#formMatricula button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
    } else {
        showAlumnoStatus('Disponible para matricular', 'available');
        const submitBtn = document.querySelector('#formMatricula button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;
    }
}

/**
 * Muestra el dropdown de alumnos
 */
function showAlumnosDropdown() {
    const dropdown = document.getElementById('alumnosDropdown');
    dropdown.classList.add('show');
}

/**
 * Oculta el dropdown de alumnos
 */
function hideAlumnosDropdown() {
    const dropdown = document.getElementById('alumnosDropdown');
    dropdown.classList.remove('show');
}

/**
 * Verifica si el alumno ya está matriculado
 */
function checkAlumnoMatriculado(alumno) {
    const claseId = document.getElementById('matriculaClase').value;
    if (!claseId) return false;

    const yaMatriculado = matriculas.some(m =>
        m.alumno_id === alumno.id &&
        m.clase_id === claseId &&
        m.status === 'ACTIVO'
    );

    return yaMatriculado;
}

/**
 * Muestra un badge/label pequeño indicando el estado del alumno en el modal.
 * type: 'matriculado' | 'available'
 */
function showAlumnoStatus(message, type = 'available') {
    try {
        const container = document.querySelector('#matriculaAlumnoSearch').closest('.position-relative');
        if (!container) return;

        let statusEl = document.getElementById('matriculaAlumnoStatus');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'matriculaAlumnoStatus';
            statusEl.style.marginTop = '6px';
            statusEl.style.fontWeight = '600';
            statusEl.style.display = 'inline-block';
            statusEl.style.padding = '4px 8px';
            statusEl.style.borderRadius = '12px';
            statusEl.style.fontSize = '12px';
            container.appendChild(statusEl);
        }

        if (type === 'matriculado') {
            statusEl.textContent = message || 'Ya matriculado';
            statusEl.style.backgroundColor = '#f8d7da';
            statusEl.style.color = '#842029';
        } else {
            statusEl.textContent = message || 'Disponible';
            statusEl.style.backgroundColor = '#d1e7dd';
            statusEl.style.color = '#0f5132';
        }

        // Efecto blink: alternar visibilidad 6 veces en 3s
        let flashes = 0;
        statusEl.style.visibility = 'visible';
        const blinkInterval = setInterval(() => {
            statusEl.style.visibility = (statusEl.style.visibility === 'hidden') ? 'visible' : 'hidden';
            flashes += 1;
            if (flashes >= 6) {
                clearInterval(blinkInterval);
                statusEl.style.visibility = 'visible';
            }
        }, 500);
    } catch (err) {
        console.warn('No se pudo mostrar estado del alumno:', err);
    }
}

/**
 * Evalúa el alumno actualmente seleccionado (valor hidden) y actualiza el estado UI.
 */
function evaluateSelectedAlumnoStatus() {
    const alumnoId = document.getElementById('matriculaAlumno').value;
    if (!alumnoId) return;
    const alumno = alumnos.find(a => a.id === alumnoId);
    if (!alumno) return;

    const ya = checkAlumnoMatriculado(alumno);
    if (ya) {
        showAlumnoStatus('Este alumno ya está matriculado en la clase seleccionada', 'matriculado');
        const submitBtn = document.querySelector('#formMatricula button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
    } else {
        showAlumnoStatus('Disponible para matricular', 'available');
        const submitBtn = document.querySelector('#formMatricula button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;
    }
}

/**
 * Carga las clases
 */
async function loadClases() {
    try {
        console.log('🔄 Cargando clases...');
        const result = await AcademicoService.listClases(0, 100);
        console.log('📊 Resultado completo de clases:', result);
        
        if (result.success) {
            const rawClases = result.data.clases || result.data || [];
            console.log('📋 Clases en bruto:', rawClases);
            
            // Normalizar IDs y campos relacionados a string
            clases = rawClases
                .filter(c => c.status === 'ACTIVO' || c.status === 'ACTIVA')
                .map(c => Object.assign({}, c, {
                    id: String(c.id),
                    curso_id: c.curso_id != null ? String(c.curso_id) : c.curso_id,
                    seccion_id: c.seccion_id != null ? String(c.seccion_id) : c.seccion_id,
                    periodo_id: c.periodo_id != null ? String(c.periodo_id) : c.periodo_id,
                    docente_user_id: c.docente_user_id != null ? String(c.docente_user_id) : c.docente_user_id
                }));
            console.log(`✅ Clases cargadas: ${clases.length}`);
            console.log('🎯 Clases filtradas:', clases);
        } else {
            console.error('❌ Error al cargar clases:', result.error);
            showToast('Error al cargar clases: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('💥 Error loading clases:', error);
        showToast('Error de conexión al cargar clases', 'danger');
    }
}

/**
 * Carga los cursos
 */
async function loadCursos() {
    try {
        const result = await AcademicoService.listCursos(0, 100);
        if (result.success) {
            cursos = (result.data.cursos || result.data || []).map(c => Object.assign({}, c, { id: String(c.id) }));
        }
    } catch (error) {
        console.error('Error loading cursos:', error);
    }
}

/**
 * Carga las secciones
 */
async function loadSecciones() {
    try {
        const result = await AcademicoService.listSecciones(0, 100);
        if (result.success) {
            secciones = (result.data.secciones || result.data || []).map(s => Object.assign({}, s, { id: String(s.id), grado_id: s.grado_id != null ? String(s.grado_id) : s.grado_id }));
        }
    } catch (error) {
        console.error('Error loading secciones:', error);
    }
}

/**
 * Carga los periodos
 */
/**
 * Carga los periodos
 */
async function loadPeriodos() {
    try {
        const result = await AcademicoService.listPeriodos(0, 100);
        if (result.success) {
            periodos = (result.data.periodos || result.data || []).map(p => Object.assign({}, p, { id: String(p.id) }));
            populatePeriodosFilter();

            // Auto-seleccionar periodo actual
            const currentYear = new Date().getFullYear();
            const currentPeriod = periodos.find(p => p.año_escolar == currentYear && p.status === 'ACTIVO');

            if (currentPeriod) {
                const select = document.getElementById('filterPeriodo');
                if (select && !select.value) {
                    select.value = currentPeriod.id;
                }
            }
        }
    } catch (error) {
        console.error('Error loading periodos:', error);
    }
}

/**
 * Carga los docentes
 */
async function loadDocentes() {
    try {
        console.log('🔄 Cargando docentes...');
        
        // Intentar primero el endpoint de IAM
        let result = await IAMService.listUsers(0, 100);
        console.log('👥 Resultado usuarios IAM:', result);
        
        if (result.success) {
            const users = result.data.users || result.data.usuarios || result.data || [];
            console.log('👤 Usuarios en bruto:', users);
            
            docentes = users.filter(u => u.rol?.nombre === 'DOCENTE');
            console.log(`✅ Docentes encontrados desde IAM: ${docentes.length}`);
            console.log('🎓 Lista docentes IAM:', docentes);
        } else {
            console.warn('⚠️ No se pudieron cargar usuarios desde IAM, intentando endpoint alternativo...');
            
            // Intentar endpoint alternativo de académico
            const resultAlternativo = await AcademicoService.getDocentesActivos();
            console.log('🔄 Resultado docentes activos:', resultAlternativo);
            
            if (resultAlternativo.success) {
                docentes = resultAlternativo.data.docentes || [];
                console.log(`✅ Docentes encontrados desde Académico: ${docentes.length}`);
                showToast('Cargados docentes desde información de clases', 'info');
            } else {
                // Usar datos mock si ambos métodos fallan
                docentes = [
                    { id: 'mock-docente-1', username: 'docente1', nombres: 'Docente', apellidos: 'Demo' },
                    { id: 'mock-docente-2', username: 'docente2', nombres: 'Profesor', apellidos: 'Ejemplo' }
                ];
                console.log('📚 Usando docentes mock (ambos endpoints fallaron):', docentes);
                showToast('Usando datos de demostración para docentes', 'warning');
            }
        }
    } catch (error) {
        console.error('💥 Error loading docentes:', error);
        
        // Usar datos mock en caso de error
        docentes = [
            { id: 'mock-docente-1', username: 'docente1', nombres: 'Docente', apellidos: 'Demo' },
            { id: 'mock-docente-2', username: 'docente2', nombres: 'Profesor', apellidos: 'Ejemplo' }
        ];
        console.log('📚 Usando docentes mock por error:', docentes);
        showToast('Usando datos de demostración (error de conexión)', 'warning');
    }
}

/**
 * Carga los grados
 */
async function loadGrados() {
    try {
        const result = await AcademicoService.listGrados(0, 100);
        if (result.success) {
            grados = (result.data.grados || result.data || []).map(g => Object.assign({}, g, { id: String(g.id) }));
        }
    } catch (error) {
        console.error('Error loading grados:', error);
    }
}

/**
 * Pobla el selector de clases
 */
function populateClasesSelect() {
    console.log('🔧 Iniciando populateClasesSelect...');
    const selects = ['matriculaClase', 'filterClase'];

    console.log(`📊 Datos disponibles para selects:`, {
        clases: clases.length,
        cursos: cursos.length,
        secciones: secciones.length,
        periodos: periodos.length,
        grados: grados.length
    });

    if (clases.length === 0) {
        console.warn('⚠️ No hay clases disponibles para poblar los selects');
        showToast('No se encontraron clases activas', 'warning');
        return;
    }

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) {
            console.error(`❌ No se encontró el elemento select: ${selectId}`);
            return;
        }
        
        const isFilter = selectId.startsWith('filter');

        select.innerHTML = isFilter
            ? '<option value="">Todas las clases</option>'
            : '<option value="">Seleccionar clase...</option>';

        let optionsAdded = 0;
        clases.forEach(clase => {
            const curso = cursos.find(c => c.id === clase.curso_id);
            const seccion = secciones.find(s => s.id === clase.seccion_id);
            const periodo = periodos.find(p => p.id === clase.periodo_id);
            const grado = grados.find(g => g.id === seccion?.grado_id);

            const label = `${curso?.nombre || 'Sin Curso'} - ${grado?.nombre || 'Sin Grado'} ${seccion?.nombre || 'Sin Sección'} (${periodo?.nombre || 'Sin Período'})`;
            
            const option = document.createElement('option');
            option.value = clase.id;
            option.textContent = label;
            select.appendChild(option);
            optionsAdded++;
        });

        console.log(`✅ Select ${selectId} poblado con ${optionsAdded} clases`);
    });

    console.log('🎯 populateClasesSelect completado');
}

/**
 * Pobla el filtro de periodos
 */
function populatePeriodosFilter() {
    const select = document.getElementById('filterPeriodo');
    select.innerHTML = '<option value="">Todos los periodos</option>';

    periodos.filter(p => p.status === 'ACTIVO').forEach(periodo => {
        select.innerHTML += `<option value="${periodo.id}">${periodo.nombre}</option>`;
    });
}

/**
 * Muestra información de la clase seleccionada
 */
function showClaseInfo() {
    const claseId = document.getElementById('matriculaClase').value;
    const claseInfo = document.getElementById('claseInfo');

    if (!claseId) {
        claseInfo.classList.add('d-none');
        return;
    }

    const clase = clases.find(c => c.id === claseId);
    if (!clase) return;

    const curso = cursos.find(c => c.id === clase.curso_id);
    const seccion = secciones.find(s => s.id === clase.seccion_id);
    const periodo = periodos.find(p => p.id === clase.periodo_id);
    const docente = docentes.find(d => d.id === clase.docente_user_id);
    const grado = grados.find(g => g.id === seccion?.grado_id);

    document.getElementById('infoCurso').textContent = curso?.nombre || '-';
    document.getElementById('infoSeccion').textContent = grado && seccion ? `${grado.nombre} ${seccion.nombre}` : '-';
    document.getElementById('infoPeriodo').textContent = periodo?.nombre || '-';
    document.getElementById('infoDocente').textContent = docente?.username || '-';

    claseInfo.classList.remove('d-none');
}

/**
 * Carga las matrículas desde el API
 */
async function loadMatriculas() {
    const searchTerm = document.getElementById('searchInput').value;
    const claseId = document.getElementById('filterClase').value;
    const periodoId = document.getElementById('filterPeriodo').value;
    const estado = document.getElementById('filterEstado').value;

    const tbody = document.getElementById('matriculasTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const result = await PersonasService.listMatriculas(0, 100);

        if (result.success) {
            // Normalizar IDs a string para consistencia con otros arrays
            matriculas = (result.data.matriculas || result.data || []).map(m => Object.assign({}, m, {
                id: String(m.id),
                alumno_id: m.alumno_id != null ? String(m.alumno_id) : m.alumno_id,
                clase_id: m.clase_id != null ? String(m.clase_id) : m.clase_id
            }));

            // Aplicar filtros
            let filteredMatriculas = matriculas.filter(m => {
                let match = true;

                if (searchTerm) {
                    const alumno = alumnos.find(a => a.id === m.alumno_id);
                    if (alumno) {
                        const searchLower = searchTerm.toLowerCase();
                        match = match && (
                            alumno.nombres.toLowerCase().includes(searchLower) ||
                            alumno.apellidos.toLowerCase().includes(searchLower) ||
                            alumno.codigo_alumno?.toLowerCase().includes(searchLower)
                        );
                    }
                }

                if (claseId) match = match && m.clase_id === claseId;

                if (periodoId) {
                    const clase = clases.find(c => c.id === m.clase_id);
                    match = match && clase?.periodo_id === periodoId;
                }

                if (estado) match = match && m.status === estado;

                return match;
            });

            // Ordenar por fecha de matrícula (más reciente primero)
            filteredMatriculas.sort((a, b) => new Date(b.fecha_matricula) - new Date(a.fecha_matricula));

            displayMatriculas(filteredMatriculas);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading matriculas:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar matrículas: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar las matrículas', 'error');
    }
}

/**
 * Muestra las matrículas en la tabla
 */
function displayMatriculas(matriculasToDisplay) {
    const tbody = document.getElementById('matriculasTableBody');

    if (matriculasToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron matrículas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = matriculasToDisplay.map(matricula => {
        const alumno = alumnos.find(a => a.id === matricula.alumno_id);
        const clase = clases.find(c => c.id === matricula.clase_id);
        const curso = cursos.find(c => c.id === clase?.curso_id);
        const seccion = secciones.find(s => s.id === clase?.seccion_id);
        const periodo = periodos.find(p => p.id === clase?.periodo_id);
        const grado = grados.find(g => g.id === seccion?.grado_id);

        const alumnoNombre = alumno ? `${alumno.apellidos}, ${alumno.nombres}` : '<span class="text-muted">?</span>';
        const cursoNombre = curso?.nombre || '<span class="text-muted">?</span>';
        const seccionNombre = grado && seccion ? `${grado.nombre} ${seccion.nombre}` : '<span class="text-muted">?</span>';
        const periodoNombre = periodo?.nombre || '<span class="text-muted">?</span>';

        return `
            <tr id="matricula-row-${matricula.id}" data-id="${matricula.id}">
                <td class="fw-bold">${alumnoNombre}</td>
                <td>${cursoNombre}</td>
                <td><span class="badge bg-primary">${seccionNombre}</span></td>
                <td><span class="badge bg-info">${periodoNombre}</span></td>
                <td>${formatDate(matricula.fecha_matricula)}</td>
                <td>
                    <span class="badge ${matricula.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                        ${matricula.status || 'ACTIVO'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMatricula('${matricula.id}')"
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Resalta visualmente una matrícula y hace scroll hacia ella.
 * Si no encuentra la fila por id, intenta buscar por alumno+clase+fecha.
 */
function highlightAndScrollMatricula(matriculaId, alumnoId = null, claseId = null, fecha = null) {
    try {
        let row = document.getElementById(`matricula-row-${matriculaId}`);

        if (!row && alumnoId && claseId && fecha) {
            // Buscar fila por coincidencia de columnas (caso donde el id no estaba presente en el DOM)
            const rows = Array.from(document.querySelectorAll('#matriculasTableBody tr'));
            for (const r of rows) {
                // extraer valores de columna: alumno (col 0), clase/curso (col1), fecha (col4)
                const cols = r.querySelectorAll('td');
                const fechaTexto = cols[4]?.textContent?.trim();
                if (!fechaTexto) continue;

                // comparar fecha aproximada (ISO vs formato)
                if (formatDate(fecha) === fechaTexto) {
                    // intentar obtener alumno id por texto
                    row = r;
                    break;
                }
            }
        }

        if (!row) return;

        // Aplicar estilo de resaltado temporal
        const originalBg = row.style.backgroundColor;
        row.style.transition = 'background-color 0.4s ease';
        row.style.backgroundColor = '#fff3cd'; // tono amarillo suave

        // Hacer scroll y foco
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.focus && row.focus();

        // Remover el resaltado luego de 3.5s
        setTimeout(() => {
            row.style.backgroundColor = originalBg || '';
        }, 3500);
    } catch (err) {
        console.warn('No se pudo resaltar la matrícula:', err);
    }
}

/**
 * Maneja el submit del formulario de matrícula
 */
async function handleSubmitMatricula(e) {
    e.preventDefault();

    const matriculaData = {
        alumno_id: document.getElementById('matriculaAlumno').value,
        clase_id: document.getElementById('matriculaClase').value,
        fecha_matricula: document.getElementById('matriculaFecha').value,
        observaciones: document.getElementById('matriculaObservaciones').value.trim() || null
    };

    // Validaciones
    if (!matriculaData.alumno_id || !matriculaData.clase_id || !matriculaData.fecha_matricula) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        // Solo CREATE - no hay UPDATE de matrículas en el backend
        const result = await PersonasService.createMatricula(matriculaData);

        if (result.success) {
            showToast('Matrícula registrada correctamente', 'success');

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalMatricula'));
            modal && modal.hide();

            // Procesar relaciones familiares si existen (opcional)
            try {
                await procesarRelacionesFamiliares(result.data?.alumno_id || matriculaData.alumno_id);
            } catch (relErr) {
                console.warn('Error procesando relaciones familiares:', relErr);
            }

            // Recargar alumnos y clases primero para asegurar relaciones y nombres
            try {
                await Promise.all([loadAlumnos(), loadClases()]);
            } catch (preLoadErr) {
                console.warn('Advertencia: no se pudieron recargar alumnos/clases antes de refrescar matrículas', preLoadErr);
            }

            // Asegurar que los filtros del admin muestren la clase/periodo creados
            try {
                const claseIdFromResult = result.data?.clase_id || matriculaData.clase_id;
                if (claseIdFromResult) {
                    const claseObj = clases.find(c => c.id === String(claseIdFromResult));
                    if (claseObj) {
                        const periodoIdFromClase = claseObj.periodo_id;
                        const filterClaseElem = document.getElementById('filterClase');
                        const filterPeriodoElem = document.getElementById('filterPeriodo');
                        if (filterClaseElem) filterClaseElem.value = claseObj.id;
                        if (filterPeriodoElem && periodoIdFromClase) filterPeriodoElem.value = periodoIdFromClase;
                    }
                }
            } catch (filterErr) {
                console.warn('No se pudieron actualizar filtros para mostrar la clase creada:', filterErr);
            }

            // Finalmente recargar la tabla para reflejar el nuevo estado del servidor
            await loadMatriculas();

            // Si el backend retornó el id de la matrícula creada, resaltar y hacer scroll hacia ella
            const createdId = result.data?.id;
            if (createdId) {
                // esperar un tick para asegurarnos que la tabla se renderizó
                setTimeout(() => highlightAndScrollMatricula(createdId, result.data?.alumno_id, result.data?.clase_id, result.data?.fecha_matricula), 150);
            }
            return;
        }

        // Si el backend devolvió un status, manejamos casos especiales (ej: 409 Conflict)
        if (result.status === 409) {
            // Mostrar el mensaje exacto del servidor y recargar la lista para sincronizar
            showToast(result.error || 'Conflicto: matrícula duplicada', 'warning');
            // También recargar alumnos y clases por si algo cambió en los recursos relacionados
            try {
                await Promise.all([loadAlumnos(), loadClases()]);
            } catch (preLoadErr) {
                console.warn('Advertencia: no se pudieron recargar alumnos/clases tras conflicto', preLoadErr);
            }
            await loadMatriculas();
            return;
        }

        // Mensaje genérico para otros errores
        throw new Error(result.error || 'Error al crear matrícula');
    } catch (error) {
        console.error('Error saving matricula:', error);
        showToast(error.message || 'Error al registrar la matrícula', 'error');
    }
}

/**
 * Eliminar matrícula
 */
async function deleteMatricula(id) {
    const matricula = matriculas.find(m => m.id === id);
    if (!matricula) return;

    const confirmDelete = await showConfirm(
        '¿Eliminar matrícula?',
        '¿Estás seguro de eliminar esta matrícula? Esta acción no se puede deshacer.'
    );

    if (!confirmDelete) return;

    try {
        const result = await PersonasService.deleteMatricula(id);

        if (result.success) {
            showToast('Éxito', 'Matrícula eliminada correctamente', 'success');
            await loadMatriculas();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting matricula:', error);
        showToast('Error', error.message || 'Error al eliminar la matrícula', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}

// (Nota: handler único ya definido más arriba — versión consolidada)

// ============================================
// GESTIÓN DE FAMILIARES EN MATRÍCULA
// ============================================

let familiaresPendientes = []; // Array temporal para almacenar familiares a agregar

/**
 * Busca un padre por DNI para matrícula
 */
async function buscarPadreMatricula() {
    const dni = document.getElementById('buscarPadreDniMatricula').value.trim();
    if (!dni || dni.length !== 8) {
        showToast('Error', 'Ingrese un DNI válido de 8 dígitos', 'warning');
        return;
    }

    const btnBuscar = document.getElementById('btnBuscarPadreMatricula');
    const originalContent = btnBuscar.innerHTML;
    btnBuscar.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    btnBuscar.disabled = true;

    try {
        const result = await PersonasService.listPadres(0, 100);

        if (result.success) {
            const padres = result.data.padres || result.data || [];
            const padre = padres.find(p => p.dni === dni);

            if (padre) {
                // Verificar si ya está en la lista pendiente
                const yaAgregado = familiaresPendientes.find(f => f.padre_id === padre.id);
                if (yaAgregado) {
                    showToast('Información', 'Este padre ya está en la lista de familiares', 'warning');
                    return;
                }

                document.getElementById('padreEncontradoIdMatricula').value = padre.id;
                document.getElementById('nombrePadreEncontradoMatricula').textContent = `${padre.apellidos}, ${padre.nombres}`;
                document.getElementById('dniPadreEncontradoMatricula').textContent = padre.dni;
                document.getElementById('padreEncontradoMatricula').classList.remove('d-none');
                showToast('Éxito', 'Padre encontrado', 'success');
            } else {
                showToast('Info', 'No se encontró ningún padre con ese DNI. Puede registrarlo primero.', 'info');
                document.getElementById('padreEncontradoMatricula').classList.add('d-none');
            }
        }
    } catch (error) {
        console.error('Error searching padre:', error);
        showToast('Error', 'Error al buscar padre', 'error');
    } finally {
        btnBuscar.innerHTML = originalContent;
        btnBuscar.disabled = false;
    }
}

/**
 * Agrega una relación padre-alumno a la lista pendiente
 */
function agregarRelacionMatricula() {
    const padreId = document.getElementById('padreEncontradoIdMatricula').value;
    const nombrePadre = document.getElementById('nombrePadreEncontradoMatricula').textContent;
    const dniPadre = document.getElementById('dniPadreEncontradoMatricula').textContent;
    const tipoRelacion = document.getElementById('tipoRelacionMatricula').value;
    const esPrincipal = document.getElementById('esPrincipalMatricula').checked;

    if (!padreId) {
        showToast('Error', 'No hay padre seleccionado', 'error');
        return;
    }

    // Agregar a lista temporal
    familiaresPendientes.push({
        padre_id: padreId,
        nombre_padre: nombrePadre,
        dni_padre: dniPadre,
        tipo_relacion: tipoRelacion,
        es_contacto_principal: esPrincipal
    });

    // Actualizar UI
    actualizarListaFamiliaresPendientes();
    
    // Limpiar formulario de búsqueda
    document.getElementById('buscarPadreDniMatricula').value = '';
    document.getElementById('padreEncontradoMatricula').classList.add('d-none');
    document.getElementById('esPrincipalMatricula').checked = false;
    
    showToast('Éxito', 'Familiar agregado a la lista', 'success');
}

/**
 * Actualiza la lista visual de familiares pendientes
 */
function actualizarListaFamiliaresPendientes() {
    const lista = document.getElementById('listaFamiliaresMatricula');
    const container = document.getElementById('familiaresAgregados');
    
    if (familiaresPendientes.length === 0) {
        container.classList.add('d-none');
        return;
    }
    
    container.classList.remove('d-none');
    lista.innerHTML = familiaresPendientes.map((familiar, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <strong>${familiar.nombre_padre}</strong> 
                <span class="badge bg-info">${familiar.tipo_relacion}</span>
                ${familiar.es_contacto_principal ? '<span class="badge bg-success">Principal</span>' : ''}
                <br><small class="text-muted">DNI: ${familiar.dni_padre}</small>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="removerFamiliarPendiente(${index})" title="Remover">
                <i class="bi bi-trash"></i>
            </button>
        </li>
    `).join('');
}

/**
 * Remueve un familiar de la lista pendiente
 */
function removerFamiliarPendiente(index) {
    familiaresPendientes.splice(index, 1);
    actualizarListaFamiliaresPendientes();
    showToast('Info', 'Familiar removido de la lista', 'info');
}

/**
 * Resetea el estado de familiares en matrícula
 */
function resetFamiliaresMatricula() {
    familiaresPendientes = [];
    document.getElementById('buscarPadreDniMatricula').value = '';
    document.getElementById('padreEncontradoMatricula').classList.add('d-none');
    document.getElementById('familiaresAgregados').classList.add('d-none');
    document.getElementById('esPrincipalMatricula').checked = false;
    document.getElementById('tipoRelacionMatricula').selectedIndex = 0;
}

/**
 * Procesa las relaciones familiares después de crear la matrícula
 */
async function procesarRelacionesFamiliares(alumnoId) {
    if (familiaresPendientes.length === 0) return;

    for (const familiar of familiaresPendientes) {
        try {
            const relacionData = {
                alumno_id: alumnoId,
                padre_id: familiar.padre_id,
                tipo_relacion: familiar.tipo_relacion,
                es_contacto_principal: familiar.es_contacto_principal
            };

            const result = await PersonasService.createRelacion(relacionData);
            if (!result.success) {
                if (result.error?.includes('TIPO_RELACION_DUPLICADA') || result.error?.includes('ya tiene un')) {
                    console.warn(`Relación duplicada: ${familiar.nombre_padre} - ${familiar.tipo_relacion}`);
                    showToast('Advertencia', `El alumno ya tiene un ${familiar.tipo_relacion.toLowerCase()}`, 'warning');
                } else if (result.error?.includes('RELATION_ALREADY_EXISTS')) {
                    console.warn(`Relación ya existe entre ${familiar.nombre_padre} y el alumno`);
                    showToast('Info', `La relación con ${familiar.nombre_padre} ya existe`, 'info');
                } else {
                    console.warn(`Error al crear relación con ${familiar.nombre_padre}:`, result.error);
                    showToast('Error', `No se pudo crear relación con ${familiar.nombre_padre}`, 'error');
                }
            }
        } catch (error) {
            console.warn(`Error al procesar relación con ${familiar.nombre_padre}:`, error);
        }
    }
    
    showToast('Info', `${familiaresPendientes.length} relación(es) familiar(es) creadas`, 'info');
    familiaresPendientes = []; // Limpiar después de procesar
}
