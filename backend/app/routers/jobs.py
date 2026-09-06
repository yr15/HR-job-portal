import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user_optional, require_role
from app.db.session import get_db
from app.models import Application, ApplicationStatus, EmploymentType, Job, User, UserRole
from app.schemas.application import ApplicationOut, ApplyRequest
from app.schemas.job import JobCreateRequest, JobOut, JobStatusUpdateRequest, JobUpdateRequest
from app.schemas.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Page
from app.services.application_service import apply_to_job, list_job_applicants
from app.services.job_service import (
    create_job,
    get_job_detail,
    search_jobs,
    set_job_status,
    update_job,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create(
    payload: JobCreateRequest,
    db: Session = Depends(get_db),
    hr_user: User = Depends(require_role(UserRole.HR)),
) -> Job:
    return create_job(db, hr_user, payload)


@router.get("", response_model=Page[JobOut])
def search(
    db: Session = Depends(get_db),
    q: str | None = None,
    skills: list[str] = Query(default=[]),
    location: str | None = None,
    employment_type: EmploymentType | None = None,
    experience_years: float | None = Query(default=None, ge=0, le=50),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> Page[JobOut]:
    items, total = search_jobs(
        db,
        q=q,
        skills=skills,
        location=location,
        employment_type=employment_type,
        experience_years=experience_years,
        page=page,
        page_size=page_size,
    )
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{job_id}", response_model=JobOut)
def get_detail(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> Job:
    return get_job_detail(db, job_id, current_user)


@router.patch("/{job_id}", response_model=JobOut)
def update(
    job_id: uuid.UUID,
    payload: JobUpdateRequest,
    db: Session = Depends(get_db),
    hr_user: User = Depends(require_role(UserRole.HR)),
) -> Job:
    return update_job(db, job_id, hr_user, payload)


@router.patch("/{job_id}/status", response_model=JobOut)
def update_status(
    job_id: uuid.UUID,
    payload: JobStatusUpdateRequest,
    db: Session = Depends(get_db),
    hr_user: User = Depends(require_role(UserRole.HR)),
) -> Job:
    return set_job_status(db, job_id, hr_user, payload.is_active)


@router.post("/{job_id}/apply", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def apply(
    job_id: uuid.UUID,
    payload: ApplyRequest,
    db: Session = Depends(get_db),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
) -> Application:
    return apply_to_job(db, candidate_user, job_id, payload)


@router.get("/{job_id}/applications", response_model=Page[ApplicationOut])
def applicants(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    hr_user: User = Depends(require_role(UserRole.HR)),
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    q: str | None = None,
    min_experience: float | None = Query(default=None, ge=0, le=60),
    max_experience: float | None = Query(default=None, ge=0, le=60),
    skills: list[str] = Query(default=[]),
    location: str | None = None,
    ratings: list[int] = Query(default=[]),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> Page[ApplicationOut]:
    items, total = list_job_applicants(
        db,
        hr_user,
        job_id,
        status=status_filter,
        q=q,
        min_experience=min_experience,
        max_experience=max_experience,
        skills=skills,
        location=location,
        ratings=ratings,
        page=page,
        page_size=page_size,
    )
    return Page(items=items, total=total, page=page, page_size=page_size)
