# Shared Common - Exceptions
from typing import Optional


class DomainException(Exception):
    """Excepción base de dominio"""
    def __init__(self, message: str, code: Optional[str] = None):
        self.message = message
        self.code = code or self.__class__.__name__
        super().__init__(self.message)


class NotFoundException(DomainException):
    """Recurso no encontrado"""
    pass


class AlreadyExistsException(DomainException):
    """Recurso ya existe"""
    pass


class ValidationException(DomainException):
    """Error de validación de negocio"""
    pass


class UnauthorizedException(DomainException):
    """No autorizado"""
    pass


class ForbiddenException(DomainException):
    """Prohibido - sin permisos"""
    pass


class BusinessRuleException(DomainException):
    """Violación de regla de negocio"""
    pass
