// ============================================
// NOTAS DE MIS HIJOS - PADRE
// ============================================

// Evitar redeclaraciones si otros scripts ya definieron `currentUser`
if (typeof currentUser === 'undefined') currentUser = null;
let hijos = [];
let notas = [];
let periodos = [];
let cursos = [];
let clases = [];
let matriculas = [];
let tiposEvaluacion = [];
let tiposEvaluacionMap = {};
let notasPagination = { page: 1, pageSize: 10, totalPages: 1, totalItems: 0 };

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticación y rol
    if (!requireAuth() || !hasRole('PADRE')) {
        showToast('Solo padres pueden acceder a esta página', 'danger');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
        return;
    }

    currentUser = getUserData();
    loadSidebarMenu();
    updateUserInfo();
    await loadInitialData();
    setupEventListeners();

    // Verificar si hay un hijo pre-seleccionado desde el dashboard
    const selectedHijoId = localStorage.getItem('selectedHijoId');
    if (selectedHijoId) {
        // Esperar un momento para que se carguen los hijos
        setTimeout(() => {
            const selectHijo = document.getElementById('selectHijo');
            if (selectHijo) {
                selectHijo.value = selectedHijoId;
                selectHijo.dispatchEvent(new Event('change'));
                localStorage.removeItem('selectedHijoId'); // Limpiar después de usar
            }
        }, 500);
    }
});

/**
 * Carga datos iniciales
 */
async function loadInitialData() {
    try {
        showLoading('Cargando datos...');

        await Promise.all([
            loadHijos(),
            loadPeriodos(),
            loadCursos(),
            loadClases(),
            loadTiposEvaluacion()
        ]);

        hideLoading();
    } catch (error) {
        console.error('Error loading initial data:', error);
        hideLoading();
        showToast('Error al cargar datos iniciales', 'danger');
    }
}

/**
 * Carga tipos de evaluación y construye un mapa por id
 */
async function loadTiposEvaluacion() {
    try {
        const res = await NotasService.listTiposEvaluacion(0, 50);
        if (res.success) {
            if (Array.isArray(res.data)) tiposEvaluacion = res.data;
            else if (Array.isArray(res.data.items)) tiposEvaluacion = res.data.items;
            else tiposEvaluacion = [];

            tiposEvaluacionMap = {};
            tiposEvaluacion.forEach(t => {
                tiposEvaluacionMap[t.id] = t;
            });
        } else {
            console.warn('listTiposEvaluacion failed:', res);
            tiposEvaluacion = [];
            tiposEvaluacionMap = {};
        }
    } catch (e) {
        console.warn('Error loading tipos evaluacion', e);
        tiposEvaluacion = [];
        tiposEvaluacionMap = {};
    }
}

/**
 * Obtiene el peso de la nota: primero intenta campos en la propia nota,
 * si no hay o es 0, intenta usar el peso_default del tipo de evaluación.
 * Devuelve texto formateado como 'X%' o 'N/A'
 */
function getNotaPeso(nota) {
    const pesoRaw = nota?.peso_porcentaje ?? nota?.peso ?? nota?.weight ?? nota?.peso_valor ?? nota?.peso_default ?? nota?.metadata_json?.peso;

    let pesoVal = null;
    if (pesoRaw !== null && typeof pesoRaw !== 'undefined' && pesoRaw !== '') {
        const num = Number(pesoRaw);
        if (!isNaN(num)) pesoVal = num;
    }

    // Si no hay peso válido o es 0, intentar obtener desde tipo de evaluación
    if ((pesoVal === null || pesoVal === 0) && nota?.tipo_evaluacion_id) {
        const tipo = tiposEvaluacionMap[nota.tipo_evaluacion_id] || tiposEvaluacionMap[nota.tipo_evaluacion] || null;
        const fallback = tipo?.peso_default ?? tipo?.peso ?? tipo?.peso_porcentaje;
        if (fallback !== null && typeof fallback !== 'undefined') {
            const numf = Number(fallback);
            if (!isNaN(numf)) pesoVal = numf;
        }
    }

    if (pesoVal === null || typeof pesoVal === 'undefined') return 'N/A';
    return `${pesoVal}%`;
}

