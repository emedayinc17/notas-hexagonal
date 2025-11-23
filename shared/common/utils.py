# Shared Common - Utils
import uuid
from datetime import datetime
from typing import Any, Dict


def generate_uuid() -> str:
    """Genera un UUID v4 como string"""
    return str(uuid.uuid4())


def current_timestamp() -> datetime:
    """Retorna timestamp actual"""
    return datetime.utcnow()


def to_dict(obj: Any, exclude: set = None) -> Dict:
    """Convierte un objeto a diccionario, excluyendo campos si es necesario"""
    if exclude is None:
        exclude = set()
    
    if hasattr(obj, "__dict__"):
        return {
            key: value for key, value in obj.__dict__.items()
            if not key.startswith("_") and key not in exclude
        }
    return {}


def paginate_query(query, offset: int = 0, limit: int = 20, max_limit: int = 100):
    """Aplica paginación a una query de SQLAlchemy"""
    # Limitar el limit al máximo permitido
    limit = min(limit, max_limit)
    
    return query.offset(offset).limit(limit)
