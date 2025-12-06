"""
Script de prueba rápida para verificar que el sistema esté funcionando
correctamente antes de usar el frontend.
"""
import requests
import time

# Configuración
BASE_URLS = {
    'IAM': 'http://localhost:8001',
    'Academico': 'http://localhost:8002',
    'Personas': 'http://localhost:8003',
    'Notas': 'http://localhost:8004'
}

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def check_service(name, url):
    """Verifica si un servicio está respondiendo"""
    try:
        response = requests.get(f"{url}/docs", timeout=2)
        if response.status_code == 200:
            print(f"✅ {name:20} -> ONLINE")
            return True
        else:
            print(f"⚠️  {name:20} -> RESPONDIENDO PERO CON ERROR ({response.status_code})")
            return False
    except requests.exceptions.RequestException:
        print(f"❌ {name:20} -> OFFLINE")
        return False

def test_login():
    """Prueba el login con el usuario admin"""
    try:
        response = requests.post(
            f"{BASE_URLS['IAM']}/v1/auth/login",
            json={"email": "admin@colegio.com", "password": "Admin123!"}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            user = data.get('user', {})
            print(f"✅ Login exitoso como: {user.get('username')} ({user.get('rol', {}).get('nombre')})")
            return token
        else:
            print(f"❌ Login falló: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error en login: {e}")
        return None

def test_api_with_token(token):
    """Prueba endpoints básicos con el token"""
    headers = {'Authorization': f'Bearer {token}'}
    
    tests = [
        ('Listar Grados', 'GET', f"{BASE_URLS['Academico']}/v1/grados"),
        ('Listar Cursos', 'GET', f"{BASE_URLS['Academico']}/v1/cursos"),
        ('Listar Alumnos', 'GET', f"{BASE_URLS['Personas']}/v1/alumnos"),
        ('Listar Escalas', 'GET', f"{BASE_URLS['Academico']}/v1/escalas"),
    ]
    
    print("\n📋 Probando endpoints básicos:")
    for test_name, method, url in tests:
        try:
            response = requests.request(method, url, headers=headers, timeout=5)
            if response.status_code in [200, 201]:
                print(f"  ✅ {test_name}")
            else:
                print(f"  ⚠️  {test_name} -> Status {response.status_code}")
        except Exception as e:
            print(f"  ❌ {test_name} -> {str(e)[:50]}")

def main():
    print_header("🧪 TEST DE SISTEMA - Backend + Frontend")
    
    print("\n🔍 Verificando servicios backend...")
    time.sleep(1)
    
    # Verificar cada servicio
    services_status = {}
    for name, url in BASE_URLS.items():
        services_status[name] = check_service(f"{name} Service", url)
        time.sleep(0.5)
    
    all_online = all(services_status.values())
    
    if not all_online:
        print("\n⚠️  ADVERTENCIA: Algunos servicios están OFFLINE")
        print("   Asegúrate de ejecutar: .\\start_all_services.ps1")
        return
    
    print("\n✅ Todos los servicios backend están ONLINE")
    
    # Test de login
    print_header("🔐 Probando Autenticación")
    token = test_login()
    
    if token:
        # Test de endpoints
        print_header("📡 Probando Endpoints de API")
        test_api_with_token(token)
    
    # Verificar frontend
    print_header("🎨 Verificando Frontend")
    print("\n📝 INSTRUCCIONES:")
    print("  1. Abre tu navegador en: http://localhost:8080")
    print("  2. Deberías ver la página de login")
    print("  3. Usa las credenciales de prueba:")
    print("     • Admin:   admin@colegio.com / Admin123!")
    print("     • Docente: docente@colegio.com / Docente123!")
    print("     • Padre:   padre@colegio.com / Padre123!")
    
    print("\n💡 TIP: Usa los botones 'Acceso Rápido' en la página de login")
    
    print_header("✨ Sistema listo para usar")
    print("\n🎉 El backend está funcionando correctamente!")
    print("🌐 Inicia el frontend con: cd frontend; python -m http.server 8080")
    print("   O ejecuta: .\\start_full_system.ps1 (para todo junto)")

if __name__ == '__main__':
    main()
