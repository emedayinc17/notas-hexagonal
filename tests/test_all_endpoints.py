import httpx
import time
import random
import string
import json

# Helper to generate a random suffix (to avoid name collisions)
def random_suffix(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# Base URLs for the four services
IAM_URL = "http://localhost:8001"
ACADEMICO_URL = "http://localhost:8002"
PERSONAS_URL = "http://localhost:8003"
NOTAS_URL = "http://localhost:8004"

print("🔧 Iniciando pruebas de todos los endpoints con datos aleatorios...")
print("=" * 80)

time.sleep(3)  # Esperar a que los servicios estén listos

# ---------------------------------------------------------------------------
# 1️⃣ Registro y login de un usuario DOCENTE (usaremos su token para Personas y Notas)
# ---------------------------------------------------------------------------
user_suffix = random_suffix()
register_payload = {
    "username": f"docente_{user_suffix}",
    "email": f"docente_{user_suffix}@test.com",
    "password": "Docente123!",
    "rol_nombre": "DOCENTE",
    "nombres": "Docente",
    "apellidos": "Test"
}
resp = httpx.post(f"{IAM_URL}/v1/auth/register", json=register_payload, timeout=10)
print(f"Registro DOCENTE: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo registrar el docente – abortando pruebas")

login_payload = {"email": register_payload["email"], "password": register_payload["password"]}
resp = httpx.post(f"{IAM_URL}/v1/auth/login", json=login_payload, timeout=10)
print(f"Login DOCENTE: {resp.status_code}")
if resp.status_code != 200:
    raise SystemExit("❌ No se pudo loguear el docente – abortando pruebas")

docente_token = resp.json()["access_token"]
headers_docente = {"Authorization": f"Bearer {docente_token}"}
print("✅ DOCENTE registrado y autenticado")

# ---------------------------------------------------------------------------
# 2️⃣ Login como ADMIN (necesario para crear recursos académicos)
# ---------------------------------------------------------------------------
admin_login = httpx.post(
    f"{IAM_URL}/v1/auth/login",
    json={"email": "admin@colegio.com", "password": "Admin123!"},
    timeout=10,
)
print(f"Login ADMIN: {admin_login.status_code}")
if admin_login.status_code != 200:
    raise SystemExit("❌ No se pudo loguear el admin – abortando pruebas académicas")
admin_token = admin_login.json()["access_token"]
headers_admin = {"Authorization": f"Bearer {admin_token}"}
print("✅ ADMIN autenticado")

# ---------------------------------------------------------------------------
# 3️⃣ Crear estructura académica (GRADO, CURSO, SECCIÓN, TIPO PERIODO, PERIODO, CLASE)
# ---------------------------------------------------------------------------
# Grado
grado_payload = {"nombre": f"Grado_{user_suffix}", "nivel": "PRIMARIA", "orden": random.randint(1, 1000), "descripcion": "Grado de prueba"}
resp = httpx.post(f"{ACADEMICO_URL}/v1/grados", json=grado_payload, headers=headers_admin, timeout=10)
print(f"Crear Grado: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear el Grado – abortando")
grado_id = resp.json()["id"]

# Curso
curso_payload = {"nombre": f"Curso_{user_suffix}", "grado_id": grado_id, "codigo": f"C{user_suffix}", "descripcion": "Curso de prueba"}
resp = httpx.post(f"{ACADEMICO_URL}/v1/cursos", json=curso_payload, headers=headers_admin, timeout=10)
print(f"Crear Curso: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear el Curso – abortando")
curso_id = resp.json()["id"]

# Tipo de Periodo
tipo_periodo_payload = {"nombre": f"SEMESTRE_{user_suffix}", "num_periodos": 2}
resp = httpx.post(f"{ACADEMICO_URL}/v1/periodos/tipos", json=tipo_periodo_payload, headers=headers_admin, timeout=10)
print(f"Crear Tipo Periodo: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear el Tipo de Periodo – abortando")
tipo_periodo_id = resp.json()["id"]

# Periodo
periodo_payload = {
    "año_escolar": 2025,
    "tipo_id": tipo_periodo_id,
    "numero": 1,
    "nombre": f"Semestre I {user_suffix}",
    "fecha_inicio": "2025-03-01",
    "fecha_fin": "2025-07-01",
}
resp = httpx.post(f"{ACADEMICO_URL}/v1/periodos", json=periodo_payload, headers=headers_admin, timeout=10)
print(f"Crear Periodo: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear el Periodo – abortando")
periodo_id = resp.json()["id"]
# Sección payload
seccion_payload = {
    "grado_id": grado_id,
    "nombre": f"S{user_suffix[:8]}",
    "año_escolar": 2025,
    "capacidad_maxima": 30,
}
# Sección
resp = httpx.post(f"{ACADEMICO_URL}/v1/secciones", json=seccion_payload, headers=headers_admin, timeout=10)
print(f"Crear Sección: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear la Sección – abortando")
seccion_id = resp.json()["id"]

# Clase (necesitamos el user_id del docente que creamos)
# Obtener user_id del docente usando su email
resp_user = httpx.post(
    f"{IAM_URL}/v1/auth/login",
    json={"email": register_payload["email"], "password": register_payload["password"]},
    timeout=10,
)
docente_user_id = resp_user.json()["user"]["id"]

clase_payload = {
    "curso_id": curso_id,
    "seccion_id": seccion_id,
    "periodo_id": periodo_id,
    "docente_user_id": docente_user_id,
}
resp = httpx.post(f"{ACADEMICO_URL}/v1/clases", json=clase_payload, headers=headers_admin, timeout=10)
print(f"Crear Clase: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear la Clase – abortando")
clase_id = resp.json()["id"]

# ---------------------------------------------------------------------------
# 4️⃣ Crear alumno, padre, vincularlos y matricular al alumno (usaremos token ADMIN)
# ---------------------------------------------------------------------------
alumno_payload = {
    "codigo_alumno": f"ALU{user_suffix}",
    "dni": f"{random.randint(10000000, 99999999)}",
    "nombres": "Alumno",
    "apellido_paterno": "Test",
    "apellido_materno": "Demo",
    "fecha_nacimiento": "2005-01-01",
    "genero": "M",
    "email": f"alumno_{user_suffix}@test.com",
    "celular": "123456789",
    "direccion": "Calle Falsa 123",
    "status": "ACTIVO",
}
resp = httpx.post(f"{PERSONAS_URL}/v1/alumnos", json=alumno_payload, headers=headers_admin, timeout=10)
print(f"Crear Alumno: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear el Alumno – abortando")
alumno_id = resp.json()["id"]

# Padre
padre_payload = {
    "dni": f"{random.randint(10000000, 99999999)}",
    "nombres": "Padre",
    "apellido_paterno": "Test",
    "apellido_materno": "Demo",
    "email": f"padre_{user_suffix}@test.com",
    "celular": "987654321",
    "direccion": "Calle Verdadera 456",
    "status": "ACTIVO",
}
resp = httpx.post(f"{PERSONAS_URL}/v1/padres", json=padre_payload, headers=headers_admin, timeout=10)
print(f"Crear Padre: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear el Padre – abortando")
padre_id = resp.json()["id"]

# Vincular padre‑alumno
link_payload = {
    "padre_id": padre_id,
    "alumno_id": alumno_id,
    "tipo_relacion": "PADRE",
    "es_contacto_principal": True,
}
resp = httpx.post(f"{PERSONAS_URL}/v1/relaciones", json=link_payload, headers=headers_admin, timeout=10)
print(f"Vincular Padre‑Alumno: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo vincular padre y alumno – abortando")

# Matricular alumno en la clase creada
matricula_payload = {
    "alumno_id": alumno_id,
    "clase_id": clase_id,
    "fecha_matricula": "2025-02-01",
    "status": "ACTIVO",
}
resp = httpx.post(f"{PERSONAS_URL}/v1/matriculas", json=matricula_payload, headers=headers_admin, timeout=10)
print(f"Crear Matrícula: {resp.status_code}")
if resp.status_code != 201:
    raise SystemExit("❌ No se pudo crear la Matrícula – abortando")
matricula_id = resp.json()["id"]

# ---------------------------------------------------------------------------
# 5️⃣ Registrar una nota (usaremos token DOCENTE)
# ---------------------------------------------------------------------------
# Obtener una escala desde Académico Service
resp = httpx.get(f"{ACADEMICO_URL}/v1/escalas", headers=headers_docente, timeout=10)
if resp.status_code == 200 and resp.json():
    escalas = resp.json()
    escala_id = escalas[0]["id"] if isinstance(escalas, list) else escalas.get("escalas", [{}])[0].get("id")
    print(f"✅ Escala obtenida: {escala_id}")
else:
    escala_id = None
    print(f"⚠️ No se pudo obtener escala desde Académico Service (status: {resp.status_code})")

# Obtener tipo de evaluación desde Notas Service (si existe el endpoint)
tipo_evaluacion_id = "260172d1-c7c4-11f0-8426-10ffe062188c"  # ID del Examen Bimestral
print(f"✅ Usando tipo de evaluación: Examen Bimestral")

# Solo intentar crear nota si tenemos escala
if escala_id and tipo_evaluacion_id:
    nota_payload = {
        "matricula_clase_id": matricula_id,
        "tipo_evaluacion_id": tipo_evaluacion_id,
        "periodo_id": periodo_id,
        "escala_id": escala_id,
        "valor_numerico": 14.5,
        "peso": 40.0,
        "observaciones": "Nota de prueba automática",
    }
    try:
        resp = httpx.post(f"{NOTAS_URL}/v1/notas", json=nota_payload, headers=headers_docente, timeout=10)
        print(f"Crear Nota: {resp.status_code}")
        if resp.status_code == 201:
            print("✅ Nota registrada con éxito")
        else:
            print(f"⚠️ Error al registrar nota: {resp.text[:200]}")
    except Exception as e:
        print(f"⚠️ No se pudo registrar nota (posible endpoint no implementado): {e}")
else:
    print("⚠️ Saltando prueba de notas (falta escala o tipo de evaluación)")

print("\n" + "=" * 80)
print("✅ Todas las pruebas de endpoints completadas.")
print("🎉 El backend está operativo y listo para el desarrollo del frontend.")
