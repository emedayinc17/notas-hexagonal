// ============================================
// GESTIÓN DE PERIODOS
// ============================================

let periodos = [];
let filteredPeriodos = [];
let tiposPeriodo = [];
let currentPage = 1;
let itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function () {
    try {
        if (!requireAuth()) return;
        // requireRole expects an array of allowed roles
        if (!requireRole(['ADMIN'])) {
            showToast('Acceso denegado', 'Solo administradores pueden acceder a esta sección', 'error');
            window.location.href = '/pages/dashboard.html';
            return;
        }

        // Cargar configuración
        if (typeof AppSettings !== 'undefined') {
            itemsPerPage = AppSettings.getSetting('pagination.itemsPerPage', 10);
        }

        loadUserInfo();
        loadSidebarMenu();

        // Event listeners
        document.getElementById('formPeriodo').addEventListener('submit', handleSubmitPeriodo);
        document.getElementById('searchInput').addEventListener('input', debounce(() => { currentPage = 1; applyFilters(); }, 300));
        document.getElementById('filterTipoPeriodo').addEventListener('change', () => { currentPage = 1; applyFilters(); });
        document.getElementById('filterAnio').addEventListener('change', () => { currentPage = 1; applyFilters(); });
        document.getElementById('filterEstado').addEventListener('change', () => { currentPage = 1; applyFilters(); });
        document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

        // Reset form when modal closes
        const modalEl = document.getElementById('modalPeriodo');
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', function () {
            document.getElementById('formPeriodo').reset();
            document.getElementById('periodoId').value = '';
            document.getElementById('modalPeriodoTitle').textContent = 'Nuevo Periodo';
            const divEstado = document.getElementById('divPeriodoEstado');
            if (divEstado) divEstado.classList.add('d-none');
            });

            // Cuando se muestra el modal (nuevo o editar) cargar tipos para el formulario
            modalEl.addEventListener('show.bs.modal', function (event) {
                // Cargar tipos; openEditPeriodo también llamará a loadTiposForForm antes de mostrar en edición
                loadTiposForForm().catch(e => console.warn('loadTiposForForm failed:', e));
            });
        }

        // Inicializar datos
        initializeData();
    } catch (err) {
        console.error('Error en DOMContentLoaded (periodos):', err);
        // Mostrar mensaje en la tabla en caso de error inesperado
        const tbody = document.getElementById('periodosTableBody');
        if (tbody) {
            tbody.innerHTML = `\n            <tr>\n                <td colspan="7" class="text-center py-4 text-danger">\n                    <i class="bi bi-exclamation-triangle me-2"></i>\n                    Error inesperado: ${err && err.message ? err.message : 'ver consola'}\n                </td>\n            </tr>\n        `;
        }
        showToast('Error', 'Error al inicializar la página de periodos', 'error');
    }
});

async function initializeData() {
    try {
        // Cargar listados principales
        await loadPeriodos();
    } catch (error) {
        console.error('Error initializing periodos:', error);
    }
}

/**
 * Cargar tipos de periodo y poblar solo el select del formulario (nuevo/editar)
 */
async function loadTiposForForm() {
    const select = document.getElementById('periodoTipo');
    if (!select) return;
    select.innerHTML = '<option value="">Cargando tipos...</option>';
    // If we already loaded tiposPeriodo earlier (from loadPeriodos inference or prior call), reuse it
    if (Array.isArray(tiposPeriodo) && tiposPeriodo.length > 0) {
        try { populateTipoPeriodoSelects(); } catch (e) { console.warn('populateTipoPeriodoSelects failed', e); }
        return;
    }

    try {
        const tiposRes = await AcademicoService.listTiposPeriodo(0, 200);
        if (tiposRes && tiposRes.success) {
            const list = normalizeTipos(tiposRes.data);
            tiposPeriodo = list; // mantener en memoria
            try { populateTipoPeriodoSelects(); } catch (e) { console.warn('populateTipoPeriodoSelects failed', e); }
            return;
        } else {
            console.warn('No se pudieron obtener los tipos de periodo para el formulario', tiposRes);
        }
    } catch (err) {
        console.warn('Error cargando tipos para el formulario (API):', err);
    }

    // Fallback: intentar inferir tipos desde el listado de periodos cargado en memoria
    try {
        const inferred = {};
        (periodos || []).forEach(p => {
            if (p.tipo && (p.tipo.nombre || p.tipo.name)) {
                inferred[p.tipo_id] = { id: p.tipo_id, nombre: p.tipo.nombre || p.tipo.name };
            } else if (p.tipo_nombre) {
                inferred[p.tipo_id] = { id: p.tipo_id, nombre: p.tipo_nombre };
            }
        });
        const inferredList = Object.values(inferred);
        if (inferredList.length > 0) {
            tiposPeriodo = normalizeTipos(inferredList);
            try { populateTipoPeriodoSelects(); } catch (e) { console.warn('populateTipoPeriodoSelects failed', e); }
            return;
        }
    } catch (ie) { console.warn('Error infiriendo tipos desde periodos para el formulario', ie); }

    // Último recurso: dejar opción vacía
    select.innerHTML = '<option value="">Seleccionar tipo...</option>';
}

