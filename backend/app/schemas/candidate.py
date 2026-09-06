import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CandidateProfileUpdateRequest(BaseModel):
    phone: str | None = Field(default=None, max_length=30)
    headline: str | None = Field(default=None, max_length=255)
    total_experience_years: float | None = Field(default=None, ge=0, le=60)
    skills: list[str] | None = None
    location: str | None = Field(default=None, max_length=255)
    resume_url: str | None = Field(default=None, max_length=500)

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return [s for s in dict.fromkeys(skill.strip() for skill in value if skill.strip())]


class CandidateListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    headline: str | None
    total_experience_years: float | None
    skills: list[str]
    location: str | None
