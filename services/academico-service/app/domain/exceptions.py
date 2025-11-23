# Académico Service - Domain Exceptions
from shared.common import DomainException


class GradoNotFoundException(DomainException):
    pass


class SeccionNotFoundException(DomainException):
    pass


class CursoNotFoundException(DomainException):
    pass


class ClaseNotFoundException(DomainException):
    pass


class PeriodoNotFoundException(DomainException):
    pass


class EscalaNotFoundException(DomainException):
    pass


class CodigoAlreadyExistsException(DomainException):
    pass


class ClaseAlreadyExistsException(DomainException):
    pass
