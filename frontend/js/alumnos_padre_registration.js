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
    document.getElementById('padreNoEncontradoInfo').classList.add('d-none');
    document.getElementById('formRegistrarPadre').reset();
}
