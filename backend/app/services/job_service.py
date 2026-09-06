import logging
import uuid

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models import EmploymentType, Job, User
from app.schemas.job import JobCreateRequest, JobUpdateRequest
from app.schemas.pagination import DEFAULT_PAGE_SIZE

logger = logging.getLogger(__name__)


def _job_query(db: Session):
    return db.query(Job).options(joinedload(Job.hr).joinedload(User.hr_profile))


def create_job(db: Session, hr_user: User, payload: JobCreateRequest) -> Job:
    job = Job(hr_id=hr_user.id, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    logger.info("Job created: %s by HR %s", job.id, hr_user.id)
    return job


def get_owned_job(db: Session, job_id: uuid.UUID, hr_user: User) -> Job:
    job = _job_query(db).filter(Job.id == job_id).first()
    if job is None:
        raise NotFoundError("Job not found")
    if job.hr_id != hr_user.id:
        raise ForbiddenError("You do not have permission to manage this job")
    return job


def update_job(db: Session, job_id: uuid.UUID, hr_user: User, payload: JobUpdateRequest) -> Job:
    job = get_owned_job(db, job_id, hr_user)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(job, field, value)

    min_exp = job.min_experience_years
    max_exp = job.max_experience_years
    if max_exp is not None and float(max_exp) < float(min_exp):
        db.rollback()
        raise BadRequestError(
            "max_experience_years must be greater than or equal to min_experience_years",
            code="INVALID_EXPERIENCE_RANGE",
        )

    db.commit()
    db.refresh(job)
    logger.info("Job updated: %s by HR %s", job.id, hr_user.id)
    return job


def set_job_status(db: Session, job_id: uuid.UUID, hr_user: User, is_active: bool) -> Job:
    job = get_owned_job(db, job_id, hr_user)
    job.is_active = is_active
    db.commit()
    db.refresh(job)
    logger.info("Job %s set is_active=%s by HR %s", job.id, is_active, hr_user.id)
    return job


def get_job_detail(db: Session, job_id: uuid.UUID, current_user: User | None) -> Job:
    job = _job_query(db).filter(Job.id == job_id).first()
    if job is None:
        raise NotFoundError("Job not found")
    if job.is_active:
        return job
    if current_user is not None and current_user.id == job.hr_id:
        return job
    raise NotFoundError("Job not found")


def search_jobs(
    db: Session,
    *,
    q: str | None,
    skills: list[str] | None,
    location: str | None,
    employment_type: EmploymentType | None,
    experience_years: float | None,
    page: int,
    page_size: int,
) -> tuple[list[Job], int]:
    query = _job_query(db).filter(Job.is_active.is_(True))

    if q:
        like = f"%{q}%"
        query = query.filter(or_(Job.title.ilike(like), Job.description.ilike(like)))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if employment_type:
        query = query.filter(Job.employment_type == employment_type)
    if skills:
        for skill in skills:
            query = query.filter(func.array_to_string(Job.skills, ",").ilike(f"%{skill}%"))
    if experience_years is not None:
        query = query.filter(Job.min_experience_years <= experience_years).filter(
            or_(Job.max_experience_years.is_(None), Job.max_experience_years >= experience_years)
        )

    total = query.order_by(None).count()
    items = (
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_hr_jobs(
    db: Session, hr_user: User, *, page: int = 1, page_size: int = DEFAULT_PAGE_SIZE
) -> tuple[list[Job], int]:
    query = _job_query(db).filter(Job.hr_id == hr_user.id)
    total = query.order_by(None).count()
    items = (
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total
