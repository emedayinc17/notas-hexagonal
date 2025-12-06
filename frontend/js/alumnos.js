// ============================================
// GESTIÓN DE ALUMNOS
// ============================================

let alumnos = [];
let grados = [];
let currentPage = 1;
let itemsPerPage = 10; // Se actualizará al cargar la configuración (valor por defecto 10)
let totalItems = 0;

document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticación y rol ADMIN
    if (!requireAuth()) return;
    if (!requireRole('ADMIN')) {
        showToast('Acceso denegado', 'Solo administradores pueden acceder a esta sección', 'error');
        window.location.href = '/pages/dashboard.html';
        return;
    }

    // Cargar configuración
    if (typeof AppSettings !== 'undefined') {
        itemsPerPage = AppSettings.getSetting('pagination.itemsPerPage', 10);
    }

    // Cargar datos del usuario en navbar
    loadUserInfo();

    // Cargar menú del sidebar
    loadSidebarMenu();

    // Cargar datos iniciales
    initializeData();

    // Event listeners
    document.getElementById('formAlumno').addEventListener('submit', handleSubmitAlumno);
    document.getElementById('searchInput').addEventListener('input', debounce(loadAlumnos, 500));
    document.getElementById('filterGenero').addEventListener('change', loadAlumnos);
    document.getElementById('filterGrado').addEventListener('change', loadAlumnos);
    document.getElementById('filterEstado').addEventListener('change', loadAlumnos);
    document.getElementById('sidebarCollapse').addEventListener('click', toggleSidebar);

    // Validaciones
    document.getElementById('alumnoDni').addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
    });

    document.getElementById('alumnoCelular').addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
    });

    // Reset form when modal closes
    document.getElementById('modalAlumno').addEventListener('hidden.bs.modal', function () {
        document.getElementById('formAlumno').reset();
        document.getElementById('alumnoId').value = '';
        document.getElementById('modalAlumnoTitle').textContent = 'Nuevo Alumno';
    });

    // Auto-generar código cuando se abre el modal para crear nuevo alumno
    document.getElementById('modalAlumno').addEventListener('show.bs.modal', async function () {
        const alumnoId = document.getElementById('alumnoId').value;

        // Solo autogenerar si es un nuevo alumno (no edición)
        if (!alumnoId) {
            await generarCodigoAlumno(true); // true = silent mode
        }
    });
});

/**
 * Inicializa los datos necesarios
 */