/**
 * Carga los hijos del padre actual
 */
async function loadHijos() {
    try {
        // Obtener hijos del padre actual usando el nuevo endpoint
        const result = await PadreService.getMisHijos();
        if (result.success) {
            hijos = result.data.hijos || result.data || [];

            // Ordenar hijos por apellidos para mejor UX
            hijos.sort((a, b) => {
                const aName = (a.apellidos || a.apellido_paterno || '').toString().trim();
                const bName = (b.apellidos || b.apellido_paterno || '').toString().trim();
                return aName.localeCompare(bName, 'es');
            });

            const selectHijo = document.getElementById('selectHijo');
            if (selectHijo) {
                if (hijos.length === 0) {
                    selectHijo.innerHTML = '<option value="">No tienes hijos registrados</option>';
                } else {
                    selectHijo.innerHTML = '<option value="">Selecciona un hijo...</option>' +
                        hijos.map(hijo =>
                            `<option value="${hijo.id}">${(hijo.apellidos || '').trim()} ${(hijo.nombres || '').trim()}</option>`
                        ).join('');

                    // Si solo hay un hijo, auto-seleccionarlo y cargar notas automáticamente
                    if (hijos.length === 1) {
                        selectHijo.value = hijos[0].id;
                        // small timeout to let DOM update
                        setTimeout(() => {
                            selectHijo.dispatchEvent(new Event('change'));
                        }, 50);
                    }
                }
            } else {
                console.warn('selectHijo element not found in DOM — skipping select population');
            }
        }
    } catch (error) {
        console.error('Error loading hijos:', error);
        showToast('Error al cargar hijos', 'danger');
    }
}

/**
 * Carga periodos
 */
/**
 * Carga periodos
 */
async function loadPeriodos() {
    try {
        const result = await AcademicoService.getPeriodos();
        if (result.success) {
            // Normalizar a array
            if (Array.isArray(result.data)) periodos = result.data;
            else if (Array.isArray(result.data.items)) periodos = result.data.items;
            else if (Array.isArray(result.data.periodos)) periodos = result.data.periodos;
            else periodos = [];

            populateSelect('selectPeriodo', periodos, 'id', 'nombre', 'Todos los periodos');

            // Auto-seleccionar periodo actual
            const currentYear = new Date().getFullYear();
            const currentPeriod = periodos.find(p => p.año_escolar == currentYear && p.status === 'ACTIVO');

            if (currentPeriod) {
                const select = document.getElementById('selectPeriodo');
                if (select && !select.value) {
                    select.value = currentPeriod.id;
                }
            }
        } else {
            periodos = [];
        }
    } catch (error) {
        console.error('Error loading periodos:', error);
    }
}

/**
 * Carga cursos
 */
async function loadCursos() {
    try {
        const result = await AcademicoService.getCursos();
        if (result.success) {
            if (Array.isArray(result.data)) cursos = result.data;
            else if (Array.isArray(result.data.items)) cursos = result.data.items;
            else if (Array.isArray(result.data.cursos)) cursos = result.data.cursos;
            else cursos = [];
        } else {
            cursos = [];
        }
    } catch (error) {
        console.error('Error loading cursos:', error);
    }
}

/**
 * Carga clases
 */
async function loadClases() {
    try {
        const result = await AcademicoService.getClases();
        if (result.success) {
            if (Array.isArray(result.data)) clases = result.data;
            else if (Array.isArray(result.data.items)) clases = result.data.items;
            else if (Array.isArray(result.data.clases)) clases = result.data.clases;
            else clases = [];
        } else {
            clases = [];
        }
    } catch (error) {
        console.error('Error loading clases:', error);
    }
}

/**
 * Carga las notas del hijo seleccionado
 */
