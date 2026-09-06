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


def test_apply_without_authentication_returns_401(client, db_session):
    hr_user = create_hr(db_session, email="hr-anonapply@test.com")
    job = create_job(db_session, hr_user=hr_user)

    response = client.post(f"/api/v1/jobs/{job.id}/apply", json={})

    assert response.status_code == 401


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


def test_candidate_filters_own_applications_by_job_id(client, db_session):
    hr_user = create_hr(db_session, email="hr-jobidfilter@test.com")
    candidate = create_candidate(db_session, email="cand-jobidfilter@test.com")
    job1 = create_job(db_session, hr_user=hr_user, title="Job One")
    job2 = create_job(db_session, hr_user=hr_user, title="Job Two")
    create_application(db_session, job=job1, candidate_user=candidate)
    create_application(db_session, job=job2, candidate_user=candidate)

    response = client.get(
        "/api/v1/applications/me", params={"job_id": str(job1.id)}, headers=auth_header(candidate)
    )

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["job"]["id"] == str(job1.id)


def test_candidate_filters_own_applications_by_job_id_no_match(client, db_session):
    hr_user = create_hr(db_session, email="hr-jobidnomatch@test.com")
    candidate = create_candidate(db_session, email="cand-jobidnomatch@test.com")
    job1 = create_job(db_session, hr_user=hr_user, title="Applied Job")
    job2 = create_job(db_session, hr_user=hr_user, title="Never Applied Job")
    create_application(db_session, job=job1, candidate_user=candidate)

    response = client.get(
        "/api/v1/applications/me", params={"job_id": str(job2.id)}, headers=auth_header(candidate)
    )

    assert response.json()["total"] == 0


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


def test_hr_still_sees_applicants_after_deactivating_job(client, db_session):
    hr_user = create_hr(db_session, email="hr-applicantsclosed@test.com")
    candidate = create_candidate(db_session, email="cand-applicantclosed@test.com")
    job = create_job(db_session, hr_user=hr_user)
    create_application(db_session, job=job, candidate_user=candidate)

    deactivate_response = client.patch(
        f"/api/v1/jobs/{job.id}/status", json={"is_active": False}, headers=auth_header(hr_user)
    )
    assert deactivate_response.status_code == 200

    response = client.get(f"/api/v1/jobs/{job.id}/applications", headers=auth_header(hr_user))

    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_hr_filters_applicants_by_candidate_name(client, db_session):
    hr_user = create_hr(db_session, email="hr-applicantsearch@test.com")
    alice = create_candidate(db_session, email="cand-alice@test.com", full_name="Alice Applicant")
    bob = create_candidate(db_session, email="cand-bob@test.com", full_name="Bob Other")
    job = create_job(db_session, hr_user=hr_user)
    create_application(db_session, job=job, candidate_user=alice)
    create_application(db_session, job=job, candidate_user=bob)

    response = client.get(
        f"/api/v1/jobs/{job.id}/applications", params={"q": "Alice"}, headers=auth_header(hr_user)
    )

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["candidate"]["full_name"] == "Alice Applicant"


def test_applicants_sorted_by_ats_rating_descending(client, db_session):
    hr_user = create_hr(db_session, email="hr-atssort@test.com")
    job = create_job(
        db_session,
        hr_user=hr_user,
        title="Backend Engineer",
        description="Build APIs with Python and FastAPI.",
        skills=["Python", "FastAPI"],
        min_experience_years=1,
        max_experience_years=5,
    )
    strong_match = create_candidate(
        db_session,
        email="cand-strongmatch@test.com",
        full_name="Strong Match",
        skills=["Python", "FastAPI"],
        total_experience_years=2,
    )
    weak_match = create_candidate(
        db_session,
        email="cand-weakmatch@test.com",
        full_name="Weak Match",
        skills=["Ruby", "Rails"],
        total_experience_years=2,
    )
    create_application(db_session, job=job, candidate_user=weak_match)
    create_application(db_session, job=job, candidate_user=strong_match)

    response = client.get(f"/api/v1/jobs/{job.id}/applications", headers=auth_header(hr_user))

    names = [item["candidate"]["full_name"] for item in response.json()["items"]]
    assert names == ["Strong Match", "Weak Match"]


def test_applicants_filtered_by_rating(client, db_session):
    hr_user = create_hr(db_session, email="hr-ratingfilter@test.com")
    job = create_job(
        db_session,
        hr_user=hr_user,
        title="Backend Engineer",
        description="Build APIs with Python and FastAPI.",
        skills=["Python", "FastAPI"],
        min_experience_years=1,
        max_experience_years=5,
    )
    strong_match = create_candidate(
        db_session,
        email="cand-ratinghigh@test.com",
        full_name="High Rating",
        skills=["Python", "FastAPI"],
        total_experience_years=2,
    )
    weak_match = create_candidate(
        db_session,
        email="cand-ratinglow@test.com",
        full_name="Low Rating",
        skills=["Ruby", "Rails"],
        total_experience_years=2,
    )
    create_application(db_session, job=job, candidate_user=strong_match)
    create_application(db_session, job=job, candidate_user=weak_match)

    all_applicants = client.get(f"/api/v1/jobs/{job.id}/applications", headers=auth_header(hr_user)).json()
    high_rating = all_applicants["items"][0]["ats_rating"]

    response = client.get(
        f"/api/v1/jobs/{job.id}/applications",
        params={"ratings": high_rating},
        headers=auth_header(hr_user),
    )

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["candidate"]["full_name"] == "High Rating"