async function initializeData() {
    await loadGrados();
    await loadAlumnos();
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
        { page: 'alumnos.html', label: 'Alumnos', icon: 'people-fill', active: true },
        { page: 'matriculas.html', label: 'Matrículas', icon: 'journal-check' },
        { page: 'usuarios.html', label: 'Usuarios', icon: 'person-gear' }
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
 * Carga los grados desde el API
 */
async function loadGrados() {
    try {
        const result = await AcademicoService.listGrados(0, 100);

        if (result.success) {
            grados = (result.data.grados || result.data).filter(g => g.status === 'ACTIVO');

            const filterGrado = document.getElementById('filterGrado');
            filterGrado.innerHTML = '<option value="">Todos los grados</option>';

            grados.forEach(grado => {
                filterGrado.innerHTML += `<option value="${grado.id}">${grado.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading grados:', error);
    }
}

/**
 * Carga los alumnos desde el API con paginación
 */
async function loadAlumnos(page = 1) {
    // Validar que page sea un número válido
    if (!page || isNaN(page) || page < 1) {
        page = 1;
    }
    currentPage = page;
    const searchTerm = document.getElementById('searchInput').value;
    const genero = document.getElementById('filterGenero').value;
    const gradoId = document.getElementById('filterGrado').value;
    const estado = document.getElementById('filterEstado').value;

    const tbody = document.getElementById('alumnosTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const offset = (currentPage - 1) * itemsPerPage;
        const result = await PersonasService.listAlumnos(offset, itemsPerPage, searchTerm);

        if (result.success) {
            alumnos = result.data.alumnos || result.data;
            totalItems = result.data.total || alumnos.length;

            // Aplicar filtros del lado del cliente (temporal, solo para lo que no cubre el backend)
            let filteredAlumnos = alumnos.filter(a => {
                let match = true;

                // Search ya se maneja en backend

                if (genero) {
                    match = match && a.genero === genero;
                }

                if (estado) {
                    match = match && a.status === estado;
                }
                
                // Nota: El filtro de grado requiere lógica compleja (buscar matrículas), 
                // por ahora se mantiene en cliente solo para los cargados.
                
                return match;
            });

            // Ordenar por apellidos
            filteredAlumnos.sort((a, b) => {
                const apellidoA = a.apellidos || '';
                const apellidoB = b.apellidos || '';
                const apellidoCompare = apellidoA.localeCompare(apellidoB);
                if (apellidoCompare !== 0) return apellidoCompare;
                const nombreA = a.nombres || '';
                const nombreB = b.nombres || '';
                return nombreA.localeCompare(nombreB);
            });

            displayAlumnos(filteredAlumnos);
            renderPagination();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading alumnos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar alumnos: ${error.message}
                </td>
            </tr>
        `;
        showToast('Error', 'No se pudieron cargar los alumnos', 'error');
    }
}

/**
 * Muestra los alumnos en la tabla
 */
function displayAlumnos(alumnosToDisplay) {
    const tbody = document.getElementById('alumnosTableBody');

    if (alumnosToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>
                    No se encontraron alumnos
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = alumnosToDisplay.map(alumno => {
        const fullName = `${alumno.apellidos}, ${alumno.nombres}`;
        const fechaNac = formatDate(alumno.fecha_nacimiento);
        const edad = calcularEdad(alumno.fecha_nacimiento);

        return `
            <tr>
                <td><span class="badge bg-dark">${alumno.codigo_alumno || 'Sin código'}</span></td>
                <td class="fw-bold">${fullName}</td>
                <td>${alumno.dni || '<span class="text-muted">-</span>'}</td>
                <td>
                    ${fechaNac}
                    <br><small class="text-muted">${edad} años</small>
                </td>
                <td>
                    ${alumno.genero === 'M'
                ? '<span class="badge bg-info">M</span>'
                : '<span class="badge bg-danger">F</span>'}
                </td>
                <td>
                    ${alumno.email ? `<small>${alumno.email}</small>` : '<span class="text-muted">-</span>'}
                </td>
                <td>
                    <span class="badge ${alumno.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                        ${alumno.status || 'ACTIVO'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editAlumno('${alumno.id}')" 
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="verFamiliares('${alumno.id}')" 
                            title="Familiares">
                        <i class="bi bi-people"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAlumno('${alumno.id}')"
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return '-';

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }

    return edad;
}

/**
 * Maneja el submit del formulario de alumno
 */
async function handleSubmitAlumno(e) {
    e.preventDefault();

    const alumnoId = document.getElementById('alumnoId').value;
    // Separar apellidos (Heurística simple: primer espacio separa paterno de materno)
    const apellidosInput = document.getElementById('alumnoApellidos').value.trim();
    const primerEspacio = apellidosInput.indexOf(' ');
    let apellido_paterno = apellidosInput;
    let apellido_materno = '';

    if (primerEspacio > 0) {
        apellido_paterno = apellidosInput.substring(0, primerEspacio);
        apellido_materno = apellidosInput.substring(primerEspacio + 1);
    }

    const alumnoData = {
        codigo_alumno: document.getElementById('alumnoCodigo').value.trim().toUpperCase(),
        dni: document.getElementById('alumnoDni').value.trim(),
        nombres: document.getElementById('alumnoNombres').value.trim(),
        apellido_paterno: apellido_paterno,
        apellido_materno: apellido_materno || null,
        fecha_nacimiento: document.getElementById('alumnoFechaNacimiento').value,
        genero: document.getElementById('alumnoGenero').value,
        telefono: document.getElementById('alumnoCelular').value.trim() || null,
        email: document.getElementById('alumnoEmail').value.trim() || null,
        direccion: document.getElementById('alumnoDireccion').value.trim() || null
    };

    // Validaciones
    if (!alumnoData.codigo_alumno || !alumnoData.dni || !alumnoData.nombres || !alumnoData.apellido_paterno ||
        !alumnoData.fecha_nacimiento || !alumnoData.genero) {
        showToast('Error', 'Por favor completa todos los campos requeridos', 'error');
        return;
    }

    // Validar DNI
    if (alumnoData.dni.length !== 8) {
        showToast('Error', 'El DNI debe tener 8 dígitos', 'error');
        return;
    }

    // Validar telefono si existe
    if (alumnoData.telefono && alumnoData.telefono.length !== 9) {
        showToast('Error', 'El celular debe tener 9 dígitos', 'error');
        return;
    }

    try {
        const result = alumnoId
            ? await PersonasService.updateAlumno(alumnoId, alumnoData)
            : await PersonasService.createAlumno(alumnoData);

        if (result.success) {
            showToast('Éxito', alumnoId ? 'Alumno actualizado correctamente' : 'Alumno creado correctamente', 'success');

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalAlumno'));
            modal.hide();

            // Recargar tabla
            await loadAlumnos();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving alumno:', error);
        showToast('Error', error.message || 'Error al guardar el alumno', 'error');
    }
}

/**
 * Editar alumno
 */
function editAlumno(id) {
    const alumno = alumnos.find(a => a.id === id);
    if (!alumno) {
        showToast('Error', 'Alumno no encontrado', 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('alumnoId').value = alumno.id;
    document.getElementById('alumnoCodigo').value = alumno.codigo_alumno || '';
    document.getElementById('alumnoDni').value = alumno.dni || '';
    document.getElementById('alumnoNombres').value = alumno.nombres;
    document.getElementById('alumnoApellidos').value = alumno.apellidos;
    document.getElementById('alumnoFechaNacimiento').value = alumno.fecha_nacimiento;
    document.getElementById('alumnoGenero').value = alumno.genero;
    document.getElementById('alumnoCelular').value = alumno.celular || '';
    document.getElementById('alumnoEmail').value = alumno.email || '';
    document.getElementById('alumnoDireccion').value = alumno.direccion || '';

    // Cambiar título del modal
    document.getElementById('modalAlumnoTitle').textContent = 'Editar Alumno';

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalAlumno'));
    modal.show();
}

/**
 * Eliminar alumno
 */
async function deleteAlumno(id) {
    const alumno = alumnos.find(a => a.id === id);
    if (!alumno) return;

    const confirmDelete = await showConfirm(
        '¿Eliminar alumno?',
        `¿Estás seguro de eliminar al alumno "${alumno.apellidos}, ${alumno.nombres}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
        const result = await PersonasService.deleteAlumno(id);

        if (result.success) {
            showToast('Éxito', 'Alumno eliminado correctamente', 'success');
            await loadAlumnos();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting alumno:', error);
        showToast('Error', error.message || 'Error al eliminar el alumno', 'error');
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
}

/**
 * Renderiza la paginación (Estilo Matrículas)
 */
function renderPagination() {
    try {
        let container = document.getElementById('pagination');
        const table = document.getElementById('alumnosTableBody');

        if (!container) {
            container = document.createElement('div');
            container.id = 'pagination';
            container.className = 'd-flex justify-content-between align-items-center mt-3';
            const tableElem = table.closest('table') || table.parentElement;
            tableElem.parentNode.insertBefore(container, tableElem.nextSibling);
        } else {
            // Asegurar clases consistentes con matriculas
            container.className = 'd-flex justify-content-between align-items-center mt-3';
        }

        // Calcular páginas
        const total = Number(totalItems) || 0;
        const pageSize = Number(itemsPerPage);
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        // Limitar currentPage
        if (currentPage > totalPages) currentPage = totalPages;

        container.innerHTML = '';

        // Lado izquierdo: Botones y Texto
        const left = document.createElement('div');
        left.className = 'pagination-left';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-sm btn-outline-primary me-2';
        prevBtn.textContent = '« Prev';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; loadAlumnos(currentPage); } };

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-sm btn-outline-primary ms-2';
        nextBtn.textContent = 'Next »';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; loadAlumnos(currentPage); } };

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
            loadAlumnos(1);
        };

        right.appendChild(label);
        right.appendChild(select);

        container.appendChild(left);
        container.appendChild(right);
    } catch (err) {
        console.warn('No se pudo renderizar paginación:', err);
    }
}

// ============================================
// GESTIÓN DE FAMILIARES
// ============================================

/**
 * Abre el modal de familiares
 */
async function verFamiliares(alumnoId) {
    const alumno = alumnos.find(a => a.id === alumnoId);
    if (!alumno) return;

    const familiaresAlumnoIdEl = document.getElementById('familiaresAlumnoId');
    const formAgregarFamiliar = document.getElementById('formAgregarFamiliar');
    const padreEncontradoInfo = document.getElementById('padreEncontradoInfo');
    const btnAgregarRelacion = document.getElementById('btnAgregarRelacion');
    const padreEncontradoId = document.getElementById('padreEncontradoId');
    const padreNoEncontrado = document.getElementById('padreNoEncontradoInfo');

    if (familiaresAlumnoIdEl) familiaresAlumnoIdEl.value = alumnoId;
    if (formAgregarFamiliar) formAgregarFamiliar.reset();
    if (padreEncontradoInfo) padreEncontradoInfo.classList.add('d-none');
    if (btnAgregarRelacion) btnAgregarRelacion.disabled = true;
    if (padreEncontradoId) padreEncontradoId.value = '';
    if (padreNoEncontrado) padreNoEncontrado.classList.add('d-none');

    const modal = new bootstrap.Modal(document.getElementById('modalFamiliares'));
    modal.show();

    await loadFamiliares(alumnoId);
}

/**
 * Carga los familiares del alumno
 */
let currentFamiliares = []; // Variable para almacenar familiares actuales

async function loadFamiliares(alumnoId) {
    const tbody = document.getElementById('familiaresTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';

    try {
        const result = await PersonasService.getPadresDeAlumno(alumnoId);

        if (result.success) {
            const relaciones = result.data.relaciones || result.data || [];
            currentFamiliares = relaciones; // Guardar para filtrar búsqueda

            if (relaciones.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted py-3">
                            <i class="bi bi-people me-2"></i>No hay familiares asignados
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = relaciones.map(rel => `
                <tr>
                    <td>${rel.padre.apellidos}, ${rel.padre.nombres}</td>
                    <td>${rel.padre.dni}</td>
                    <td><span class="badge bg-info">${rel.tipo_relacion}</span></td>
                    <td>${rel.es_contacto_principal ? '<i class="bi bi-check-circle-fill text-success"></i>' : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteRelacion('${rel.id}')" title="Eliminar relación">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading familiares:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Error al cargar familiares
                </td>
            </tr>
        `;
    }
}

/**
 * Busca un padre por DNI
 */
async function buscarPadre() {
    const dni = document.getElementById('buscarPadreDni').value.trim();
    if (!dni || dni.length !== 8) {
        showToast('Error', 'Ingrese un DNI válido de 8 dígitos', 'warning');
        return;
    }

    const btnBuscar = document.getElementById('btnBuscarPadre');
    const originalContent = btnBuscar.innerHTML;
    btnBuscar.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    btnBuscar.disabled = true;

    try {
        const result = await PersonasService.listPadres(0, 100);

        if (result.success) {
            const padres = result.data.padres || result.data || [];
            const padre = padres.find(p => p.dni === dni);

            if (padre) {
                // Verificar si el padre ya está vinculado
                const padresIds = currentFamiliares.map(f => f.padre_id || f.padre?.id);
                if (padresIds.includes(padre.id)) {
                    showToast('Información', 'Este padre ya está vinculado a este alumno', 'warning');
                    document.getElementById('padreEncontradoInfo').classList.add('d-none');
                    document.getElementById('btnAgregarRelacion').disabled = true;
                    return;
                }

                document.getElementById('padreEncontradoId').value = padre.id;
                document.getElementById('nombrePadreEncontrado').textContent = `${padre.apellidos}, ${padre.nombres}`;
                document.getElementById('padreEncontradoInfo').classList.remove('d-none');
                document.getElementById('btnAgregarRelacion').disabled = false;
                showToast('Éxito', 'Padre encontrado', 'success');
            } else {
                // Mostrar opción para registrar nuevo padre
                document.getElementById('padreEncontradoInfo').classList.add('d-none');
                document.getElementById('btnAgregarRelacion').disabled = true;

                const padreNoEncontrado = document.getElementById('padreNoEncontradoInfo');
                const dniPadreNuevo = document.getElementById('dniPadreNuevo');

                if (padreNoEncontrado && dniPadreNuevo) {
                    padreNoEncontrado.classList.remove('d-none');
                    dniPadreNuevo.value = dni;
                }

                showToast('Info', 'No se encontró ningún padre con ese DNI. Puede registrarlo ahora.', 'info');
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
 * Agrega una relación padre-alumno
 */
async function agregarRelacion(e) {
    e.preventDefault();

    const alumnoId = document.getElementById('familiaresAlumnoId').value;
    const padreId = document.getElementById('padreEncontradoId').value;
    const tipoRelacion = document.getElementById('nuevaRelacion').value;
    const esPrincipal = document.getElementById('esPrincipal').checked;

    if (!alumnoId || !padreId) return;

    try {
        const relacionData = {
            alumno_id: alumnoId,
            padre_id: padreId,
            tipo_relacion: tipoRelacion,
            es_contacto_principal: esPrincipal
        };

        const result = await PersonasService.createRelacion(relacionData);

        if (result.success) {
            showToast('Éxito', 'Relación agregada correctamente', 'success');
            document.getElementById('formAgregarFamiliar').reset();
            document.getElementById('padreEncontradoInfo').classList.add('d-none');
            document.getElementById('btnAgregarRelacion').disabled = true;
            await loadFamiliares(alumnoId);
        } else {
            // Manejar errores específicos
            if (result.error && result.error.includes('RELATION_ALREADY_EXISTS')) {
                showToast('Información', 'Este padre ya está vinculado a este alumno', 'warning');
            } else if (result.error && (result.error.includes('TIPO_RELACION_DUPLICADA') || result.error.includes('ya tiene un'))) {
                showToast('Advertencia', `El alumno ya tiene un ${tipoRelacion.toLowerCase()} asignado`, 'warning');
            } else {
                throw new Error(result.error || 'Error al crear relación');
            }
        }
    } catch (error) {
        console.error('Error adding relacion:', error);
        const message = error.message || 'Error al agregar relación';
        showToast('Error', message, 'error');
    }
}

/**
 * Elimina una relación
 */
async function deleteRelacion(relacionId) {
    if (!confirm('¿Está seguro de eliminar esta relación familiar?')) return;

    try {
        const result = await PersonasService.unlinkPadreAlumno(relacionId);

        if (result.success) {
            showToast('Éxito', 'Relación eliminada', 'success');
            const alumnoId = document.getElementById('familiaresAlumnoId').value;
            await loadFamiliares(alumnoId);
        } else {
            throw new Error(result.error || 'Error al eliminar relación');
        }
    } catch (error) {
        console.error('Error deleting relacion:', error);
        showToast('Error', 'No se pudo eliminar la relación', 'error');
    }
}

/**
 * Registrar nuevo padre desde el modal de familiares
 */
async function registrarNuevoPadre(e) {
    e.preventDefault();

    const padreData = {
        nombres: document.getElementById('nombresPadreNuevo').value.trim(),
        apellido_paterno: document.getElementById('apellidoPaternoPadreNuevo').value.trim(),
        apellido_materno: document.getElementById('apellidoMaternoPadreNuevo').value.trim() || null,
        dni: document.getElementById('dniPadreNuevo').value.trim(),
        email: document.getElementById('emailPadreNuevo').value.trim(),
        celular: document.getElementById('celularPadreNuevo').value.trim() || null
    };

    // Validaciones
    if (!padreData.nombres || !padreData.apellido_paterno || !padreData.dni || !padreData.email) {
        showToast('Error', 'Complete todos los campos requeridos', 'error');
        return;
    }

    if (padreData.dni.length !== 8) {
        showToast('Error', 'El DNI debe tener 8 dígitos', 'error');
        return;
    }

    try {
        const result = await PersonasService.createPadre(padreData);

        if (result.success) {
            showToast('Éxito', 'Padre registrado correctamente', 'success');

            // Ocultar formulario de registro
            document.getElementById('padreNoEncontradoInfo').classList.add('d-none');
            document.getElementById('formRegistrarPadre').reset();

            // Mostrar padre encontrado
            document.getElementById('padreEncontradoId').value = result.data.id;
            document.getElementById('nombrePadreEncontrado').textContent = `${padreData.apellido_paterno} ${padreData.apellido_materno || ''}, ${padreData.nombres}`.trim();
            document.getElementById('padreEncontradoInfo').classList.remove('d-none');
            document.getElementById('btnAgregarRelacion').disabled = false;
        } else {
            throw new Error(result.error || 'Error al registrar padre');
        }
    } catch (error) {
        console.error('Error registering padre:', error);
        showToast('Error', error.message || 'Error al registrar padre', 'error');
    }
}

/**
 * Cancelar registro de nuevo padre
 */
function cancelarRegistroPadre() {
    const padreNoEncontrado = document.getElementById('padreNoEncontradoInfo');
    const formRegistrar = document.getElementById('formRegistrarPadre');

    if (padreNoEncontrado) {
        padreNoEncontrado.classList.add('d-none');
    }
    if (formRegistrar) {
        formRegistrar.reset();
    }
}

// Event Listeners adicionales
document.addEventListener('DOMContentLoaded', function () {
    const btnBuscarPadre = document.getElementById('btnBuscarPadre');
    if (btnBuscarPadre) {
        btnBuscarPadre.addEventListener('click', buscarPadre);
    }

    const formAgregarFamiliar = document.getElementById('formAgregarFamiliar');
    if (formAgregarFamiliar) {
        formAgregarFamiliar.addEventListener('submit', agregarRelacion);
    }

    const formRegistrarPadre = document.getElementById('formRegistrarPadre');
    if (formRegistrarPadre) {
        formRegistrarPadre.addEventListener('submit', registrarNuevoPadre);
    }
});

/**
 * Genera automáticamente el siguiente código de alumno disponible
 * @param {boolean} silent - Si es true, no muestra el toast de éxito
 */
async function generarCodigoAlumno(silent = false) {
    const codigoInput = document.getElementById('alumnoCodigo');

    if (!codigoInput) return;

    try {
        const result = await PersonasService.getNextCodigoAlumno();

        if (result.success && result.data.codigo) {
            codigoInput.value = result.data.codigo;
            if (!silent) {
                showToast('Éxito', `Código generado: ${result.data.codigo}`, 'success');
            }
        } else {
            throw new Error(result.error || 'Error al generar código');
        }
    } catch (error) {
        console.error('Error generating codigo:', error);
        if (!silent) {
            showToast('Error', 'No se pudo generar el código automáticamente', 'error');
        }
    }
}

/**
 * Registrar nuevo padre desde el modal de familiares
 */
async function registrarNuevoPadre(e) {
    e.preventDefault();

    const padreData = {
        nombres: document.getElementById('nombresPadreNuevo').value.trim(),
        apellido_paterno: document.getElementById('apellidoPaternoPadreNuevo').value.trim(),
        apellido_materno: document.getElementById('apellidoMaternoPadreNuevo').value.trim() || null,
        dni: document.getElementById('dniPadreNuevo').value.trim(),
        email: document.getElementById('emailPadreNuevo').value.trim(),
        celular: document.getElementById('celularPadreNuevo').value.trim() || null
    };

    // Validaciones
    if (!padreData.nombres || !padreData.apellido_paterno || !padreData.dni || !padreData.email) {
        showToast('Error', 'Complete todos los campos requeridos', 'error');
        return;
    }

    if (padreData.dni.length !== 8) {
        showToast('Error', 'El DNI debe tener 8 dígitos', 'error');
        return;
    }

    try {
        const result = await PersonasService.createPadre(padreData);

        if (result.success) {
            showToast('Éxito', 'Padre registrado correctamente', 'success');

            // Ocultar formulario de registro
            document.getElementById('padreNoEncontradoInfo').classList.add('d-none');
            document.getElementById('formRegistrarPadre').reset();

            // Mostrar padre encontrado
            document.getElementById('padreEncontradoId').value = result.data.id;
            document.getElementById('nombrePadreEncontrado').textContent = `${padreData.apellido_paterno} ${padreData.apellido_materno || ''}, ${padreData.nombres}`.trim();
            document.getElementById('padreEncontradoInfo').classList.remove('d-none');
            document.getElementById('btnAgregarRelacion').disabled = false;
        } else {
            throw new Error(result.error || 'Error al registrar padre');
        }
    } catch (error) {
        console.error('Error registering padre:', error);
        showToast('Error', error.message || 'Error al registrar padre', 'error');
    }
}

/**
 * Cancelar registro de nuevo padre
 */
function cancelarRegistroPadre() {
    const padreNoEncontrado = document.getElementById('padreNoEncontradoInfo');
    const formRegistrar = document.getElementById('formRegistrarPadre');

    if (padreNoEncontrado) {
        padreNoEncontrado.classList.add('d-none');
    }
    if (formRegistrar) {
        formRegistrar.reset();
    }
}
