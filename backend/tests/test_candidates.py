from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr


def test_candidate_can_view_own_profile(client, db_session):
    candidate = create_candidate(db_session, email="cand-me@test.com", headline="Engineer")

    response = client.get("/api/v1/candidates/me", headers=auth_header(candidate))

    assert response.status_code == 200
    assert response.json()["candidate_profile"]["headline"] == "Engineer"


def test_candidate_can_update_own_profile(client, db_session):
    candidate = create_candidate(db_session, email="cand-update@test.com")

    response = client.patch(
        "/api/v1/candidates/me",
        json={"headline": "Staff Engineer", "skills": ["Python", "Go"], "total_experience_years": 5},
        headers=auth_header(candidate),
    )

    assert response.status_code == 200
    profile = response.json()["candidate_profile"]
    assert profile["headline"] == "Staff Engineer"
    assert profile["skills"] == ["Python", "Go"]
    assert profile["total_experience_years"] == 5


def test_candidate_partial_update_preserves_other_fields(client, db_session):
    candidate = create_candidate(
        db_session, email="cand-partial@test.com", headline="Original Headline", location="Pune"
    )

    response = client.patch(
        "/api/v1/candidates/me",
        json={"headline": "Updated Headline"},
        headers=auth_header(candidate),
    )

    profile = response.json()["candidate_profile"]
    assert profile["headline"] == "Updated Headline"
    assert profile["location"] == "Pune"


def test_hr_cannot_access_candidate_me(client, db_session):
    hr_user = create_hr(db_session, email="hr-notme@test.com")

    response = client.get("/api/v1/candidates/me", headers=auth_header(hr_user))

    assert response.status_code == 403


def test_hr_can_search_candidate_directory(client, db_session):
    hr_user = create_hr(db_session, email="hr-directory@test.com")
    create_candidate(
        db_session,
        email="cand-dir1@test.com",
        full_name="Dana Directory",
        skills=["Python", "Django"],
        location="Bangalore",
        total_experience_years=4,
    )
    create_candidate(
        db_session,
        email="cand-dir2@test.com",
        full_name="Rae React",
        skills=["React"],
        location="Pune",
        total_experience_years=2,
    )

    response = client.get("/api/v1/candidates", params={"skills": "Python"}, headers=auth_header(hr_user))

    body = response.json()
    names = [c["full_name"] for c in body["items"]]
    assert "Dana Directory" in names


def test_hr_filters_directory_by_experience_range(client, db_session):
    hr_user = create_hr(db_session, email="hr-directoryexp@test.com")
    create_candidate(
        db_session, email="cand-junior@test.com", full_name="Junior Candidate", total_experience_years=1
    )
    create_candidate(
        db_session, email="cand-senior@test.com", full_name="Senior Candidate", total_experience_years=8
    )

    response = client.get(
        "/api/v1/candidates",
        params={"min_experience": 5, "max_experience": 10},
        headers=auth_header(hr_user),
    )

    names = [c["full_name"] for c in response.json()["items"]]
    assert names == ["Senior Candidate"]
    assert "Rae React" not in names


def test_candidate_directory_listing_omits_contact_info(client, db_session):
    hr_user = create_hr(db_session, email="hr-directory2@test.com")
    create_candidate(db_session, email="cand-dir3@test.com", full_name="Priv Acy")

    response = client.get("/api/v1/candidates", headers=auth_header(hr_user))

    item = response.json()["items"][0]
    assert "email" not in item
    assert "phone" not in item


def test_candidate_cannot_access_directory(client, db_session):
    candidate = create_candidate(db_session, email="cand-nodirectory@test.com")

    response = client.get("/api/v1/candidates", headers=auth_header(candidate))

    assert response.status_code == 403


def test_hr_can_view_candidate_detail_with_contact_info(client, db_session):
    hr_user = create_hr(db_session, email="hr-canddetail@test.com")
    candidate = create_candidate(db_session, email="cand-detailview@test.com", full_name="Contact Visible")

    response = client.get(f"/api/v1/candidates/{candidate.id}", headers=auth_header(hr_user))

    assert response.status_code == 200
    assert response.json()["email"] == "cand-detailview@test.com"


def test_candidate_detail_not_found(client, db_session):
    hr_user = create_hr(db_session, email="hr-canddetail404@test.com")

    response = client.get(
        "/api/v1/candidates/00000000-0000-0000-0000-000000000000", headers=auth_header(hr_user)
    )

    assert response.status_code == 404
