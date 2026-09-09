"""
Technical Services Layer -- Persistence.

Per layered_architecture.md, all data-storage responsibilities live here.
No other layer should import sqlite3/sqlalchemy directly -- they go through
this module's `get_session` dependency.
"""
from sqlmodel import SQLModel, Session, create_engine
from app.config import DATABASE_URL

# check_same_thread is a SQLite-only connect arg (it tells SQLite to allow
# the connection to be used across FastAPI's worker threads). Postgres/
# psycopg2 doesn't accept it, so only pass it when we're actually on SQLite.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
    """Create all tables. Safe to call repeatedly (no-op if tables exist)."""
    # Import models so SQLModel's metadata knows about them before create_all.
    from app.domain import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency that yields a DB session per-request."""
    with Session(engine) as session:
        yield session
