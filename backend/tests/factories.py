from app.core.security import hash_password
from app.models import CandidateProfile, HRProfile, User, UserRole


def create_hr(db, *, email="factory-hr@test.com", password="Password123", company_name="Acme Inc", is_active=True):
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name="Factory HR",
        role=UserRole.HR,
        is_active=is_active,
    )
    db.add(user)
    db.flush()
    db.add(HRProfile(user_id=user.id, company_name=company_name))
    db.commit()
    db.refresh(user)
    return user


def create_candidate(db, *, email="factory-candidate@test.com", password="Password123", is_active=True):
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name="Factory Candidate",
        role=UserRole.CANDIDATE,
        is_active=is_active,
    )
    db.add(user)
    db.flush()
    db.add(CandidateProfile(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user