async function loadNotas() {
    const hijoId = document.getElementById('selectHijo').value;
    const periodoId = document.getElementById('selectPeriodo').value;
    const cursoId = document.getElementById('selectCurso').value;

    if (!hijoId) {
        showToast('Selecciona un hijo', 'warning');
        return;
    }

    try {
        showLoading('Cargando notas...');

        // Cargar matrículas del alumno solicitando solo las matrículas del hijo
        const matriculasResult = await PersonasService.listMatriculas(0, 500, hijoId);
        if (matriculasResult.success) {
            let rawMatriculas = [];
            if (Array.isArray(matriculasResult.data)) rawMatriculas = matriculasResult.data;
            else if (Array.isArray(matriculasResult.data.items)) rawMatriculas = matriculasResult.data.items;
            else if (Array.isArray(matriculasResult.data.matriculas)) rawMatriculas = matriculasResult.data.matriculas;

            matriculas = rawMatriculas;
        } else {
            matriculas = [];
        }

        // Llenar select de cursos disponibles usando las matrículas recién cargadas
        await loadCursosDisponibles(hijoId);

        // Cargar notas específicas del alumno
        const result = await NotasService.getNotasAlumno(hijoId, 0, 500);
        hideLoading();

        if (result.success) {
            let allNotas = [];
            if (Array.isArray(result.data)) allNotas = result.data;
            else if (Array.isArray(result.data.items)) allNotas = result.data.items;
            else if (Array.isArray(result.data.notas)) allNotas = result.data.notas;

            // Filtrar notas del hijo (compatibilidad con distintas estructuras)
            const matriculaIds = matriculas.map(m => m.id);
            notas = allNotas.filter(nota => {
                if (nota.alumno_id && String(nota.alumno_id) === String(hijoId)) return true;
                if (nota.matricula_clase_id && matriculaIds.includes(nota.matricula_clase_id)) return true;
                return false;
            });

            // Aplicar filtros adicionales por periodo y curso
            if (periodoId || cursoId) {
                notas = notas.filter(nota => {
                    const matricula = matriculas.find(m => m.id === nota.matricula_clase_id) || {};
                    const clase = clases.find(c => c.id === matricula.clase_id) || {};

                    if (periodoId && String(clase.periodo_id) !== String(periodoId)) return false;
                    if (cursoId && String(clase.curso_id) !== String(cursoId)) return false;
                    return true;
                });
            }

            // Reset pagination to first page when loading new notas
            notasPagination.page = 1;
            displayNotas();
            updateStats();
        } else {
            showToast('Error al cargar notas', 'danger');
        }
    } catch (error) {
        console.error('Error loading notas:', error);
        hideLoading();
        showToast('Error al cargar notas', 'danger');
    }
}

/**
 * Muestra las notas en la tabla
 */
