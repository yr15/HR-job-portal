from app.core.security import hash_password
from app.models import (
    Application,
    ApplicationStatus,
    CandidateProfile,
    EmploymentType,
    HRProfile,
    Job,
    User,
    UserRole,
)


def create_hr(db, *, email="factory-hr@test.com", password="Password123", company_name="Acme Inc", is_active=True):
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name="Factory HR",
        role=UserRole.HR,
        is_active=is_active,
    )
    db.add(user)
    db.flush()
    db.add(HRProfile(user_id=user.id, company_name=company_name))
    db.commit()
    db.refresh(user)
    return user


def create_candidate(
    db,
    *,
    email="factory-candidate@test.com",
    password="Password123",
    full_name="Factory Candidate",
    is_active=True,
    headline=None,
    total_experience_years=None,
    skills=None,
    location=None,
):
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=UserRole.CANDIDATE,
        is_active=is_active,
    )
    db.add(user)
    db.flush()
    db.add(
        CandidateProfile(
            user_id=user.id,
            headline=headline,
            total_experience_years=total_experience_years,
            skills=skills or [],
            location=location,
        )
    )
    db.commit()
    db.refresh(user)
    return user


def create_job(
    db,
    *,
    hr_user,
    title="Backend Engineer",
    description="A sufficiently long description of the role and its responsibilities.",
    skills=None,
    location="Bangalore",
    employment_type=EmploymentType.FULL_TIME,
    min_experience_years=1,
    max_experience_years=5,
    is_active=True,
):
    job = Job(
        hr_id=hr_user.id,
        title=title,
        description=description,
        skills=skills or [],
        location=location,
        employment_type=employment_type,
        min_experience_years=min_experience_years,
        max_experience_years=max_experience_years,
        is_active=is_active,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def create_application(db, *, job, candidate_user, status=None, cover_note=None):
    application = Application(
        job_id=job.id,
        candidate_id=candidate_user.id,
        status=status or ApplicationStatus.APPLIED,
        cover_note=cover_note,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application
