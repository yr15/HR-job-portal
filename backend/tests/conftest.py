import os

import psycopg2

TEST_DB_HOST = os.environ.get("TEST_DB_HOST", "localhost")
TEST_DB_PORT = os.environ.get("TEST_DB_PORT", "5433")
TEST_DB_USER = os.environ.get("POSTGRES_USER", "hirehub")
TEST_DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "change_me")
TEST_DB_NAME = os.environ.get("TEST_DB_NAME", "hirehub_test")
ADMIN_DB_NAME = os.environ.get("POSTGRES_DB", "hirehub")

os.environ.setdefault(
    "DATABASE_URL",
    f"postgresql+psycopg2://{TEST_DB_USER}:{TEST_DB_PASSWORD}@{TEST_DB_HOST}:{TEST_DB_PORT}/{TEST_DB_NAME}",
)
os.environ.setdefault("SECRET_KEY", "test-secret-key")


def _ensure_test_database_exists() -> None:
    conn = psycopg2.connect(
        host=TEST_DB_HOST, port=TEST_DB_PORT, user=TEST_DB_USER, password=TEST_DB_PASSWORD, dbname=ADMIN_DB_NAME
    )
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB_NAME,))
            if cur.fetchone() is None:
                cur.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        conn.close()


_ensure_test_database_exists()

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import Base, get_db
from app.main import app

engine = create_engine(settings.database_url)
TestSessionLocal = sessionmaker(bind=engine, join_transaction_mode="create_savepoint")


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth_header(user) -> dict[str, str]:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}