function populateTipoPeriodoSelects() {
    const select = document.getElementById('periodoTipo');
    const filter = document.getElementById('filterTipoPeriodo');
    if (!select || !filter) return;
    // Build unique map of id -> {nombre, num_periodos}
    const list = Array.isArray(tiposPeriodo) ? tiposPeriodo : (typeof tiposPeriodo === 'object' && tiposPeriodo ? Object.values(tiposPeriodo) : []);
    const map = new Map();
    list.forEach(t => {
        const id = (t && (t.id || t._id || t.tipo_id)) ? String(t.id || t._id || t.tipo_id) : '';
        let nombre = (t && (t.nombre || t.name || t.descripcion)) ? String(t.nombre || t.name || t.descripcion).trim() : '';
        const num = t && (t.num_periodos || t.numPeriodos || t.cantidad) ? t.num_periodos || t.numPeriodos || t.cantidad : null;

        if (!id) return; // skip invalid id entries
        if (!nombre) nombre = 'Tipo desconocido';

        // Avoid entries where nombre looks like a periodo (heuristic: contains 'Bimestre' or 'Trimestre' followed by a year or roman numerals)
        const periodoPattern = /bimestre|trimestre|semestre|iv|iii|ii|i\s*bimestre|\d{4}/i;
        if (periodoPattern.test(nombre) && !t.num_periodos) {
            // still accept if num_periodos exists; otherwise this is likely a periodo name
            // proceed but do not overwrite existing map entry
            if (!map.has(id)) map.set(id, { nombre, num });
            return;
        }

        if (!map.has(id)) map.set(id, { nombre, num });
    });

    // Convert map to array and sort by nombre
    const options = Array.from(map.entries()).map(([id, v]) => ({ id, nombre: v.nombre, num: v.num }));
    options.sort((a, b) => a.nombre.localeCompare(b.nombre));

    select.innerHTML = '<option value="">Seleccionar tipo...</option>';
    filter.innerHTML = '<option value="">Todos los tipos</option>';
    options.forEach(o => {
        const label = `${o.nombre}${o.num ? ` (${o.num})` : ''}`;
        const opt = `<option value="${o.id}">${label}</option>`;
        select.innerHTML += opt;
        filter.innerHTML += opt;
    });
}