function displayNotas() {
    const tbody = document.getElementById('notasTableBody');

    if (notas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No se encontraron notas
                </td>
            </tr>
        `;
        document.getElementById('statsCards').style.display = 'none';
        return;
    }

    // Actualizar paginación
    notasPagination.totalItems = notas.length;
    notasPagination.totalPages = Math.max(1, Math.ceil(notasPagination.totalItems / notasPagination.pageSize));
    if (notasPagination.page > notasPagination.totalPages) notasPagination.page = notasPagination.totalPages;

    const start = (notasPagination.page - 1) * notasPagination.pageSize;
    const end = start + notasPagination.pageSize;
    const pageNotas = notas.slice(start, end);

    tbody.innerHTML = pageNotas.map(nota => {
        const matricula = matriculas.find(m => m.id === nota.matricula_clase_id) || {};
        const clase = clases.find(c => c.id === matricula.clase_id) || {};
        const curso = cursos.find(c => c.id === clase.curso_id) || {};
        const periodo = periodos.find(p => p.id === clase.periodo_id) || {};

        const valorNota = (nota.valor_numerico ?? nota.valor_literal) ?? 'N/A';

        // Fecha
        const fecha = getFormattedNotaDate(nota);

        // Docente
        let docenteRaw = nota.docente_nombre ?? (nota.docente && (nota.docente.nombres || nota.docente.nombre)) ?? nota.docente ?? clase.docente_nombre ?? clase.docente_id ?? nota.docente_id;
        let docenteDisplay = 'N/A';
        if (docenteRaw) {
            if (typeof docenteRaw === 'object') {
                const ap = docenteRaw.apellidos || docenteRaw.last_name || '';
                const no = docenteRaw.nombres || docenteRaw.first_name || docenteRaw.nombre || '';
                docenteDisplay = `${ap ? ap + ', ' : ''}${no}`.trim() || String(docenteRaw.id || 'N/A');
            } else if (typeof docenteRaw === 'string') {
                docenteDisplay = (docenteRaw.indexOf(' ') === -1 && docenteRaw.length > 12) ? `${docenteRaw.substring(0, 12)}...` : docenteRaw;
            } else {
                docenteDisplay = String(docenteRaw);
            }
        }

        // Color según nota
        let badgeClass = 'bg-secondary';
        const numericVal = Number(nota.valor_numerico ?? nota.valor_literal);
        if (!Number.isNaN(numericVal)) {
            if (numericVal >= 14) badgeClass = 'bg-success';
            else if (numericVal >= 11) badgeClass = 'bg-warning';
            else badgeClass = 'bg-danger';
        }

        return `
            <tr>
                <td><strong>${escapeHtml(curso.nombre || 'N/A')}</strong></td>
                <td><small>${escapeHtml(periodo.nombre || 'N/A')}</small></td>
                <td><span class="badge bg-info">${escapeHtml(String(nota.tipo_evaluacion_id ?? nota.tipo_evaluacion ?? 'N/A')).substring(0, 30)}</span></td>
                <td><span class="badge ${badgeClass} fs-6">${escapeHtml(String(valorNota))}</span></td>
                <td><small>${escapeHtml(fecha)}</small></td>
                <td><small>${escapeHtml(docenteDisplay)}</small></td>
            </tr>
        `;
    }).join('');

    renderNotasPagination();

    document.getElementById('statsCards').style.display = 'flex';
}

/**
 * Actualiza las estadísticas
 */
function updateStats() {
    if (notas.length === 0) return;

    // Total de notas
    document.getElementById('statTotalNotas').textContent = notas.length;

    // Promedio
    const notasNumericas = notas.filter(n => n.valor_numerico).map(n => n.valor_numerico);
    const promedio = notasNumericas.length > 0
        ? (notasNumericas.reduce((a, b) => a + b, 0) / notasNumericas.length).toFixed(2)
        : '0.00';
    document.getElementById('statPromedio').textContent = promedio;

    // Mejor nota
    const mejorNota = notasNumericas.length > 0
        ? Math.max(...notasNumericas).toFixed(2)
        : '0.00';
    document.getElementById('statMejorNota').textContent = mejorNota;

    // Cursos únicos
    const cursosUnicos = new Set();
    notas.forEach(nota => {
        const matricula = matriculas.find(m => m.id === nota.matricula_clase_id);
        const clase = clases.find(c => c.id === matricula?.clase_id);
        if (clase?.curso_id) cursosUnicos.add(clase.curso_id);
    });
    document.getElementById('statCursos').textContent = cursosUnicos.size;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Cambio de hijo
    document.getElementById('selectHijo').addEventListener('change', () => {
        const hijoId = document.getElementById('selectHijo').value;
        if (hijoId) {
            // Cargar notas (que obtiene matrículas) y luego poblar cursos desde las matrículas
            loadNotas();
        } else {
            // limpiar tabla si se deselecciona
            notas = [];
            matriculas = [];
            displayNotas();
        }
    });

    // Cambio de filtros
    document.getElementById('selectPeriodo').addEventListener('change', loadNotas);
    document.getElementById('selectCurso').addEventListener('change', loadNotas);

    // Sidebar collapse
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function () {
            document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
        });
    }
}

/**
 * Render simple pagination controls for notas (Prev / info / Next)
 */
function renderNotasPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const page = notasPagination.page;
    const total = notasPagination.totalPages;
    const totalItems = notasPagination.totalItems;

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mt-3">
            <div>
                <button id="pagPrev" class="btn btn-sm btn-outline-primary" ${page <= 1 ? 'disabled' : ''}>Prev</button>
            </div>
            <div class="text-muted">Página ${page} de ${total} — ${totalItems} items</div>
            <div>
                <button id="pagNext" class="btn btn-sm btn-outline-primary" ${page >= total ? 'disabled' : ''}>Next</button>
            </div>
        </div>
    `;

    const prevBtn = document.getElementById('pagPrev');
    const nextBtn = document.getElementById('pagNext');

    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (notasPagination.page > 1) {
            notasPagination.page -= 1;
            displayNotas();
        }
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (notasPagination.page < notasPagination.totalPages) {
            notasPagination.page += 1;
            displayNotas();
        }
    });
}

