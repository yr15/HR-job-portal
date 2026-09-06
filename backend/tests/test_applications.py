from app.models import ApplicationStatus
from tests.conftest import auth_header
from tests.factories import create_application, create_candidate, create_hr, create_job


def test_candidate_can_apply_to_active_job(client, db_session):
    hr_user = create_hr(db_session, email="hr-apply@test.com")
    candidate = create_candidate(db_session, email="cand-apply@test.com")
    job = create_job(db_session, hr_user=hr_user)

    response = client.post(
        f"/api/v1/jobs/{job.id}/apply",
        json={"cover_note": "I would love to join"},
        headers=auth_header(candidate),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "APPLIED"
    assert body["job"]["id"] == str(job.id)
    assert body["candidate"]["id"] == str(candidate.id)


def test_duplicate_application_returns_409(client, db_session):
    hr_user = create_hr(db_session, email="hr-dup@test.com")
    candidate = create_candidate(db_session, email="cand-dup@test.com")
    job = create_job(db_session, hr_user=hr_user)
    create_application(db_session, job=job, candidate_user=candidate)

    response = client.post(f"/api/v1/jobs/{job.id}/apply", json={}, headers=auth_header(candidate))

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "DUPLICATE_APPLICATION"


def test_apply_to_inactive_job_returns_409(client, db_session):
    hr_user = create_hr(db_session, email="hr-inactive@test.com")
    candidate = create_candidate(db_session, email="cand-inactive@test.com")
    job = create_job(db_session, hr_user=hr_user, is_active=False)

    response = client.post(f"/api/v1/jobs/{job.id}/apply", json={}, headers=auth_header(candidate))

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "JOB_INACTIVE"


def test_apply_to_nonexistent_job_returns_404(client, db_session):
    candidate = create_candidate(db_session, email="cand-404@test.com")

    response = client.post(
        "/api/v1/jobs/00000000-0000-0000-0000-000000000000/apply",
        json={},
        headers=auth_header(candidate),
    )

    assert response.status_code == 404


def test_hr_cannot_apply_to_job(client, db_session):
    hr_user = create_hr(db_session, email="hr-selfapply@test.com")
    job = create_job(db_session, hr_user=hr_user)

    response = client.post(f"/api/v1/jobs/{job.id}/apply", json={}, headers=auth_header(hr_user))

    assert response.status_code == 403


def test_candidate_sees_only_own_applications(client, db_session):
    hr_user = create_hr(db_session, email="hr-myapps@test.com")
    candidate = create_candidate(db_session, email="cand-myapps@test.com")
    other_candidate = create_candidate(db_session, email="cand-other@test.com")
    job = create_job(db_session, hr_user=hr_user)
    create_application(db_session, job=job, candidate_user=candidate)
    job2 = create_job(db_session, hr_user=hr_user, title="Second Job")
    create_application(db_session, job=job2, candidate_user=other_candidate)

    response = client.get("/api/v1/applications/me", headers=auth_header(candidate))

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["job"]["title"] == job.title


def test_candidate_filters_own_applications_by_status(client, db_session):
    hr_user = create_hr(db_session, email="hr-filterapps@test.com")
    candidate = create_candidate(db_session, email="cand-filterapps@test.com")
    job1 = create_job(db_session, hr_user=hr_user, title="Job A")
    job2 = create_job(db_session, hr_user=hr_user, title="Job B")
    create_application(db_session, job=job1, candidate_user=candidate, status=ApplicationStatus.SHORTLISTED)
    create_application(db_session, job=job2, candidate_user=candidate, status=ApplicationStatus.APPLIED)

    response = client.get(
        "/api/v1/applications/me", params={"status": "SHORTLISTED"}, headers=auth_header(candidate)
    )

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["job"]["title"] == "Job A"


def test_hr_sees_applicants_for_own_job(client, db_session):
    hr_user = create_hr(db_session, email="hr-applicants@test.com")
    candidate = create_candidate(db_session, email="cand-applicant1@test.com", full_name="Alice Applicant")
    job = create_job(db_session, hr_user=hr_user)
    create_application(db_session, job=job, candidate_user=candidate)

    response = client.get(f"/api/v1/jobs/{job.id}/applications", headers=auth_header(hr_user))

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["candidate"]["full_name"] == "Alice Applicant"


def test_hr_cannot_see_applicants_for_another_hrs_job(client, db_session):
    owner = create_hr(db_session, email="hr-appowner@test.com")
    other = create_hr(db_session, email="hr-appother@test.com", company_name="Other Co")
    candidate = create_candidate(db_session, email="cand-applicant2@test.com")
    job = create_job(db_session, hr_user=owner)
    create_application(db_session, job=job, candidate_user=candidate)

    response = client.get(f"/api/v1/jobs/{job.id}/applications", headers=auth_header(other))

    assert response.status_code == 403


def test_hr_updates_application_status(client, db_session):
    hr_user = create_hr(db_session, email="hr-updatestatus@test.com")
    candidate = create_candidate(db_session, email="cand-updatestatus@test.com")
    job = create_job(db_session, hr_user=hr_user)
    application = create_application(db_session, job=job, candidate_user=candidate)

    response = client.patch(
        f"/api/v1/applications/{application.id}/status",
        json={"status": "SHORTLISTED"},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "SHORTLISTED"


def test_non_owner_hr_cannot_update_application_status(client, db_session):
    owner = create_hr(db_session, email="hr-statusowner@test.com")
    other = create_hr(db_session, email="hr-statusother@test.com", company_name="Other Co")
    candidate = create_candidate(db_session, email="cand-statustarget@test.com")
    job = create_job(db_session, hr_user=owner)
    application = create_application(db_session, job=job, candidate_user=candidate)

    response = client.patch(
        f"/api/v1/applications/{application.id}/status",
        json={"status": "SHORTLISTED"},
        headers=auth_header(other),
    )

    assert response.status_code == 403


def test_status_update_rejects_applied_value(client, db_session):
    hr_user = create_hr(db_session, email="hr-badstatus@test.com")
    candidate = create_candidate(db_session, email="cand-badstatus@test.com")
    job = create_job(db_session, hr_user=hr_user)
    application = create_application(db_session, job=job, candidate_user=candidate)

    response = client.patch(
        f"/api/v1/applications/{application.id}/status",
        json={"status": "APPLIED"},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 422


def test_application_detail_visible_to_owning_candidate(client, db_session):
    hr_user = create_hr(db_session, email="hr-detailcand@test.com")
    candidate = create_candidate(db_session, email="cand-detailcand@test.com")
    job = create_job(db_session, hr_user=hr_user)
    application = create_application(db_session, job=job, candidate_user=candidate)

    response = client.get(f"/api/v1/applications/{application.id}", headers=auth_header(candidate))

    assert response.status_code == 200


def test_application_detail_hidden_from_other_candidate(client, db_session):
    hr_user = create_hr(db_session, email="hr-detailhide@test.com")
    candidate = create_candidate(db_session, email="cand-detailhide@test.com")
    other_candidate = create_candidate(db_session, email="cand-detailother@test.com")
    job = create_job(db_session, hr_user=hr_user)
    application = create_application(db_session, job=job, candidate_user=candidate)

    response = client.get(f"/api/v1/applications/{application.id}", headers=auth_header(other_candidate))

    assert response.status_code == 403


def test_application_detail_not_found(client, db_session):
    candidate = create_candidate(db_session, email="cand-detail404@test.com")

    response = client.get(
        "/api/v1/applications/00000000-0000-0000-0000-000000000000", headers=auth_header(candidate)
    )

    assert response.status_code == 404
