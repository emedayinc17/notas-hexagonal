# Shared Common - Database utils
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from .config import Settings

Base = declarative_base()


def create_db_engine(database_url: str, echo: bool = False):
    """Crea el engine de SQLAlchemy"""
    return create_engine(
        database_url,
        echo=echo,
        pool_pre_ping=True,
        pool_recycle=3600,
    )


def create_session_factory(engine):
    """Crea el session factory"""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db_session(session_factory) -> Generator[Session, None, None]:
    """Dependency para obtener sesión de BD"""
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