/**
 * Carga los cursos disponibles para el hijo seleccionado
 */
async function loadCursosDisponibles(hijoId) {
    const selectCurso = document.getElementById('selectCurso');
    selectCurso.innerHTML = '<option value="">Todos los cursos</option>';

    // Obtener clases donde está matriculado el hijo
    const matriculasHijo = matriculas.filter(m => m.alumno_id === hijoId);
    const clasesIds = matriculasHijo.map(m => m.clase_id);
    const cursosIds = new Set();

    clasesIds.forEach(claseId => {
        const clase = clases.find(c => c.id === claseId);
        if (clase?.curso_id) cursosIds.add(clase.curso_id);
    });

    const cursosDisponibles = Array.isArray(cursos) ? cursos.filter(c => cursosIds.has(c.id)) : [];
    cursosDisponibles.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso.id;
        option.textContent = curso.nombre;
        selectCurso.appendChild(option);
    });
}

/**
 * Intenta obtener y formatear una fecha válida desde distintos campos posibles de una nota
 * Devuelve una cadena formateada o 'N/A' si no hay fecha válida
 */
function getFormattedNotaDate(nota) {
    const candidates = [
        nota?.fecha_evaluacion,
        nota?.fecha,
        nota?.fecha_evaluacion_iso,
        nota?.date,
        nota?.created_at,
        nota?.updated_at,
        nota?.fecha_registro,
        nota?.fecha_ts,
        nota?.fecha_timestamp,
        nota?.fecha_evaluacion_timestamp,
        nota?.meta && (nota.meta.fecha || nota.meta.fecha_evaluacion)
    ];

    for (let raw of candidates) {
        if (raw === null || typeof raw === 'undefined') continue;

        // Strings: ignorar valores vacíos o 'null' o 0000-00-00
        if (typeof raw === 'string') {
            const s = raw.trim();
            if (!s || s.toLowerCase() === 'null' || s === '0000-00-00' || s === '0000-00-00 00:00:00') continue;

            // Si es entero en string (timestamp en segundos o ms)
            if (/^\d+$/.test(s)) {
                let num = Number(s);
                if (num < 1e12) num = num * 1000; // segundos -> ms
                const d = new Date(num);
                if (!isNaN(d.getTime())) return formatDateShort(d);
                continue;
            }

            // Intentar parsear ISO u otros formatos
            const parsed = new Date(s);
            if (!isNaN(parsed.getTime())) return formatDateShort(parsed);
            continue;
        }

        // Números: timestamp (segundos o ms)
        if (typeof raw === 'number') {
            let num = raw;
            if (num < 1e12) num = num * 1000;
            const d = new Date(num);
            if (!isNaN(d.getTime())) return formatDateShort(d);
            continue;
        }

        // Objetos Date
        if (raw instanceof Date) {
            if (!isNaN(raw.getTime())) return formatDateShort(raw);
        }
    }

    return 'N/A';
}

/**
 * Actualiza información del usuario
 */
function updateUserInfo() {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userInitialsEl = document.getElementById('userInitials');

    if (userNameEl) userNameEl.textContent = currentUser.username;
    if (userRoleEl) {
        userRoleEl.textContent = 'PADRE';
        userRoleEl.className = 'badge bg-warning';
    }
    if (userInitialsEl) userInitialsEl.textContent = getInitials(currentUser.username);
}

/**
 * Carga el menú del sidebar
 */
function loadSidebarMenu() {
    const menuItems = [
        { page: 'dashboard.html', label: 'Dashboard', icon: 'grid-fill', active: false },
        { page: 'notas-hijos.html', label: 'Notas de mis Hijos', icon: 'card-checklist', active: true }
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
