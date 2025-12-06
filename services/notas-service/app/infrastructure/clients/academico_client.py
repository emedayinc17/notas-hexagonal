# Notas Service - HTTP Client for Académico Service
import httpx
from typing import Optional, Dict


class AcademicoServiceClient:
    """Cliente HTTP para comunicarse con Académico Service"""
    
    def __init__(self, base_url: str = "http://localhost:8002"):
        self.base_url = base_url
    
    async def get_umbral_alerta(
        self, 
        escala_id: str, 
        curso_id: Optional[str] = None,
        grado_id: Optional[str] = None,
        token: str = None
    ) -> Optional[Dict]:
        """Obtiene el umbral de alerta para una escala/curso/grado"""
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        params = {"escala_id": escala_id}
        if curso_id:
            params["curso_id"] = curso_id
        if grado_id:
            params["grado_id"] = grado_id
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/v1/umbrales",
                    params=params,
                    headers=headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    # Académico returns {"umbrales": [...]} so normalize
                    if isinstance(data, dict):
                        items = data.get("umbrales", [])
                    else:
                        items = data
                    return items[0] if items else None
                return None
            except Exception as e:
                print(f"Error calling Académico Service: {e}")
                return None
