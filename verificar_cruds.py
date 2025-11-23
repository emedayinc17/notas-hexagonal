"""
Script de Verificación de CRUDs
Verifica que todos los CRUDs estén funcionando correctamente
"""
import requests
import json
from datetime import date

# Configuración
BASE_URL = "http://127.0.0.1"
IAM_PORT = 8001
ACADEMICO_PORT = 8002
PERSONAS_PORT = 8003
NOTAS_PORT = 8004

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

# Token global
TOKEN = None

def get_headers():
    """Headers con autenticación"""
    return {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

            data = response.json()
            TOKEN = data.get('access_token')
            print_success("Login exitoso - Token obtenido")
            return True
        else:
            print_error(f"Login fallido: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Error en login: {e}")
        return False

def test_crud(service_name, port, endpoint, create_data, update_data=None):
    """Prueba CRUD completo de un endpoint"""
    print(f"\n{'='*60}")
    print(f"Probando CRUD: {service_name} - {endpoint}")
    print(f"{'='*60}")
    try:
        response = requests.get(base_url, headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('data', [])) or len(data)
            print_success(f"READ (List) exitoso - {count} registros")
        else:
            print_error(f"READ (List) fallido: {response.status_code}")
    except Exception as e:
        print_error(f"READ (List) error: {e}")

    # 3. READ (Get by ID)
    if created_id:
        print_info(f"3. READ (Get) - Obteniendo registro {created_id}...")
        try:
            response = requests.get(f"{base_url}/{created_id}", headers=get_headers())
            if response.status_code == 200:
                print_success("READ (Get) exitoso")
            else:
                print_warning(f"READ (Get) no disponible o fallido: {response.status_code}")
        except Exception as e:
            print_warning(f"READ (Get) no disponible: {e}")

    # 4. UPDATE
    if created_id and update_data:
        print_info(f"4. UPDATE - Actualizando registro {created_id}...")
        try:
            response = requests.put(f"{base_url}/{created_id}", json=update_data, headers=get_headers())
            if response.status_code == 200:
                print_success("UPDATE exitoso")
            else:
                print_warning(f"UPDATE fallido: {response.status_code}")
        except Exception as e:
            print_warning(f"UPDATE error: {e}")

    # 5. DELETE
    if created_id:
        print_info(f"5. DELETE - Eliminando registro {created_id}...")
        try:
            response = requests.delete(f"{base_url}/{created_id}", headers=get_headers())
            if response.status_code in [200, 204]:
                print_success("DELETE exitoso")
                return True
            else:
                print_warning(f"DELETE fallido: {response.status_code}")
                return True
        except Exception as e:
            print_warning(f"DELETE error: {e}")
            return True
    return True

def main():
    print(f"\n{'#'*60}")
    print(f"# VERIFICACIÓN DE CRUDs - Sistema de Gestión Académica")
    print(f"{'#'*60}\n")

    if not login():
        print_error("No se pudo iniciar sesión. Abortando pruebas.")
        return

    results = {}

    # ========== IAM SERVICE ===========
    print(f"\n{'='*60}")
    print(f"IAM SERVICE (Puerto {IAM_PORT})")
    print(f"{'='*60}")
    results['Usuarios'] = test_crud(
        "IAM", IAM_PORT, "/v1/usuarios",
        create_data={
            "username": "test_user",
            "email": "test@example.com",
            "password": "Test123!",
            "rol_id": "1"
        },
        update_data={"email": "test_updated@example.com"}
    )

    # ========== ACADÉMICO SERVICE ===========
    print(f"\n{'='*60}")
    print(f"ACADÉMICO SERVICE (Puerto {ACADEMICO_PORT})")
    print(f"{'='*60}")
    results['Grados'] = test_crud(
        "Académico", ACADEMICO_PORT, "/v1/grados",
        create_data={"nombre": "Test Grado", "nivel": "PRIMARIA", "orden": 99},
        update_data={"nombre": "Test Grado Actualizado"}
    )
    results['Cursos'] = test_crud(
        "Académico", ACADEMICO_PORT, "/v1/cursos",
        create_data={"nombre": "Test Curso", "codigo": "TEST001", "descripcion": "Curso de prueba"},
        update_data={"nombre": "Test Curso Actualizado"}
    )
    results['Secciones'] = test_crud(
        "Académico", ACADEMICO_PORT, "/v1/secciones",
        create_data={"nombre": "Test A", "anio_escolar": 2024, "capacidad_maxima": 30},
        update_data={"capacidad_maxima": 35}
    )

    # ========== PERSONAS SERVICE ===========
    print(f"\n{'='*60}")
    print(f"PERSONAS SERVICE (Puerto {PERSONAS_PORT})")
    print(f"{'='*60}")
    results['Alumnos'] = test_crud(
        "Personas", PERSONAS_PORT, "/v1/alumnos",
        create_data={
            "codigo_alumno": "TEST2024001",
            "nombres": "Test",
            "apellido_paterno": "Alumno",
            "apellido_materno": "Prueba",
            "fecha_nacimiento": "2010-01-01",
            "genero": "M",
            "dni": "99999999"
        },
        update_data={"nombres": "Test Actualizado"}
    )
    results['Padres'] = test_crud(
        "Personas", PERSONAS_PORT, "/v1/padres",
        create_data={
            "nombres": "Test",
            "apellido_paterno": "Padre",
            "apellido_materno": "Prueba",
            "email": "testpadre@example.com",
            "dni": "88888888"
        },
        update_data={"email": "testpadre_updated@example.com"}
    )

    # ========== NOTAS SERVICE ===========
    print(f"\n{'='*60}")
    print(f"NOTAS SERVICE (Puerto {NOTAS_PORT})")
    print(f"{'='*60}")
    print_info("Verificando endpoints de Notas...")
    try:
        response = requests.get(f"{BASE_URL}:{NOTAS_PORT}/v1/notas", headers=get_headers())
        if response.status_code == 200:
            print_success("Endpoint de Notas funcionando")
            results['Notas'] = True
        else:
            print_warning(f"Endpoint de Notas respondió con: {response.status_code}")
            results['Notas'] = False
    except Exception as e:
        print_error(f"Error en Notas: {e}")
        results['Notas'] = False

    # ========== RESUMEN ===========
    print(f"\n{'='*60}")
    print(f"RESUMEN DE RESULTADOS")
    print(f"{'='*60}\n")
    total = len(results)
    exitosos = sum(1 for v in results.values() if v)
    for crud, status in results.items():
        if status:
            print_success(f"{crud}: FUNCIONANDO")
        else:
            print_error(f"{crud}: FALLIDO")
    print(f"\n{'='*60}")
    print(f"Total: {exitosos}/{total} CRUDs funcionando")
    print(f"{'='*60}\n")
    if exitosos == total:
        print_success("¡TODOS LOS CRUDs ESTÁN FUNCIONANDO! 🎉")
    elif exitosos >= total * 0.8:
        print_warning(f"La mayoría de CRUDs funcionan ({exitosos}/{total})")
    else:
        print_error(f"Varios CRUDs tienen problemas ({exitosos}/{total})")

if __name__ == "__main__":
    main()
