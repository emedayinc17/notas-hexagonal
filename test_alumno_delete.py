import requests

BASE_URL = "http://localhost:8001"
PERSONAS_URL = "http://localhost:8003"

# Login
response = requests.post(
    f"{BASE_URL}/v1/auth/login",
    json={"email": "admin@colegio.com", "password": "Admin123!"}
)
token = response.json()["access_token"]

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Crear alumno
alumno_data = {
    "codigo_alumno": "TEST_DELETE_999",
    "dni": "DNI999",
    "nombres": "Test Delete",
    "apellido_paterno": "Delete",
    "apellido_materno": "Test",
    "fecha_nacimiento": "2010-01-01",
    "genero": "M",
    "email": "delete999@test.com"
}

create_response = requests.post(
    f"{PERSONAS_URL}/v1/alumnos",
    headers=headers,
    json=alumno_data
)

print(f"CREATE: {create_response.status_code}")

if create_response.status_code == 201:
    alumno_id = create_response.json()["id"]
    print(f"Alumno ID: {alumno_id}")
    
    # Intentar DELETE
    print(f"\nDELETE URL: {PERSONAS_URL}/v1/alumnos/{alumno_id}")
    delete_response = requests.delete(
        f"{PERSONAS_URL}/v1/alumnos/{alumno_id}",
        headers=headers
    )
    
    print(f"DELETE Status: {delete_response.status_code}")
    print(f"DELETE Response: {delete_response.text}")