def test_applicants_filtered_by_experience_range(client, db_session):
    hr_user = create_hr(db_session, email="hr-expfilter@test.com")
    job = create_job(db_session, hr_user=hr_user)
    junior = create_candidate(
        db_session, email="cand-expjunior@test.com", full_name="Junior", total_experience_years=1
    )
    senior = create_candidate(
        db_session, email="cand-expsenior@test.com", full_name="Senior", total_experience_years=8
    )
    create_application(db_session, job=job, candidate_user=junior)
    create_application(db_session, job=job, candidate_user=senior)

    response = client.get(
        f"/api/v1/jobs/{job.id}/applications",
        params={"min_experience": 5, "max_experience": 10},
        headers=auth_header(hr_user),
    )

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["candidate"]["full_name"] == "Senior"


def test_applicants_filtered_by_location(client, db_session):
    hr_user = create_hr(db_session, email="hr-locfilter@test.com")
    job = create_job(db_session, hr_user=hr_user)
    bangalore = create_candidate(
        db_session, email="cand-bangalore@test.com", full_name="Bangalore Candidate", location="Bangalore"
    )
    pune = create_candidate(
        db_session, email="cand-pune@test.com", full_name="Pune Candidate", location="Pune"
    )
    create_application(db_session, job=job, candidate_user=bangalore)
    create_application(db_session, job=job, candidate_user=pune)

    response = client.get(
        f"/api/v1/jobs/{job.id}/applications", params={"location": "Bangalore"}, headers=auth_header(hr_user)
    )

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["candidate"]["full_name"] == "Bangalore Candidate"


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


def test_hr_bulk_shortlists_multiple_applicants(client, db_session):
    hr_user = create_hr(db_session, email="hr-bulkstatus@test.com")
    job = create_job(db_session, hr_user=hr_user)
    cand1 = create_candidate(db_session, email="cand-bulkstatus1@test.com")
    cand2 = create_candidate(db_session, email="cand-bulkstatus2@test.com")
    app1 = create_application(db_session, job=job, candidate_user=cand1)
    app2 = create_application(db_session, job=job, candidate_user=cand2)

    response = client.patch(
        "/api/v1/applications/bulk-status",
        json={"application_ids": [str(app1.id), str(app2.id)], "status": "SHORTLISTED"},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 200
    assert response.json()["updated_count"] == 2

    detail1 = client.get(f"/api/v1/applications/{app1.id}", headers=auth_header(hr_user)).json()
    detail2 = client.get(f"/api/v1/applications/{app2.id}", headers=auth_header(hr_user)).json()
    assert detail1["status"] == "SHORTLISTED"
    assert detail2["status"] == "SHORTLISTED"


def test_hr_bulk_status_excludes_other_hrs_applications(client, db_session):
    owner = create_hr(db_session, email="hr-bulkowner@test.com")
    other = create_hr(db_session, email="hr-bulkother@test.com", company_name="Other Co")
    candidate = create_candidate(db_session, email="cand-bulkexclude@test.com")
    job = create_job(db_session, hr_user=owner)
    application = create_application(db_session, job=job, candidate_user=candidate)

    response = client.patch(
        "/api/v1/applications/bulk-status",
        json={"application_ids": [str(application.id)], "status": "REJECTED"},
        headers=auth_header(other),
    )

    assert response.status_code == 200
    assert response.json()["updated_count"] == 0

    detail = client.get(f"/api/v1/applications/{application.id}", headers=auth_header(owner)).json()
    assert detail["status"] == "APPLIED"


def test_candidate_cannot_bulk_update_status(client, db_session):
    hr_user = create_hr(db_session, email="hr-bulknoaccess@test.com")
    candidate = create_candidate(db_session, email="cand-bulknoaccess@test.com")
    job = create_job(db_session, hr_user=hr_user)
    application = create_application(db_session, job=job, candidate_user=candidate)

    response = client.patch(
        "/api/v1/applications/bulk-status",
        json={"application_ids": [str(application.id)], "status": "SHORTLISTED"},
        headers=auth_header(candidate),
    )

    assert response.status_code == 403


def test_bulk_status_rejects_invalid_status_value(client, db_session):
    hr_user = create_hr(db_session, email="hr-bulkbadstatus@test.com")
    job = create_job(db_session, hr_user=hr_user)
    candidate = create_candidate(db_session, email="cand-bulkbadstatus@test.com")
    application = create_application(db_session, job=job, candidate_user=candidate)

    response = client.patch(
        "/api/v1/applications/bulk-status",
        json={"application_ids": [str(application.id)], "status": "APPLIED"},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 422


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
