import logging
import uuid

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundError
from app.models import CandidateProfile, User, UserRole
from app.schemas.candidate import CandidateListItemOut, CandidateProfileUpdateRequest

logger = logging.getLogger(__name__)


def _to_list_item(user: User) -> CandidateListItemOut:
    profile = user.candidate_profile
    return CandidateListItemOut(
        id=user.id,
        full_name=user.full_name,
        headline=profile.headline if profile else None,
        total_experience_years=profile.total_experience_years if profile else None,
        skills=profile.skills if profile else [],
        location=profile.location if profile else None,
    )


def update_own_profile(db: Session, candidate_user: User, payload: CandidateProfileUpdateRequest) -> User:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(candidate_user.candidate_profile, field, value)
    db.commit()
    db.refresh(candidate_user)
    logger.info("Candidate profile updated: %s", candidate_user.id)
    return candidate_user


def get_candidate_detail(db: Session, candidate_id: uuid.UUID) -> User:
    candidate = (
        db.query(User)
        .options(joinedload(User.candidate_profile))
        .filter(User.id == candidate_id, User.role == UserRole.CANDIDATE)
        .first()
    )
    if candidate is None:
        raise NotFoundError("Candidate not found")
    return candidate


def search_candidates(
    db: Session,
    *,
    q: str | None,
    skills: list[str] | None,
    location: str | None,
    min_experience: float | None,
    max_experience: float | None,
    page: int,
    page_size: int,
) -> tuple[list[CandidateListItemOut], int]:
    query = (
        db.query(User)
        .join(CandidateProfile, CandidateProfile.user_id == User.id)
        .options(joinedload(User.candidate_profile))
        .filter(User.role == UserRole.CANDIDATE)
    )

    if q:
        like = f"%{q}%"
        query = query.filter(or_(User.full_name.ilike(like), CandidateProfile.headline.ilike(like)))
    if location:
        query = query.filter(CandidateProfile.location.ilike(f"%{location}%"))
    if skills:
        for skill in skills:
            query = query.filter(
                func.array_to_string(CandidateProfile.skills, ",").ilike(f"%{skill}%")
            )
    if min_experience is not None:
        query = query.filter(CandidateProfile.total_experience_years >= min_experience)
    if max_experience is not None:
        query = query.filter(CandidateProfile.total_experience_years <= max_experience)

    total = query.order_by(None).count()
    items = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_to_list_item(user) for user in items], total
