import logging
import uuid

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models import (
    Application,
    ApplicationStatus,
    CandidateProfile,
    Job,
    User,
    UserRole,
)
from app.schemas.application import ApplyRequest
from app.services.job_service import get_owned_job

logger = logging.getLogger(__name__)


def _application_query(db: Session):
    return db.query(Application).options(
        joinedload(Application.job).joinedload(Job.hr).joinedload(User.hr_profile),
        joinedload(Application.candidate).joinedload(User.candidate_profile),
    )


def apply_to_job(db: Session, candidate_user: User, job_id: uuid.UUID, payload: ApplyRequest) -> Application:
    job = db.get(Job, job_id)
    if job is None:
        raise NotFoundError("Job not found")
    if not job.is_active:
        raise ConflictError("This job is no longer accepting applications", code="JOB_INACTIVE")

    application = Application(
        job_id=job_id, candidate_id=candidate_user.id, cover_note=payload.cover_note
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError("You have already applied to this job", code="DUPLICATE_APPLICATION") from None

    logger.info("Candidate %s applied to job %s", candidate_user.id, job_id)
    return _application_query(db).filter(Application.id == application.id).one()


def list_my_applications(
    db: Session,
    candidate_user: User,
    *,
    status: ApplicationStatus | None,
    job_id: uuid.UUID | None = None,
    page: int,
    page_size: int,
) -> tuple[list[Application], int]:
    query = _application_query(db).filter(Application.candidate_id == candidate_user.id)
    if status is not None:
        query = query.filter(Application.status == status)
    if job_id is not None:
        query = query.filter(Application.job_id == job_id)

    total = query.order_by(None).count()
    items = (
        query.order_by(Application.applied_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_job_applicants(
    db: Session,
    hr_user: User,
    job_id: uuid.UUID,
    *,
    status: ApplicationStatus | None,
    q: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Application], int]:
    get_owned_job(db, job_id, hr_user)

    query = _application_query(db).filter(Application.job_id == job_id)
    if status is not None:
        query = query.filter(Application.status == status)
    if q:
        query = query.join(User, Application.candidate_id == User.id).join(
            CandidateProfile, CandidateProfile.user_id == User.id
        )
        like = f"%{q}%"
        query = query.filter(
            or_(
                User.full_name.ilike(like),
                func.array_to_string(CandidateProfile.skills, ",").ilike(like),
            )
        )

    total = query.order_by(None).count()
    items = (
        query.order_by(Application.applied_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def _assert_can_view_application(current_user: User, application: Application) -> None:
    is_owning_candidate = (
        current_user.role == UserRole.CANDIDATE and application.candidate_id == current_user.id
    )
    is_owning_hr = current_user.role == UserRole.HR and application.job.hr_id == current_user.id
    if not (is_owning_candidate or is_owning_hr):
        raise ForbiddenError("You do not have permission to view this application")


def get_application_detail(db: Session, current_user: User, application_id: uuid.UUID) -> Application:
    application = _application_query(db).filter(Application.id == application_id).first()
    if application is None:
        raise NotFoundError("Application not found")
    _assert_can_view_application(current_user, application)
    return application


def update_application_status(
    db: Session, hr_user: User, application_id: uuid.UUID, new_status: ApplicationStatus
) -> Application:
    application = _application_query(db).filter(Application.id == application_id).first()
    if application is None:
        raise NotFoundError("Application not found")
    if application.job.hr_id != hr_user.id:
        raise ForbiddenError("You do not have permission to manage this application")

    application.status = new_status
    db.commit()
    db.refresh(application)
    logger.info("Application %s status set to %s by HR %s", application.id, new_status.value, hr_user.id)
    return application
