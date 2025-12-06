import requests
import json

BASE_URL = "http://localhost:8001"
ACADEMICO_URL = "http://localhost:8002"

# Login
login_response = requests.post(
    f"{BASE_URL}/v1/auth/login",
    json={"email": "admin@colegio.com", "password": "Admin123!"}
)
login_data = login_response.json()
print(f"Login response: {login_data}")
token = login_data.get("access_token")
print(f"✅ Token: {token[:50]}...")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Crear un grado primero
grado_data = {
    "nombre": "Test Grado Update",
    "nivel": "SECUNDARIA",
    "orden": 10,
    "descripcion": "Test"
}

create_response = requests.post(
    f"{ACADEMICO_URL}/v1/grados",
    headers=headers,
    json=grado_data
)

print(f"\n CREATE Response: {create_response.status_code}")
print(f"CREATE Body: {json.dumps(create_response.json(), indent=2)}")

if create_response.status_code == 201:
    grado_id = create_response.json()["id"]
    print(f"\n✅ Grado creado con ID: {grado_id}")
    
    # Intentar actualizar
    update_data = {
        "nombre": "Updated Test Grado",
        "nivel": "PRIMARIA",
        "orden": 100
    }
    
    print(f"\n🔄 Intentando UPDATE a: {ACADEMICO_URL}/v1/grados/{grado_id}")
    print(f"Datos: {json.dumps(update_data, indent=2)}")
    
    update_response = requests.put(
        f"{ACADEMICO_URL}/v1/grados/{grado_id}",
        headers=headers,
        json=update_data
    )
    
    print(f"\n UPDATE Response: {update_response.status_code}")
    print(f"UPDATE Body: {update_response.text}")
    
    if update_response.status_code == 200:
        print("\n✅ UPDATE EXITOSO")
    else:
        print(f"\n❌ UPDATE FALLÓ con código {update_response.status_code}")
