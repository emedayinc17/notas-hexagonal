// ============================================
// LOGIN PAGE LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated()) {
        window.location.href = 'pages/dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const toggleIcon = document.getElementById('toggleIcon');
    const loginBtn = document.getElementById('loginBtn');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        if (type === 'password') {
            toggleIcon.classList.remove('bi-eye-slash');
            toggleIcon.classList.add('bi-eye');
        } else {
            toggleIcon.classList.remove('bi-eye');
            toggleIcon.classList.add('bi-eye-slash');
        }
    });

    // Form validation on input
    emailInput.addEventListener('input', function() {
        if (this.value && !isValidEmail(this.value)) {
            this.setCustomValidity('Por favor ingrese un email válido');
        } else {
            this.setCustomValidity('');
        }
    });

    // Submit handler
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!loginForm.checkValidity()) {
            loginForm.classList.add('was-validated');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Deshabilitar botón y mostrar loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...';

        try {
            // Llamar al API de login
            const result = await IAMService.login(email, password);

            if (result.success) {
                const { access_token, user } = result.data;
                
                // Guardar token y datos del usuario
                saveAuthToken(access_token);
                saveUserData(user);

                // Mostrar éxito
                showAlert('¡Bienvenido! Redirigiendo...', 'success');

                // Redirigir al dashboard después de un breve delay
                setTimeout(() => {
                    window.location.href = 'pages/dashboard.html';
                }, 1000);
            } else {
                // Mostrar error
                showAlert(result.error || 'Error al iniciar sesión', 'danger');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Ingresar';
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Error de conexión. Verifica que los servicios estén ejecutándose.', 'danger');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Ingresar';
        }
    });
});

// ============================================
// QUICK LOGIN FOR DEMO
// ============================================
async function quickLogin(role) {
    const credentials = {
        admin: {
            email: 'admin@colegio.com',
            password: 'Admin123!'
        },
        docente: {
            email: 'docente@colegio.com',
            password: 'Docente123!'
        },
        padre: {
            email: 'padre@colegio.com',
            password: 'Padre123!'
        }
    };

    const cred = credentials[role];
    if (!cred) return;

    document.getElementById('email').value = cred.email;
    document.getElementById('password').value = cred.password;

    // Auto-submit
    document.getElementById('loginForm').requestSubmit();
}
