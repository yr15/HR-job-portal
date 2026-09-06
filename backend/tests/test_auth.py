from app.core.deps import require_role
from app.core.exceptions import ForbiddenError
from app.models import UserRole
from tests.factories import create_candidate, create_hr


def test_register_hr_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new-hr@test.com",
            "password": "Password123",
            "full_name": "New HR",
            "role": "HR",
            "company_name": "Test Co",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new-hr@test.com"
    assert body["role"] == "HR"
    assert body["hr_profile"]["company_name"] == "Test Co"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_candidate_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new-candidate@test.com",
            "password": "Password123",
            "full_name": "New Candidate",
            "role": "CANDIDATE",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "CANDIDATE"
    assert body["candidate_profile"]["skills"] == []


def test_register_duplicate_email_returns_409(client, db_session):
    create_candidate(db_session, email="dup@test.com")

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@test.com",
            "password": "Password123",
            "full_name": "Someone",
            "role": "CANDIDATE",
        },
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMAIL_ALREADY_REGISTERED"


def test_register_hr_missing_company_name_returns_422(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "no-company@test.com",
            "password": "Password123",
            "full_name": "Someone",
            "role": "HR",
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_register_weak_password_returns_422(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@test.com",
            "password": "short",
            "full_name": "Someone",
            "role": "CANDIDATE",
        },
    )
    assert response.status_code == 422


def test_login_success(client, db_session):
    create_candidate(db_session, email="login@test.com", password="Password123")

    response = client.post(
        "/api/v1/auth/login", json={"email": "login@test.com", "password": "Password123"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "login@test.com"


def test_login_wrong_password_returns_401(client, db_session):
    create_candidate(db_session, email="login2@test.com", password="Password123")

    response = client.post(
        "/api/v1/auth/login", json={"email": "login2@test.com", "password": "WrongPass1"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_nonexistent_email_returns_401(client):
    response = client.post(
        "/api/v1/auth/login", json={"email": "ghost@test.com", "password": "Password123"}
    )
    assert response.status_code == 401


def test_login_inactive_user_returns_401(client, db_session):
    create_candidate(db_session, email="inactive@test.com", password="Password123", is_active=False)

    response = client.post(
        "/api/v1/auth/login", json={"email": "inactive@test.com", "password": "Password123"}
    )
    assert response.status_code == 401


def test_me_without_token_returns_401(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token_returns_401(client):
    response = client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer garbage-token"}
    )
    assert response.status_code == 401


def test_me_with_valid_token_returns_current_user(client, db_session):
    create_candidate(db_session, email="me@test.com", password="Password123")
    login_response = client.post(
        "/api/v1/auth/login", json={"email": "me@test.com", "password": "Password123"}
    )
    token = login_response.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@test.com"


def test_require_role_allows_matching_role(db_session):
    hr_user = create_hr(db_session, email="role-hr@test.com")
    dependency = require_role(UserRole.HR)
    assert dependency(current_user=hr_user) is hr_user


def test_require_role_rejects_non_matching_role(db_session):
    candidate = create_candidate(db_session, email="role-candidate@test.com")
    dependency = require_role(UserRole.HR)
    try:
        dependency(current_user=candidate)
        assert False, "expected ForbiddenError"
    except ForbiddenError:
        pass
