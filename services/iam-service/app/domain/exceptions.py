# IAM Service - Domain Exceptions
from shared.common import DomainException


class UserAlreadyExistsException(DomainException):
    """Usuario ya existe"""
    pass


class InvalidCredentialsException(DomainException):
    """Credenciales inválidas"""
    pass


class UserNotFoundException(DomainException):
    """Usuario no encontrado"""
    pass


class RolNotFoundException(DomainException):
    """Rol no encontrado"""
    pass


class WeakPasswordException(DomainException):
    """Contraseña débil"""
    pass


class UserInactiveException(DomainException):
    """Usuario inactivo"""
    pass
