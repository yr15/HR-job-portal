import logging

from sqlalchemy.orm import Session

from app.models import User
from app.schemas.hr import HRProfileUpdateRequest

logger = logging.getLogger(__name__)


def update_own_hr_profile(db: Session, hr_user: User, payload: HRProfileUpdateRequest) -> User:
    updates = payload.model_dump(exclude_unset=True, exclude={"full_name"})
    for field, value in updates.items():
        setattr(hr_user.hr_profile, field, value)

    if payload.full_name is not None:
        hr_user.full_name = payload.full_name

    db.commit()
    db.refresh(hr_user)
    logger.info("HR profile updated: %s", hr_user.id)
    return hr_user
