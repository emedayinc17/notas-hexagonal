# Shared Security Utilities
import re
import logging
from typing import Optional
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Patrones sospechosos de SQL Injection
SQLI_PATTERNS = [
    r"(\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bUPDATE\b|\bINSERT\b)",
    r"(--|#|/\*|\*/)",
    r"(\bUNION\b.*\bSELECT\b)",
    r"(\bOR\b\s+\d+\s*=\s*\d+)",
    r"(\bAND\b\s+\d+\s*=\s*\d+)",
    r"(;|\bEXEC\b|\bEXECUTE\b)",
    r"(\bSELECT\b.*\bFROM\b)",
    r"(\bSCRIPT\b|\balert\b|\bon\w+\s*=)",  # También detecta XSS
]

def detect_injection_attempt(value: str, param_name: str = "parameter") -> bool:
    """
    Detecta intentos de inyección SQL o XSS en un string.
    
    Args:
        value: El valor a validar
        param_name: Nombre del parámetro (para logging)
    
    Returns:
        True si se detecta un intento de inyección, False si es seguro
    """
    if not value or not isinstance(value, str):
        return False
    
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            logger.warning(
                f"🚨 SECURITY ALERT: Injection attempt detected in '{param_name}': {value[:100]}"
            )
            return True
    
    return False


def validate_and_sanitize(
    value: Optional[str],
    param_name: str = "parameter",
    max_length: int = 100,
    allow_special_chars: bool = False,
    raise_on_suspicious: bool = True
) -> Optional[str]:
    """
    Valida y sanitiza un parámetro de entrada.
    
    Args:
        value: El valor a validar
        param_name: Nombre del parámetro
        max_length: Longitud máxima permitida
        allow_special_chars: Si se permiten caracteres especiales
        raise_on_suspicious: Si se debe lanzar excepción en caso de contenido sospechoso
    
    Returns:
        El valor sanitizado o None
    
    Raises:
        HTTPException: Si el valor es sospechoso y raise_on_suspicious=True
    """
    if value is None or value == "":
        return None
    
    # Verificar longitud
    if len(value) > max_length:
        logger.warning(f"Parameter '{param_name}' exceeds max length: {len(value)} > {max_length}")
        if raise_on_suspicious:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parameter '{param_name}' is too long (max {max_length} characters)"
            )
        return value[:max_length]
    
    # Detectar intentos de inyección
    if detect_injection_attempt(value, param_name):
        if raise_on_suspicious:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid characters detected in '{param_name}'"
            )
        return None
    
    # Validar caracteres permitidos
    if not allow_special_chars:
        # Solo letras, números, espacios y algunos caracteres comunes
        if not re.match(r'^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.@]+$', value):
            logger.warning(f"Parameter '{param_name}' contains invalid characters: {value}")
            if raise_on_suspicious:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Parameter '{param_name}' contains invalid characters"
                )
    
    return value.strip()


def validate_search_param(search: Optional[str]) -> Optional[str]:
    """
    Valida específicamente un parámetro de búsqueda.
    
    Args:
        search: El término de búsqueda
    
    Returns:
        El término sanitizado o None
    
    Raises:
        HTTPException: Si el término es sospechoso
    """
    if not search:
        return None
    
    # Validar y sanitizar
    sanitized = validate_and_sanitize(
        search,
        param_name="search",
        max_length=100,
        allow_special_chars=False,
        raise_on_suspicious=True
    )
    
    # Validación adicional: mínimo 2 caracteres para búsqueda
    if sanitized and len(sanitized) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search term must be at least 2 characters long"
        )
    
    return sanitized


def validate_dni(dni: Optional[str]) -> Optional[str]:
    """
    Valida un DNI peruano (8 dígitos).
    
    Args:
        dni: El DNI a validar
    
    Returns:
        El DNI validado o None
    
    Raises:
        HTTPException: Si el DNI es inválido
    """
    if not dni:
        return None
    
    # Remover espacios
    dni = dni.strip()
    
    # Validar formato: exactamente 8 dígitos
    if not re.match(r'^\d{8}$', dni):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DNI must be exactly 8 digits"
        )
    
    return dni


def validate_email(email: Optional[str]) -> Optional[str]:
    """
    Valida un email.
    
    Args:
        email: El email a validar
    
    Returns:
        El email validado o None
    
    Raises:
        HTTPException: Si el email es inválido
    """
    if not email:
        return None
    
    email = email.strip().lower()
    
    # Patrón básico de email
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Detectar intentos de inyección
    if detect_injection_attempt(email, "email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    return email


def log_security_event(event_type: str, details: dict, severity: str = "WARNING"):
    """
    Registra un evento de seguridad.
    
    Args:
        event_type: Tipo de evento (SQL_INJECTION_ATTEMPT, XSS_ATTEMPT, etc.)
        details: Detalles del evento
        severity: Nivel de severidad (INFO, WARNING, ERROR, CRITICAL)
    """
    log_message = f"🔒 SECURITY EVENT [{event_type}]: {details}"
    
    if severity == "CRITICAL":
        logger.critical(log_message)
    elif severity == "ERROR":
        logger.error(log_message)
    elif severity == "WARNING":
        logger.warning(log_message)
    else:
        logger.info(log_message)
