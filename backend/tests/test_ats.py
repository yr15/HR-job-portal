from app.core.ats import compute_ats_score, score_to_stars
from tests.factories import create_candidate, create_hr, create_job


def test_strong_skill_and_experience_match_scores_highly(db_session):
    hr_user = create_hr(db_session)
    job = create_job(
        db_session,
        hr_user=hr_user,
        title="Backend Engineer",
        description="Build REST APIs using Python and FastAPI with PostgreSQL.",
        skills=["Python", "FastAPI", "PostgreSQL"],
        min_experience_years=2,
        max_experience_years=5,
    )
    candidate = create_candidate(
        db_session,
        headline="Backend Engineer",
        skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        total_experience_years=3,
    )

    score = compute_ats_score(job, candidate.candidate_profile)

    assert score >= 60
    assert score_to_stars(score) >= 4


def test_no_skill_overlap_scores_lower_than_full_overlap(db_session):
    hr_user = create_hr(db_session)
    job = create_job(
        db_session,
        hr_user=hr_user,
        title="Frontend Engineer",
        description="Build UI with React and TypeScript.",
        skills=["React", "TypeScript"],
        min_experience_years=1,
        max_experience_years=3,
    )
    matching = create_candidate(
        db_session, email="cand-match@test.com", skills=["React", "TypeScript"], total_experience_years=2
    )
    mismatched = create_candidate(
        db_session, email="cand-mismatch@test.com", skills=["Java", "Spring"], total_experience_years=2
    )

    match_score = compute_ats_score(job, matching.candidate_profile)
    mismatch_score = compute_ats_score(job, mismatched.candidate_profile)

    assert match_score > mismatch_score


def test_experience_outside_range_reduces_score(db_session):
    hr_user = create_hr(db_session)
    job = create_job(
        db_session,
        hr_user=hr_user,
        skills=["Python"],
        min_experience_years=5,
        max_experience_years=8,
    )
    junior = create_candidate(
        db_session, email="cand-junior@test.com", skills=["Python"], total_experience_years=0.5
    )
    senior = create_candidate(
        db_session, email="cand-senior@test.com", skills=["Python"], total_experience_years=6
    )

    junior_score = compute_ats_score(job, junior.candidate_profile)
    senior_score = compute_ats_score(job, senior.candidate_profile)

    assert senior_score > junior_score


def test_no_profile_scores_zero(db_session):
    hr_user = create_hr(db_session)
    job = create_job(db_session, hr_user=hr_user)

    assert compute_ats_score(job, None) == 0.0


def test_score_to_stars_bucketing():
    assert score_to_stars(85) == 5
    assert score_to_stars(65) == 4
    assert score_to_stars(45) == 3
    assert score_to_stars(25) == 2
    assert score_to_stars(5) == 1
