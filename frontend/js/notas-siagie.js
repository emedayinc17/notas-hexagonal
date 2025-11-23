/**
 * FUNCIONES PARA EL SISTEMA DE CALIFICACIÓN ESTILO SIAGIE
 */

/**
 * Abre el modal para gestionar las notas de un alumno específico estilo SIAGIE
 */
async function abrirGestionNotas(alumnoId, apellidos, nombres) {
    try {
        showLoading('Cargando cursos matriculados...');
        
        // Mostrar información del alumno
        document.getElementById('alumnoInfo').innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <i class="bi bi-person-circle" style="font-size: 2.5rem; color: #0066cc;"></i>
                </div>
                <div>
                    <h5 class="mb-1"><strong>${apellidos}, ${nombres}</strong></h5>
                    <small class="text-muted">ID: ${alumnoId} • Sistema de Calificación Personalizada por Curso</small>
                </div>
            </div>
        `;
        
        // Obtener clases donde está matriculado el alumno y el docente actual enseña
        const alumnoData = alumnosAsignados.filter(a => a.id === alumnoId);
        
        if (alumnoData.length === 0) {
            throw new Error('No se encontraron cursos para este alumno');
        }
        
        // Agrupar por curso/clase
        const cursosMatriculados = {};
        
        for (const registro of alumnoData) {
            const curso = cursos.find(c => c.id === registro.curso_id);
            const seccion = secciones.find(s => s.id === registro.seccion_id);
            const grado = grados.find(g => g.id === seccion?.grado_id);
            const periodo = periodos.find(p => p.id === registro.periodo_id);
            
            cursosMatriculados[registro.clase_id] = {
                clase_id: registro.clase_id,
                matricula_clase_id: registro.matricula_clase_id, // ID de matrícula necesario para registrar notas
                curso_id: curso?.id,
                curso_nombre: curso?.nombre || 'Curso Sin Nombre',
                seccion_id: seccion?.id,
                seccion_nombre: seccion?.nombre || 'Sin Sección',
                grado_nombre: grado?.nombre || 'Sin Grado',
                periodo_nombre: periodo?.nombre || 'Sin Periodo',
                notas: []
            };
        }
        
        // Cargar notas existentes por curso
        for (const claseId in cursosMatriculados) {
            try {
                // Usar listNotas que ya soporta filtrado por alumno y clase
                const result = await NotasService.listNotas(alumnoId, claseId);
                if (result.success && result.data.notas) {
                    cursosMatriculados[claseId].notas = result.data.notas;
                }
            } catch (error) {
                console.warn(`No se pudieron cargar notas para clase ${claseId}:`, error);
            }
        }
        
        // Generar HTML tipo SIAGIE
        let modalContent = `
            <div class="mb-3 p-3 bg-primary text-white rounded">
                <h6 class="mb-2"><i class="bi bi-clipboard-data me-2"></i>Registro de Calificaciones</h6>
                <small>Gestiona las notas por curso. Cada curso puede usar calificación numérica (0-20) o literal (AD, A, B, C)</small>
            </div>
        `;
        
        Object.values(cursosMatriculados).forEach(cursoInfo => {
            // Determinar tipo de calificación actual
            let tipoCalificacion = 'numerico'; // Por defecto numérico
            let bloqueado = false;
            
            if (cursoInfo.notas.length > 0) {
                const primeraNota = cursoInfo.notas[0];
                tipoCalificacion = primeraNota.valor_literal ? 'literal' : 'numerico';
                bloqueado = true; // Si ya hay notas, no se puede cambiar el tipo
            }
            
            // Calcular promedio
            let promedioDisplay = '-';
            if (cursoInfo.notas.length > 0) {
                if (tipoCalificacion === 'numerico') {
                    const notasNum = cursoInfo.notas.filter(n => n.valor_numerico).map(n => n.valor_numerico);
                    if (notasNum.length > 0) {
                        const promedio = notasNum.reduce((a, b) => a + b, 0) / notasNum.length;
                        promedioDisplay = promedio.toFixed(1);
                    }
                } else {
                    // Para literal, mostrar la calificación más frecuente o la última
                    const ultimaNota = cursoInfo.notas[cursoInfo.notas.length - 1];
                    promedioDisplay = ultimaNota.valor_literal || '-';
                }
            }
            
            modalContent += `
                <div class="card mb-4 border-2 border-primary">
                    <div class="card-header bg-light">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h6 class="mb-1">
                                    <i class="bi bi-book-fill text-primary me-2"></i>
                                    <strong>${cursoInfo.curso_nombre}</strong>
                                </h6>
                                <small class="text-muted">
                                    ${cursoInfo.grado_nombre} "${cursoInfo.seccion_nombre}" • ${cursoInfo.periodo_nombre}
                                </small>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small mb-1"><strong>Tipo de Calificación:</strong></label>
                                <select class="form-select form-select-sm" 
                                        id="tipoCalif_${cursoInfo.clase_id}" 
                                        onchange="cambiarTipoCalificacion('${cursoInfo.clase_id}', this.value)"
                                        ${bloqueado ? 'disabled' : ''}>
                                    <option value="numerico" ${tipoCalificacion === 'numerico' ? 'selected' : ''}>
                                        📊 Numérica (0-20)
                                    </option>
                                    <option value="literal" ${tipoCalificacion === 'literal' ? 'selected' : ''}>
                                        📝 Literal (AD, A, B, C)
                                    </option>
                                </select>
                                ${bloqueado ? '<small class="text-warning">⚠️ Ya hay notas registradas</small>' : ''}
                            </div>
                            <div class="col-md-3 text-end">
                                <div class="badge bg-success fs-6 p-2">
                                    Promedio: <strong>${promedioDisplay}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered table-hover">
                                <thead class="table-success">
                                    <tr>
                                        <th style="width: 25%;">Tipo de Evaluación</th>
                                        <th style="width: 15%;" class="text-center">
                                            ${tipoCalificacion === 'numerico' ? '📊 Nota (0-20)' : '📝 Calificación'}
                                        </th>
                                        <th style="width: 15%;" class="text-center">⚖️ Peso (%)</th>
                                        <th style="width: 15%;" class="text-center">📅 Fecha</th>
                                        <th style="width: 15%;" class="text-center">🔧 Acciones</th>
                                        <th style="width: 15%;" class="text-center">💬 Observación</th>
                                    </tr>
                                </thead>
                                <tbody id="notasTable_${cursoInfo.clase_id}">
                                    ${generateNotasRowsSiagie(cursoInfo.notas, cursoInfo.clase_id, tipoCalificacion)}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-3">
                            <button type="button" class="btn btn-success" 
                                    onclick="agregarNuevaNotaSiagie('${cursoInfo.clase_id}', '${alumnoId}', '${cursoInfo.curso_nombre}', '${tipoCalificacion}')">
                                <i class="bi bi-plus-circle me-2"></i>
                                ➕ Agregar Nueva Evaluación
                            </button>
                            
                            <button type="button" class="btn btn-info ms-2" 
                                    onclick="verEstadisticas('${cursoInfo.clase_id}')">
                                <i class="bi bi-graph-up me-2"></i>
                                📈 Ver Estadísticas
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (Object.keys(cursosMatriculados).length === 0) {
            modalContent = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Sin cursos matriculados</strong><br>
                    Este alumno no está matriculado en ningún curso donde usted sea docente.
                </div>
            `;
        }
        
        document.getElementById('notasAlumnoContainer').innerHTML = modalContent;
        
        // Guardar datos globales
        window.currentAlumnoId = alumnoId;
        window.currentAlumnoNombre = `${apellidos}, ${nombres}`;
        window.currentCursosMatriculados = cursosMatriculados;
        
        // Mostrar modal
        new bootstrap.Modal(document.getElementById('modalGestionarNotas')).show();
        
    } catch (error) {
        console.error('Error cargando notas:', error);
        showToast('Error', 'No se pudieron cargar las notas del alumno: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Genera las filas de notas estilo SIAGIE
 */
function generateNotasRowsSiagie(notas, claseId, tipoCalificacion) {
    if (notas.length === 0) {
        return `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                    <br>No hay evaluaciones registradas
                    <br><small>Haz clic en "Agregar Nueva Evaluación" para comenzar</small>
                </td>
            </tr>
        `;
    }
    
    return notas.map((nota, index) => {
        const valor = tipoCalificacion === 'numerico' 
            ? (nota.valor_numerico || '-')
            : (nota.valor_literal || '-');
            
        // Determinar color según la calificación
        let badgeClass = 'bg-secondary';
        if (tipoCalificacion === 'numerico' && nota.valor_numerico) {
            if (nota.valor_numerico >= 17) badgeClass = 'bg-success';
            else if (nota.valor_numerico >= 14) badgeClass = 'bg-primary';
            else if (nota.valor_numerico >= 11) badgeClass = 'bg-warning';
            else badgeClass = 'bg-danger';
        } else if (tipoCalificacion === 'literal') {
            switch(nota.valor_literal) {
                case 'AD': badgeClass = 'bg-success'; break;
                case 'A': badgeClass = 'bg-primary'; break;
                case 'B': badgeClass = 'bg-warning'; break;
                case 'C': badgeClass = 'bg-danger'; break;
            }
        }
            
        return `
            <tr class="${index % 2 === 0 ? 'table-light' : ''}">
                <td>
                    <span class="badge bg-info me-1">${index + 1}</span>
                    <strong>${nota.tipo_evaluacion || 'Evaluación'}</strong>
                </td>
                <td class="text-center">
                    <span class="badge ${badgeClass} fs-6 p-2">${valor}</span>
                </td>
                <td class="text-center">
                    <span class="badge bg-secondary">${nota.peso || 100}%</span>
                </td>
                <td class="text-center">
                    <small>${formatDateSiagie(nota.fecha_evaluacion || nota.created_at)}</small>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" 
                                onclick="editarNotaSiagie('${nota.id}', '${claseId}')" 
                                title="Editar evaluación">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" 
                                onclick="confirmarEliminarNota('${nota.id}', '${claseId}')" 
                                title="Eliminar evaluación">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
                <td class="text-center">
                    <small class="text-muted">
                        ${nota.observaciones ? 
                            `<i class="bi bi-chat-text" title="${nota.observaciones}"></i>` : 
                            '<i class="bi bi-dash-circle text-muted" title="Sin observaciones"></i>'}
                    </small>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Formatea fecha estilo SIAGIE
 */
function formatDateSiagie(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Cambia el tipo de calificación para un curso
 */
function cambiarTipoCalificacion(claseId, nuevoTipo) {
    console.log(`Cambio tipo de calificación para clase ${claseId} a ${nuevoTipo}`);
    
    // Actualizar la tabla de notas
    const cursoInfo = window.currentCursosMatriculados[claseId];
    if (cursoInfo) {
        const notasTableBody = document.getElementById(`notasTable_${claseId}`);
        if (notasTableBody) {
            notasTableBody.innerHTML = generateNotasRowsSiagie(cursoInfo.notas, claseId, nuevoTipo);
        }
        
        // Actualizar header de la tabla
        const headerCelda = document.querySelector(`#notasTable_${claseId}`)?.closest('table')
            ?.querySelector('thead th:nth-child(2)');
        if (headerCelda) {
            headerCelda.innerHTML = nuevoTipo === 'numerico' ? '📊 Nota (0-20)' : '📝 Calificación';
        }
    }
}

/**
 * Agrega una nueva nota estilo SIAGIE
 */
function agregarNuevaNotaSiagie(claseId, alumnoId, cursoNombre, tipoCalificacion) {
    const modalId = `modalNuevaNota_${claseId}`;
    
    // Crear modal dinámico
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-plus-circle me-2"></i>
                            Nueva Evaluación - ${cursoNombre}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <form onsubmit="guardarNuevaNotaSiagie(event, '${claseId}', '${alumnoId}', '${tipoCalificacion}')">
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle me-2"></i>
                                <strong>Alumno:</strong> ${window.currentAlumnoNombre} • 
                                <strong>Tipo:</strong> ${tipoCalificacion === 'numerico' ? 'Calificación Numérica (0-20)' : 'Calificación Literal (AD, A, B, C)'}
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Tipo de Evaluación *</strong></label>
                                    <select class="form-select" id="tipoEval_${claseId}" required>
                                        <option value="">Seleccionar tipo...</option>
                                        ${tiposEvaluacion.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
                                    </select>
                                </div>
                                
                                ${tipoCalificacion === 'numerico' ? `
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Calificación Numérica *</strong></label>
                                    <input type="number" class="form-control form-control-lg text-center" 
                                           id="valorNum_${claseId}" 
                                           min="0" max="20" step="0.1" required
                                           placeholder="0.0">
                                    <div class="form-text">
                                        <small>
                                            <span class="badge bg-danger">0-10: C</span>
                                            <span class="badge bg-warning">11-13: B</span>
                                            <span class="badge bg-primary">14-16: A</span>
                                            <span class="badge bg-success">17-20: AD</span>
                                        </small>
                                    </div>
                                </div>
                                ` : `
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Calificación Literal *</strong></label>
                                    <select class="form-select form-select-lg text-center" id="valorLit_${claseId}" required>
                                        <option value="">Seleccionar calificación...</option>
                                        <option value="AD">🏆 AD - Logro Destacado</option>
                                        <option value="A">✅ A - Logro Esperado</option>
                                        <option value="B">⚠️ B - En Proceso</option>
                                        <option value="C">❌ C - En Inicio</option>
                                    </select>
                                    <div class="form-text">
                                        <small>Selecciona el nivel de logro alcanzado</small>
                                    </div>
                                </div>
                                `}
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Peso de la Evaluación (%)</strong></label>
                                    <input type="range" class="form-range" id="pesoRange_${claseId}" 
                                           min="5" max="100" value="20" 
                                           oninput="document.getElementById('pesoValue_${claseId}').value = this.value">
                                    <div class="d-flex justify-content-between">
                                        <small>5%</small>
                                        <input type="number" class="form-control form-control-sm text-center" 
                                               id="pesoValue_${claseId}" value="20" 
                                               min="5" max="100" style="width: 80px;"
                                               oninput="document.getElementById('pesoRange_${claseId}').value = this.value">
                                        <small>100%</small>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Fecha de Evaluación</strong></label>
                                    <input type="date" class="form-control" id="fecha_${claseId}" 
                                           value="${new Date().toISOString().split('T')[0]}" required>
                                    <div class="form-text">
                                        <small>Fecha en que se realizó la evaluación</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <label class="form-label"><strong>Observaciones</strong></label>
                                <textarea class="form-control" id="obs_${claseId}" rows="3" 
                                         placeholder="Comentarios sobre el desempeño, recomendaciones, etc. (opcional)"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Cancelar
                            </button>
                            <button type="submit" class="btn btn-success">
                                <i class="bi bi-save me-1"></i>💾 Guardar Evaluación
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    new bootstrap.Modal(document.getElementById(modalId)).show();
}

/**
 * Guarda nueva nota estilo SIAGIE
 */
async function guardarNuevaNotaSiagie(event, claseId, alumnoId, tipoCalificacion) {
    event.preventDefault();
    
    try {
        // Obtener ID de matrícula
        const cursoInfo = window.currentCursosMatriculados[claseId];
        if (!cursoInfo || !cursoInfo.matricula_clase_id) {
            throw new Error('No se encontró la matrícula del alumno en este curso');
        }

        // Obtener IDs reales
        const tipoEvalId = document.getElementById(`tipoEval_${claseId}`).value;
        const periodoActivo = periodos.find(p => p.activo) || periodos[0];
        const periodoId = periodoActivo ? periodoActivo.id : '1';
        
        // Buscar escala adecuada
        let escalaId = '1';
        if (escalas && escalas.length > 0) {
            const tipoEscalaBuscado = tipoCalificacion === 'numerico' ? 'NUMERICA' : 'LITERAL';
            const escalaEncontrada = escalas.find(e => e.tipo === tipoEscalaBuscado);
            if (escalaEncontrada) {
                escalaId = escalaEncontrada.id;
            } else {
                escalaId = escalas[0].id;
            }
        }

        const notaData = {
            matricula_clase_id: cursoInfo.matricula_clase_id,
            tipo_evaluacion_id: tipoEvalId,
            periodo_id: periodoId,
            escala_id: escalaId,
            // Campos adicionales para mapeo en backend si es necesario
            tipo_evaluacion_nombre: document.getElementById(`tipoEval_${claseId}`).options[document.getElementById(`tipoEval_${claseId}`).selectedIndex].text,
            peso: parseInt(document.getElementById(`pesoValue_${claseId}`).value),
            observaciones: document.getElementById(`obs_${claseId}`).value || null
        };
        
        // Agregar valor según tipo
        if (tipoCalificacion === 'numerico') {
            notaData.valor_numerico = parseFloat(document.getElementById(`valorNum_${claseId}`).value);
            notaData.valor_literal = null;
        } else {
            notaData.valor_literal = document.getElementById(`valorLit_${claseId}`).value;
            notaData.valor_numerico = null;
        }
        
        showLoading('Guardando evaluación...');
        
        const result = await NotasService.createNota(notaData);
        
        if (result.success) {
            showToast('Éxito', '✅ Evaluación registrada correctamente', 'success');
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById(`modalNuevaNota_${claseId}`)).hide();
            
            // Recargar notas
            if (window.currentAlumnoId && window.currentAlumnoNombre) {
                const nombres = window.currentAlumnoNombre.split(', ');
                abrirGestionNotas(window.currentAlumnoId, nombres[0], nombres[1]);
            }
        } else {
            throw new Error(result.error || 'Error al guardar la evaluación');
        }
        
    } catch (error) {
        console.error('Error guardando nota:', error);
        showToast('Error', '❌ ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}