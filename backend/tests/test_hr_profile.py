from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr


def test_hr_can_view_own_profile(client, db_session):
    hr_user = create_hr(db_session, email="hr-viewprofile@test.com", company_name="Acme Inc")

    response = client.get("/api/v1/hr/me", headers=auth_header(hr_user))

    assert response.status_code == 200
    assert response.json()["hr_profile"]["company_name"] == "Acme Inc"


def test_hr_can_update_own_profile(client, db_session):
    hr_user = create_hr(db_session, email="hr-updateprofile@test.com", company_name="Old Co")

    response = client.patch(
        "/api/v1/hr/me",
        json={"full_name": "New Name", "company_name": "New Co", "designation": "VP People"},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["full_name"] == "New Name"
    assert body["hr_profile"]["company_name"] == "New Co"
    assert body["hr_profile"]["designation"] == "VP People"


def test_hr_partial_update_preserves_other_fields(client, db_session):
    hr_user = create_hr(db_session, email="hr-partialupdate@test.com", company_name="Kept Co")

    response = client.patch(
        "/api/v1/hr/me", json={"designation": "New Title"}, headers=auth_header(hr_user)
    )

    body = response.json()
    assert body["hr_profile"]["company_name"] == "Kept Co"
    assert body["hr_profile"]["designation"] == "New Title"


def test_hr_cannot_blank_out_company_name(client, db_session):
    hr_user = create_hr(db_session, email="hr-blankcompany@test.com")

    response = client.patch("/api/v1/hr/me", json={"company_name": "   "}, headers=auth_header(hr_user))

    assert response.status_code == 422


def test_candidate_cannot_access_hr_profile_endpoint(client, db_session):
    candidate = create_candidate(db_session, email="cand-nohrprofile@test.com")

    response = client.get("/api/v1/hr/me", headers=auth_header(candidate))

    assert response.status_code == 403
