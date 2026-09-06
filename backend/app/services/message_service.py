import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models import Message, User, UserRole
from app.schemas.message import MessageOut

logger = logging.getLogger(__name__)


def _to_message_out(message: Message) -> MessageOut:
    sender = message.sender
    return MessageOut(
        id=message.id,
        subject=message.subject,
        body=message.body,
        sent_at=message.sent_at,
        read_at=message.read_at,
        sender_name=sender.full_name,
        sender_company=sender.hr_profile.company_name if sender.hr_profile else None,
    )


def _message_query(db: Session):
    return db.query(Message).options(joinedload(Message.sender).joinedload(User.hr_profile))


def send_bulk_message(
    db: Session, hr_user: User, candidate_ids: list[uuid.UUID], subject: str, body: str
) -> int:
    valid_ids = [
        row[0]
        for row in db.query(User.id)
        .filter(User.id.in_(candidate_ids), User.role == UserRole.CANDIDATE)
        .all()
    ]
    if not valid_ids:
        raise BadRequestError("None of the selected candidates could be found", code="NO_VALID_RECIPIENTS")

    messages = [
        Message(sender_hr_id=hr_user.id, recipient_candidate_id=candidate_id, subject=subject, body=body)
        for candidate_id in valid_ids
    ]
    db.add_all(messages)
    db.commit()
    logger.info("HR %s sent a bulk message to %d candidates", hr_user.id, len(valid_ids))
    return len(valid_ids)


def list_my_messages(
    db: Session, candidate_user: User, *, page: int, page_size: int
) -> tuple[list[MessageOut], int]:
    query = _message_query(db).filter(Message.recipient_candidate_id == candidate_user.id)
    total = query.order_by(None).count()
    items = (
        query.order_by(Message.sent_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_to_message_out(m) for m in items], total


def get_unread_count(db: Session, candidate_user: User) -> int:
    return (
        db.query(func.count(Message.id))
        .filter(Message.recipient_candidate_id == candidate_user.id, Message.read_at.is_(None))
        .scalar()
    )


def mark_message_read(db: Session, candidate_user: User, message_id: uuid.UUID) -> MessageOut:
    message = _message_query(db).filter(Message.id == message_id).first()
    if message is None or message.recipient_candidate_id != candidate_user.id:
        raise NotFoundError("Message not found")

    if message.read_at is None:
        message.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(message)

    return _to_message_out(message)
