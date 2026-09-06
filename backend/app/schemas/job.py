import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import EmploymentType


def _strip_and_require(value: str, field_label: str, min_length: int) -> str:
    stripped = value.strip()
    if len(stripped) < min_length:
        raise ValueError(f"{field_label} must be at least {min_length} character(s), not just whitespace")
    return stripped


class JobBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=20)
    skills: list[str] = Field(default_factory=list)
    location: str = Field(min_length=1, max_length=255)
    employment_type: EmploymentType
    min_experience_years: float = Field(default=0, ge=0, le=50)
    max_experience_years: float | None = Field(default=None, ge=0, le=50)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        return _strip_and_require(value, "title", 3)

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        return _strip_and_require(value, "description", 20)

    @field_validator("location")
    @classmethod
    def strip_location(cls, value: str) -> str:
        return _strip_and_require(value, "location", 1)

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, value: list[str]) -> list[str]:
        return [s for s in dict.fromkeys(skill.strip() for skill in value if skill.strip())]

    @model_validator(mode="after")
    def check_ranges(self) -> "JobBase":
        if self.max_experience_years is not None and self.max_experience_years < self.min_experience_years:
            raise ValueError("max_experience_years must be greater than or equal to min_experience_years")
        if self.salary_min is not None and self.salary_max is not None and self.salary_max < self.salary_min:
            raise ValueError("salary_max must be greater than or equal to salary_min")
        return self


class JobCreateRequest(JobBase):
    pass


class JobUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = Field(default=None, min_length=20)
    skills: list[str] | None = None
    location: str | None = Field(default=None, min_length=1, max_length=255)
    employment_type: EmploymentType | None = None
    min_experience_years: float | None = Field(default=None, ge=0, le=50)
    max_experience_years: float | None = Field(default=None, ge=0, le=50)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str | None) -> str | None:
        return _strip_and_require(value, "title", 3) if value is not None else None

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str | None) -> str | None:
        return _strip_and_require(value, "description", 20) if value is not None else None

    @field_validator("location")
    @classmethod
    def strip_location(cls, value: str | None) -> str | None:
        return _strip_and_require(value, "location", 1) if value is not None else None

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return [s for s in dict.fromkeys(skill.strip() for skill in value if skill.strip())]


class JobStatusUpdateRequest(BaseModel):
    is_active: bool


class JobOut(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    hr_id: uuid.UUID
    company_name: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
