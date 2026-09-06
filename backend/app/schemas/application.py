import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ApplicationStatus
from app.schemas.job import JobOut
from app.schemas.user import UserOut

ALLOWED_STATUS_TRANSITIONS = {ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED}


class ApplyRequest(BaseModel):
    cover_note: str | None = Field(default=None, max_length=2000)


class ApplicationStatusUpdateRequest(BaseModel):
    status: ApplicationStatus

    @field_validator("status")
    @classmethod
    def status_must_be_a_valid_transition(cls, value: ApplicationStatus) -> ApplicationStatus:
        if value not in ALLOWED_STATUS_TRANSITIONS:
            raise ValueError("status must be SHORTLISTED or REJECTED")
        return value


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: ApplicationStatus
    cover_note: str | None
    applied_at: datetime
    updated_at: datetime
    ats_score: float
    ats_rating: int
    job: JobOut
    candidate: UserOut
