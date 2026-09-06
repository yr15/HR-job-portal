import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models import User, UserRole
from app.schemas.message import BulkMessageRequest, BulkMessageResponse, MessageOut
from app.schemas.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Page
from app.services.message_service import (
    get_unread_count,
    list_my_messages,
    mark_message_read,
    send_bulk_message,
)

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/bulk", response_model=BulkMessageResponse, status_code=status.HTTP_201_CREATED)
def bulk_send(
    payload: BulkMessageRequest,
    db: Session = Depends(get_db),
    hr_user: User = Depends(require_role(UserRole.HR)),
) -> BulkMessageResponse:
    sent_count = send_bulk_message(db, hr_user, payload.candidate_ids, payload.subject, payload.body)
    return BulkMessageResponse(sent_count=sent_count)


@router.get("/me", response_model=Page[MessageOut])
def my_messages(
    db: Session = Depends(get_db),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> Page[MessageOut]:
    items, total = list_my_messages(db, candidate_user, page=page, page_size=page_size)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/me/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
) -> dict[str, int]:
    return {"unread_count": get_unread_count(db, candidate_user)}


@router.patch("/{message_id}/read", response_model=MessageOut)
def mark_read(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    candidate_user: User = Depends(require_role(UserRole.CANDIDATE)),
) -> MessageOut:
    return mark_message_read(db, candidate_user, message_id)
