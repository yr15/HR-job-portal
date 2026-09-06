import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import UserRole


class CandidateProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    phone: str | None
    headline: str | None
    total_experience_years: float | None
    skills: list[str]
    location: str | None
    resume_url: str | None


class HRProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_name: str
    designation: str | None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    created_at: datetime
    candidate_profile: CandidateProfileOut | None = None
    hr_profile: HRProfileOut | None = None