async function loadPeriodos() {
    const tbody = document.getElementById('periodosTableBody');
    if (!tbody) {
        console.warn('periodosTableBody no encontrado en el DOM');
        return;
    }
    tbody.innerHTML = `\n        <tr>\n            <td colspan="7" class="text-center py-4">\n                <div class="spinner-border text-primary" role="status">\n                    <span class="visually-hidden">Cargando...</span>\n                </div>\n            </td>\n        </tr>\n    `;

    try {
        const result = await AcademicoService.listPeriodos(0, 1000);
        console.debug('loadPeriodos -> AcademicoService.listPeriodos result:', result);
        if (!result.success) throw new Error(result.error || 'Error al listar periodos');

        periodos = result.data.periodos || result.data || [];

        // Si aún no tenemos los tipos en memoria, intentar cargarlos (necesita auth en backend)
        try {
            if (!tiposPeriodo || tiposPeriodo.length === 0) {
                const tiposRes = await AcademicoService.listTiposPeriodo(0, 200);
                if (tiposRes && tiposRes.success) {
                    console.debug('loadPeriodos -> listTiposPeriodo success, payload:', tiposRes.data);
                    tiposPeriodo = normalizeTipos(tiposRes.data);
                    // Actualizar selects con los tipos cargados
                    try { populateTipoPeriodoSelects(); } catch (e) { console.warn('populateTipoPeriodoSelects failed', e); }
                } else {
                    console.warn('No se pudieron cargar tipos para mostrar en la tabla:', tiposRes && tiposRes.error ? tiposRes.error : tiposRes);
                    // Intentar inferir nombres de tipo desde el propio listado de periodos (si el backend los incluye)
                    try {
                        const inferred = {};
                        (periodos || []).forEach(p => {
                            if (p.tipo && (p.tipo.nombre || p.tipo.name)) {
                                inferred[p.tipo_id] = { id: p.tipo_id, nombre: p.tipo.nombre || p.tipo.name };
                            } else if (p.tipo_nombre) {
                                inferred[p.tipo_id] = { id: p.tipo_id, nombre: p.tipo_nombre };
                            }
                        });
                        const inferredList = Object.values(inferred);
                        if (inferredList.length > 0) {
                            tiposPeriodo = normalizeTipos(inferredList);
                            try { populateTipoPeriodoSelects(); } catch (e) { console.warn('populateTipoPeriodoSelects failed', e); }
                        }
                    } catch (ie) { console.warn('Error infiriendo tipos desde periodos', ie); }
                }
            }
        } catch (e) {
            console.warn('Error al intentar cargar tipos para la tabla:', e);
        }

        // Llenar filtro de años
        populateAnioFilter();

        applyFilters();
    } catch (error) {
        console.error('Error loading periodos:', error);
        tbody.innerHTML = `\n            <tr>\n                <td colspan="7" class="text-center py-4 text-danger">\n                    <i class="bi bi-exclamation-triangle me-2"></i>\n                    Error al cargar periodos: ${error.message}\n                </td>\n            </tr>\n        `;
        showToast('Error', 'No se pudieron cargar los periodos', 'error');
    }
}

function populateAnioFilter() {
    const filter = document.getElementById('filterAnio');
    if (!filter) return;
    const years = Array.from(new Set(periodos.map(p => p.año_escolar))).sort();
    filter.innerHTML = '<option value="">Todos</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const tipoFilter = document.getElementById('filterTipoPeriodo')?.value || '';
    const anioFilter = document.getElementById('filterAnio')?.value || '';
    const estadoFilter = document.getElementById('filterEstado')?.value || '';

    // Filtrar
    filteredPeriodos = periodos.filter(p => {
        let ok = true;
        if (searchTerm) ok = ok && (p.nombre || '').toLowerCase().includes(searchTerm);
        if (tipoFilter) ok = ok && p.tipo_id === tipoFilter;
        if (anioFilter) ok = ok && String(p.año_escolar) === String(anioFilter);
        if (estadoFilter) ok = ok && p.status === estadoFilter;
        return ok;
    });

    // Ordenar por año y fecha inicio
    filteredPeriodos.sort((a, b) => {
        if (a.año_escolar !== b.año_escolar) return b.año_escolar - a.año_escolar;
        const dateA = new Date(a.fecha_inicio || 0);
        const dateB = new Date(b.fecha_inicio || 0);
        return dateB - dateA;
    });

    renderTable();
    renderPagination();
}

