from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr, create_job

VALID_JOB_PAYLOAD = {
    "title": "Backend Engineer",
    "description": "Design and build REST APIs using Python and FastAPI for our product team.",
    "location": "Bangalore",
    "employment_type": "FULL_TIME",
    "skills": ["Python", "FastAPI"],
    "min_experience_years": 2,
    "max_experience_years": 5,
}


def test_hr_can_create_job(client, db_session):
    hr_user = create_hr(db_session, email="hr-create@test.com")

    response = client.post("/api/v1/jobs", json=VALID_JOB_PAYLOAD, headers=auth_header(hr_user))

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Backend Engineer"
    assert body["is_active"] is True
    assert body["company_name"] == "Acme Inc"


def test_candidate_cannot_create_job(client, db_session):
    candidate = create_candidate(db_session, email="cand-create@test.com")

    response = client.post("/api/v1/jobs", json=VALID_JOB_PAYLOAD, headers=auth_header(candidate))

    assert response.status_code == 403


def test_create_job_validation_error(client, db_session):
    hr_user = create_hr(db_session, email="hr-invalid@test.com")
    bad_payload = {**VALID_JOB_PAYLOAD, "title": "AB"}

    response = client.post("/api/v1/jobs", json=bad_payload, headers=auth_header(hr_user))

    assert response.status_code == 422


def test_search_returns_only_active_jobs(client, db_session):
    hr_user = create_hr(db_session, email="hr-search@test.com")
    create_job(db_session, hr_user=hr_user, title="Active Job A")
    create_job(db_session, hr_user=hr_user, title="Inactive Job B", is_active=False)

    response = client.get("/api/v1/jobs")

    assert response.status_code == 200
    titles = [job["title"] for job in response.json()["items"]]
    assert "Active Job A" in titles
    assert "Inactive Job B" not in titles


def test_search_filters_by_skill(client, db_session):
    hr_user = create_hr(db_session, email="hr-skill@test.com")
    create_job(db_session, hr_user=hr_user, title="Python Role", skills=["Python", "Django"])
    create_job(db_session, hr_user=hr_user, title="React Role", skills=["React", "TypeScript"])

    response = client.get("/api/v1/jobs", params={"skills": "Python"})

    titles = [job["title"] for job in response.json()["items"]]
    assert titles == ["Python Role"]


def test_search_filters_by_experience_years(client, db_session):
    hr_user = create_hr(db_session, email="hr-exp@test.com")
    create_job(db_session, hr_user=hr_user, title="Junior Role", min_experience_years=0, max_experience_years=2)
    create_job(db_session, hr_user=hr_user, title="Senior Role", min_experience_years=6, max_experience_years=10)

    response = client.get("/api/v1/jobs", params={"experience_years": 1})

    titles = [job["title"] for job in response.json()["items"]]
    assert titles == ["Junior Role"]


def test_search_pagination(client, db_session):
    hr_user = create_hr(db_session, email="hr-page@test.com")
    for i in range(3):
        create_job(db_session, hr_user=hr_user, title=f"Paged Job {i}")

    response = client.get("/api/v1/jobs", params={"page": 1, "page_size": 2})
    body = response.json()

    assert len(body["items"]) == 2
    assert body["page"] == 1
    assert body["page_size"] == 2
    assert body["total"] >= 3


def test_job_detail_not_found(client):
    response = client.get("/api/v1/jobs/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_job_detail_inactive_hidden_from_public(client, db_session):
    hr_user = create_hr(db_session, email="hr-hidden@test.com")
    job = create_job(db_session, hr_user=hr_user, is_active=False)

    response = client.get(f"/api/v1/jobs/{job.id}")

    assert response.status_code == 404


def test_job_detail_inactive_visible_to_owner(client, db_session):
    hr_user = create_hr(db_session, email="hr-owner-view@test.com")
    job = create_job(db_session, hr_user=hr_user, is_active=False)

    response = client.get(f"/api/v1/jobs/{job.id}", headers=auth_header(hr_user))

    assert response.status_code == 200


def test_update_job_by_owner_succeeds(client, db_session):
    hr_user = create_hr(db_session, email="hr-update@test.com")
    job = create_job(db_session, hr_user=hr_user, title="Old Title")

    response = client.patch(
        f"/api/v1/jobs/{job.id}", json={"title": "New Title"}, headers=auth_header(hr_user)
    )

    assert response.status_code == 200
    assert response.json()["title"] == "New Title"


def test_update_job_by_non_owner_returns_403(client, db_session):
    owner = create_hr(db_session, email="hr-owner2@test.com")
    other = create_hr(db_session, email="hr-other2@test.com", company_name="Other Co")
    job = create_job(db_session, hr_user=owner)

    response = client.patch(
        f"/api/v1/jobs/{job.id}", json={"title": "Hijacked"}, headers=auth_header(other)
    )

    assert response.status_code == 403


def test_update_nonexistent_job_returns_404(client, db_session):
    hr_user = create_hr(db_session, email="hr-404@test.com")

    response = client.patch(
        "/api/v1/jobs/00000000-0000-0000-0000-000000000000",
        json={"title": "New Title"},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 404


def test_deactivate_job_by_owner_succeeds(client, db_session):
    hr_user = create_hr(db_session, email="hr-deactivate@test.com")
    job = create_job(db_session, hr_user=hr_user)

    response = client.patch(
        f"/api/v1/jobs/{job.id}/status", json={"is_active": False}, headers=auth_header(hr_user)
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_deactivate_job_by_non_owner_returns_403(client, db_session):
    owner = create_hr(db_session, email="hr-owner3@test.com")
    other = create_hr(db_session, email="hr-other3@test.com", company_name="Other Co")
    job = create_job(db_session, hr_user=owner)

    response = client.patch(
        f"/api/v1/jobs/{job.id}/status", json={"is_active": False}, headers=auth_header(other)
    )

    assert response.status_code == 403


def test_hr_jobs_list_scoped_to_own_jobs_only(client, db_session):
    hr1 = create_hr(db_session, email="hr-mine@test.com")
    hr2 = create_hr(db_session, email="hr-theirs@test.com", company_name="Other Co")
    create_job(db_session, hr_user=hr1, title="Mine Active", is_active=True)
    create_job(db_session, hr_user=hr1, title="Mine Inactive", is_active=False)
    create_job(db_session, hr_user=hr2, title="Theirs")

    response = client.get("/api/v1/hr/jobs", headers=auth_header(hr1))

    titles = {job["title"] for job in response.json()["items"]}
    assert titles == {"Mine Active", "Mine Inactive"}


def test_candidate_cannot_access_hr_jobs(client, db_session):
    candidate = create_candidate(db_session, email="cand-hrjobs@test.com")

    response = client.get("/api/v1/hr/jobs", headers=auth_header(candidate))

    assert response.status_code == 403
