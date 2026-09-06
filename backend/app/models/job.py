import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import TimestampMixin
from app.db.session import Base
from app.models.enums import EmploymentType


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("ix_jobs_skills", "skills", postgresql_using="gin"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hr_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    skills: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, server_default="{}", nullable=False
    )
    location: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    employment_type: Mapped[EmploymentType] = mapped_column(
        Enum(EmploymentType, name="employment_type"), nullable=False
    )
    min_experience_years: Mapped[float] = mapped_column(Numeric(4, 1), nullable=False, default=0)
    max_experience_years: Mapped[float | None] = mapped_column(Numeric(4, 1))
    salary_min: Mapped[int | None] = mapped_column(Integer)
    salary_max: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    hr: Mapped["User"] = relationship(back_populates="jobs")
    applications: Mapped[list["Application"]] = relationship(back_populates="job")

    @property
    def company_name(self) -> str | None:
        return self.hr.hr_profile.company_name if self.hr and self.hr.hr_profile else None