function renderTable() {
    const tbody = document.getElementById('periodosTableBody');
    if (!filteredPeriodos || filteredPeriodos.length === 0) {
        tbody.innerHTML = `\n            <tr>\n                <td colspan="7" class="text-center py-4 text-muted">\n                    <i class="bi bi-inbox me-2"></i>\n                    No se encontraron periodos\n                </td>\n            </tr>\n        `;
        return;
    }

    // Paginación
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredPeriodos.slice(start, end);

    tbody.innerHTML = pageData.map(p => {
        const tipoFromPeriodo = p.tipo_nombre || (p.tipo && (p.tipo.nombre || p.tipo.name));
        const tipoDisplay = tipoFromPeriodo ? tipoFromPeriodo : getTipoNombre(p.tipo_id);

        // Determinar si el periodo es el actual en base a las fechas
        let isActual = false;
        try {
            if (p.fecha_inicio && p.fecha_fin) {
                const now = new Date();
                const start = new Date(p.fecha_inicio);
                const end = new Date(p.fecha_fin);
                // incluir límites
                isActual = now >= start && now <= end;
            }
        } catch (err) {
            console.warn('Error parsing fechas para periodo', p.id, err);
        }

        const actualBadge = isActual ? '<span class="badge bg-success text-white ms-2">ACTUAL</span>' : '';

        return `
        <tr>
            <td>${tipoDisplay}</td>
            <td class="fw-bold">${p.nombre} ${actualBadge}</td>
            <td>${p.fecha_inicio || '<span class="text-muted">-</span>'}</td>
            <td>${p.fecha_fin || '<span class="text-muted">-</span>'}</td>
            <td>${calculateDuration(p.fecha_inicio, p.fecha_fin)}</td>
            <td><span class="badge ${p.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">${p.status || 'ACTIVO'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="openEditPeriodo('${p.id}')" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="confirmDeletePeriodo('${p.id}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

function renderPagination() {
    let container = document.getElementById('pagination');
    const table = document.getElementById('periodosTableBody');

    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination';
        container.className = 'd-flex justify-content-between align-items-center mt-3';
        const tableElem = table.closest('table') || table.parentElement;
        tableElem.parentNode.insertBefore(container, tableElem.nextSibling);
    }

    const total = filteredPeriodos.length;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    if (currentPage > totalPages) currentPage = totalPages;

    container.innerHTML = '';

    // Lado izquierdo: Botones y Texto
    const left = document.createElement('div');
    left.className = 'pagination-left';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-sm btn-outline-primary me-2';
    prevBtn.textContent = '« Prev';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); renderPagination(); } };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-sm btn-outline-primary ms-2';
    nextBtn.textContent = 'Next »';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTable(); renderPagination(); } };

    const pageInfo = document.createElement('span');
    pageInfo.className = 'mx-2 text-muted';
    pageInfo.textContent = `Página ${currentPage} de ${totalPages} • ${total} registros`;

    left.appendChild(prevBtn);
    left.appendChild(pageInfo);
    left.appendChild(nextBtn);

    // Lado derecho: Selector de tamaño
    const right = document.createElement('div');
    right.className = 'pagination-right d-flex align-items-center';

    const label = document.createElement('small');
    label.className = 'me-2 text-muted';
    label.textContent = 'Tamaño:';

    const select = document.createElement('select');
    select.className = 'form-select form-select-sm';
    select.style.width = 'auto';
    [10, 15, 20].forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = `${n}`;
        if (n === Number(itemsPerPage)) opt.selected = true;
        select.appendChild(opt);
    });
    select.onchange = function() {
        itemsPerPage = Number(this.value);
        currentPage = 1;
        renderTable();
        renderPagination();
    };

    right.appendChild(label);
    right.appendChild(select);

    container.appendChild(left);
    container.appendChild(right);
}

function getTipoNombre(tipoId) {
    const list = Array.isArray(tiposPeriodo) ? tiposPeriodo : (typeof tiposPeriodo === 'object' && tiposPeriodo ? Object.values(tiposPeriodo) : []);
    const t = list.find(x => String(x.id) === String(tipoId) || String(x._id) === String(tipoId));
    return t ? (t.nombre || t.name || '<span class="text-muted">-</span>') : '<span class="text-muted">-</span>';
}

function normalizeTipos(input) {
    if (!input) return [];
    let arr = [];
    if (Array.isArray(input)) arr = input;
    else if (Array.isArray(input.tipos)) arr = input.tipos;
    else if (Array.isArray(input.tipos_periodo)) arr = input.tipos_periodo;
    else if (input.tipos && typeof input.tipos === 'object') arr = Object.values(input.tipos);
    else if (input.tipos_periodo && typeof input.tipos_periodo === 'object') arr = Object.values(input.tipos_periodo);
    else if (typeof input === 'object') arr = Object.values(input);

    // Estandarizar cada elemento para tener `id` y `nombre` claros
    return arr.map(t => {
        const id = t.id || t._id || t.tipo_id || t.codigo || '';
        const nombre = t.nombre || t.name || t.descripcion || '';
        const num_periodos = t.num_periodos || t.numPeriodos || t.cantidad || null;
        return Object.assign({}, t, { id, nombre, num_periodos });
    });
}

function calculateDuration(start, end) {
    if (!start || !end) return '<span class="text-muted">-</span>';
    try {
        const s = new Date(start);
        const e = new Date(end);
        const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
        return `${diffDays} días`;
    } catch (err) {
        return '<span class="text-muted">-</span>';
    }
}

// Helpers expuestos para botones en la tabla
window.openEditPeriodo = async function (id) {
    const periodo = periodos.find(p => p.id === id);
    if (!periodo) return showToast('Error', 'Periodo no encontrado', 'error');

    // Cargar tipos primero para asegurar que el select exista y contenga la opción
    await loadTiposForForm();

    document.getElementById('periodoId').value = periodo.id;
    document.getElementById('periodoTipo').value = periodo.tipo_id;
    document.getElementById('periodoNombre').value = periodo.nombre;
    document.getElementById('periodoFechaInicio').value = periodo.fecha_inicio || '';
    document.getElementById('periodoFechaFin').value = periodo.fecha_fin || '';
    const divEstado = document.getElementById('divPeriodoEstado');
    if (divEstado) divEstado.classList.remove('d-none');
    const selectEstado = document.getElementById('periodoEstado');
    if (selectEstado) selectEstado.value = periodo.status || 'ACTIVO';
    document.getElementById('modalPeriodoTitle').textContent = 'Editar Periodo';
    const modal = new bootstrap.Modal(document.getElementById('modalPeriodo'));
    modal.show();
};

window.confirmDeletePeriodo = async function (id) {
    const periodo = periodos.find(p => p.id === id);
    if (!periodo) return;
    const confirmDelete = await showConfirm('¿Eliminar periodo?', `¿Eliminar el periodo "${periodo.nombre}"?`);
    if (!confirmDelete) return;

    try {
        const result = await AcademicoService.deletePeriodo(id);
        if (result.success) {
            showToast('Éxito', 'Periodo eliminado correctamente', 'success');
            await loadPeriodos();
        } else {
            showToast('Error', result.error || 'Error al eliminar periodo', 'error');
        }
    } catch (err) {
        console.error('Error deleting periodo:', err);
        showToast('Error', err.message || 'Error al eliminar periodo', 'error');
    }
};

async function handleSubmitPeriodo(e) {
    e.preventDefault();
    const periodoId = document.getElementById('periodoId').value;
    const data = {
        año_escolar: parseInt(document.getElementById('filterAnio').value) || null,
        tipo_id: document.getElementById('periodoTipo').value || null,
        nombre: document.getElementById('periodoNombre').value.trim(),
        fecha_inicio: document.getElementById('periodoFechaInicio').value || null,
        fecha_fin: document.getElementById('periodoFechaFin').value || null,
    };

    // Incluir status si el campo está visible (edición)
    const selectEstado = document.getElementById('periodoEstado');
    if (selectEstado && !selectEstado.classList.contains('d-none')) {
        data.status = selectEstado.value;
    }

    try {
        const result = periodoId ? await AcademicoService.updatePeriodo(periodoId, data) : await AcademicoService.createPeriodo(data);
        if (result.success) {
            showToast('Éxito', periodoId ? 'Periodo actualizado correctamente' : 'Periodo creado correctamente', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalPeriodo'));
            if (modal) modal.hide();
            await loadPeriodos();
        } else {
            // Si hay conflicto de dependencias (backend devuelve 409), mostrar mensaje claro
            if (result.error && result.error.includes('Conflict')) {
                showToast('Error', result.error, 'error');
            } else {
                throw new Error(result.error || 'Error al guardar periodo');
            }
        }
    } catch (err) {
        console.error('Error saving periodo:', err);
        showToast('Error', err.message || 'Error al guardar periodo', 'error');
    }
}

function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}
