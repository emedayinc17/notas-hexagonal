# Notas Service - Domain Exceptions
from shared.common import DomainException


class NotaNotFoundException(DomainException):
    pass


class TipoEvaluacionNotFoundException(DomainException):
    pass


class InvalidNotaException(DomainException):
    pass
