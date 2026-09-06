import uuid

from sqlalchemy import ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import TimestampMixin
from app.db.session import Base


class CandidateProfile(Base, TimestampMixin):
    __tablename__ = "candidate_profiles"
    __table_args__ = (
        Index("ix_candidate_profiles_skills", "skills", postgresql_using="gin"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    phone: Mapped[str | None] = mapped_column(String(30))
    headline: Mapped[str | None] = mapped_column(String(255))
    total_experience_years: Mapped[float | None] = mapped_column(Numeric(4, 1))
    skills: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, server_default="{}", nullable=False
    )
    location: Mapped[str | None] = mapped_column(String(255), index=True)
    resume_url: Mapped[str | None] = mapped_column(String(500))

    user: Mapped["User"] = relationship(back_populates="candidate_profile")
