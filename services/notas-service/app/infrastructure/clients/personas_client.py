# Notas Service - HTTP Client for Personas Service
import httpx
from typing import List, Dict, Optional


class PersonasServiceClient:
    """Cliente HTTP para comunicarse con Personas Service"""
    
    def __init__(self, base_url: str = "http://localhost:8003"):
        self.base_url = base_url
    
    async def get_padres_by_alumno(self, alumno_id: str, token: str = None) -> List[Dict]:
        """Obtiene los padres de un alumno"""
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/v1/relaciones/alumno/{alumno_id}",
                    headers=headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    # Personas Service returns {"relaciones": [...]} where each item contains a nested "padre".
                    if isinstance(data, dict):
                        items = data.get("relaciones", [])
                    else:
                        items = data

                    # Normalize to a list of padre dicts (flatten relaciones -> padre)
                    padres = []
                    for it in items:
                        if isinstance(it, dict) and it.get("padre"):
                            padres.append(it.get("padre"))
                        elif isinstance(it, dict) and it.get("email"):
                            padres.append(it)
                    return padres
                return []
            except Exception as e:
                print(f"Error calling Personas Service: {e}")
                return []
    
    async def get_matricula_info(self, matricula_id: str, token: str = None) -> Optional[Dict]:
        """Obtiene información de una matrícula"""
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/v1/matriculas/{matricula_id}",
                    headers=headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception as e:
                print(f"Error calling Personas Service: {e}")
                return None
