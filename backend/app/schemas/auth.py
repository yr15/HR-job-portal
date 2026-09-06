import re

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.models.enums import UserRole
from app.schemas.user import UserOut

PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    company_name: str | None = None
    designation: str | None = None

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("full_name must be at least 2 characters")
        return value

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not PASSWORD_PATTERN.match(value):
            raise ValueError("password must be at least 8 characters and include a letter and a digit")
        return value

    @model_validator(mode="after")
    def hr_requires_company_name(self) -> "RegisterRequest":
        if self.role == UserRole.HR and not (self.company_name and self.company_name.strip()):
            raise ValueError("company_name is required for HR registration")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
