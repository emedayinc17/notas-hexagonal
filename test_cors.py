import requests
try:
    print("Testing OPTIONS request...")
    resp = requests.options(
        "http://localhost:8003/v1/matriculas",
        headers={"Origin": "http://localhost:8080", "Access-Control-Request-Method": "POST"}
    )
    print(f"Status: {resp.status_code}")
    print(f"Headers: {dict(resp.headers)}")
except Exception as e:
    print(f"Error: {e}")
