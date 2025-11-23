# Shared Common Package
from .config import Settings, get_settings
from .database import Base, create_db_engine, create_session_factory, get_db_session
from .exceptions import (
    DomainException,
    NotFoundException,
    AlreadyExistsException,
    ValidationException,
    UnauthorizedException,
    ForbiddenException,
    BusinessRuleException,
)
from .jwt_utils import create_jwt_token, decode_jwt_token, extract_bearer_token
from .password_utils import hash_password, verify_password, validate_password_strength
from .utils import generate_uuid, current_timestamp, to_dict, paginate_query
from .audit import AuditoriaLog, AccionAuditoria
from .audit_helper import AuditHelper

__all__ = [
    # Config
    "Settings",
    "get_settings",
    # Database
    "Base",
    "create_db_engine",
    "create_session_factory",
    "get_db_session",
    # Exceptions
    "DomainException",
    "NotFoundException",
    "AlreadyExistsException",
    "ValidationException",
    "UnauthorizedException",
    "ForbiddenException",
    "BusinessRuleException",
    # JWT
    "create_jwt_token",
    "decode_jwt_token",
    "extract_bearer_token",
    # Password
    "hash_password",
    "verify_password",
    "validate_password_strength",
    # Utils
    "generate_uuid",
    "current_timestamp",
    "to_dict",
    "paginate_query",
    # Audit
    "AuditoriaLog",
    "AccionAuditoria",
    "AuditHelper",
]
