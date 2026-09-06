import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models import Application, ApplicationStatus, User, UserRole
from app.schemas.application import ApplicationOut, ApplicationStatusUpdateRequest
from app.schemas.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Page
from app.services.application_service import (
    get_application_detail,
    list_my_applications,
    update_application_status,
)

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/me", response_model=Page[ApplicationOut])
def my_applications(
    db: Session = Depends(get_db),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> Page[ApplicationOut]:
    items, total = list_my_applications(
        db, candidate_user, status=status_filter, page=page, page_size=page_size
    )
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{application_id}", response_model=ApplicationOut)
def get_detail(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Application:
    return get_application_detail(db, current_user, application_id)


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_status(
    application_id: uuid.UUID,
    payload: ApplicationStatusUpdateRequest,
    db: Session = Depends(get_db),
    hr_user: User = Depends(require_role(UserRole.HR)),
) -> Application:
    return update_application_status(db, hr_user, application_id, payload.status)
