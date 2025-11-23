# Personas Service - Domain Exceptions
from shared.common import DomainException


class AlumnoNotFoundException(DomainException):
    pass


class PadreNotFoundException(DomainException):
    pass


class AlumnoAlreadyExistsException(DomainException):
    pass


class PadreAlreadyExistsException(DomainException):
    pass


class RelacionAlreadyExistsException(DomainException):
    pass


class MatriculaAlreadyExistsException(DomainException):
    pass
