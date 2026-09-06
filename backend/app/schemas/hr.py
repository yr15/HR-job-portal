from pydantic import BaseModel, Field, field_validator


class HRProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    company_name: str | None = Field(default=None, max_length=255)
    designation: str | None = Field(default=None, max_length=255)

    @field_validator("full_name", "company_name")
    @classmethod
    def strip_and_require_non_blank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be blank")
        return stripped
