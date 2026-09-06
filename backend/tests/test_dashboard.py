from app.models import ApplicationStatus
from tests.conftest import auth_header
from tests.factories import create_application, create_candidate, create_hr, create_job


def test_dashboard_stats_scoped_to_own_jobs(client, db_session):
    hr_user = create_hr(db_session, email="hr-dash@test.com")
    other_hr = create_hr(db_session, email="hr-dash-other@test.com", company_name="Other Co")
    candidate = create_candidate(db_session, email="cand-dash@test.com")

    job1 = create_job(db_session, hr_user=hr_user, title="Dash Job 1")
    create_job(db_session, hr_user=hr_user, title="Dash Job 2", is_active=False)
    create_application(db_session, job=job1, candidate_user=candidate, status=ApplicationStatus.SHORTLISTED)
    create_application(
        db_session,
        job=create_job(db_session, hr_user=other_hr, title="Other HR Job"),
        candidate_user=candidate,
    )

    response = client.get("/api/v1/hr/dashboard/stats", headers=auth_header(hr_user))

    assert response.status_code == 200
    body = response.json()
    assert body["total_jobs"] == 2
    assert body["active_jobs"] == 1
    assert body["total_applications"] == 1
    assert body["shortlisted_count"] == 1
    assert body["applied_count"] == 0

    trend = body["applications_by_day"]
    assert len(trend) == 14
    assert trend[-1]["count"] == 1
    assert sum(day["count"] for day in trend) == 1


def test_candidate_cannot_access_dashboard_stats(client, db_session):
    candidate = create_candidate(db_session, email="cand-nodash@test.com")

    response = client.get("/api/v1/hr/dashboard/stats", headers=auth_header(candidate))

    assert response.status_code == 403


def test_candidate_stats_scoped_to_own_applications(client, db_session):
    hr_user = create_hr(db_session, email="hr-candstats@test.com")
    candidate = create_candidate(db_session, email="cand-stats@test.com")
    other_candidate = create_candidate(db_session, email="cand-stats-other@test.com")

    job1 = create_job(db_session, hr_user=hr_user, title="Stats Job 1")
    job2 = create_job(db_session, hr_user=hr_user, title="Stats Job 2")
    job3 = create_job(db_session, hr_user=hr_user, title="Stats Job 3")
    create_application(db_session, job=job1, candidate_user=candidate, status=ApplicationStatus.APPLIED)
    create_application(db_session, job=job2, candidate_user=candidate, status=ApplicationStatus.SHORTLISTED)
    create_application(db_session, job=job3, candidate_user=other_candidate, status=ApplicationStatus.REJECTED)

    response = client.get("/api/v1/candidates/me/stats", headers=auth_header(candidate))

    assert response.status_code == 200
    body = response.json()
    assert body["total_applications"] == 2
    assert body["applied_count"] == 1
    assert body["shortlisted_count"] == 1
    assert body["rejected_count"] == 0


def test_hr_cannot_access_candidate_stats(client, db_session):
    hr_user = create_hr(db_session, email="hr-nocandstats@test.com")

    response = client.get("/api/v1/candidates/me/stats", headers=auth_header(hr_user))

    assert response.status_code == 403
