import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models import User, UserRole
from app.schemas.candidate import CandidateListItemOut, CandidateProfileUpdateRequest
from app.schemas.dashboard import CandidateStatsOut
from app.schemas.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Page
from app.schemas.user import UserOut
from app.services.candidate_service import get_candidate_detail, search_candidates, update_own_profile
from app.services.dashboard_service import get_candidate_stats

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("/me", response_model=UserOut)
def get_my_profile(candidate_user: User = Depends(require_role(UserRole.CANDIDATE))) -> User:
    return candidate_user


@router.patch("/me", response_model=UserOut)
def update_my_profile(
    payload: CandidateProfileUpdateRequest,
    db: Session = Depends(get_db),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
) -> User:
    return update_own_profile(db, candidate_user, payload)


@router.get("/me/stats", response_model=CandidateStatsOut)
def get_my_stats(
    db: Session = Depends(get_db),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
) -> CandidateStatsOut:
    return get_candidate_stats(db, candidate_user)


@router.get("", response_model=Page[CandidateListItemOut])
def directory(
    db: Session = Depends(get_db),
    _hr_user: User = Depends(require_role(UserRole.HR)),
    q: str | None = None,
    skills: list[str] = Query(default=[]),
    location: str | None = None,
    min_experience: float | None = Query(default=None, ge=0, le=60),
    max_experience: float | None = Query(default=None, ge=0, le=60),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> Page[CandidateListItemOut]:
    items, total = search_candidates(
        db,
        q=q,
        skills=skills,
        location=location,
        min_experience=min_experience,
        max_experience=max_experience,
        page=page,
        page_size=page_size,
    )
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{candidate_id}", response_model=UserOut)
def get_detail(
    candidate_id: uuid.UUID,
    db: Session = Depends(get_db),
    _hr_user: User = Depends(require_role(UserRole.HR)),
) -> User:
    return get_candidate_detail(db, candidate_id)
