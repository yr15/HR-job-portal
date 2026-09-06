import logging

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import hash_password, verify_password
from app.models import CandidateProfile, HRProfile, User, UserRole
from app.schemas.auth import RegisterRequest

logger = logging.getLogger(__name__)


def register_user(db: Session, payload: RegisterRequest) -> User:
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first() is not None:
        raise ConflictError("An account with this email already exists", code="EMAIL_ALREADY_REGISTERED")

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.flush()

    if payload.role == UserRole.HR:
        db.add(
            HRProfile(
                user_id=user.id,
                company_name=payload.company_name,
                designation=payload.designation,
            )
        )
    else:
        db.add(CandidateProfile(user_id=user.id))

    db.commit()
    db.refresh(user)
    logger.info("Registered new %s user: %s", user.role.value, user.id)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email.lower()).first()
    if user is None or not verify_password(password, user.password_hash) or not user.is_active:
        logger.info("Failed login attempt for email: %s", email.lower())
        raise UnauthorizedError("Invalid email or password", code="INVALID_CREDENTIALS")

    logger.info("User logged in: %s", user.id)
    return user
