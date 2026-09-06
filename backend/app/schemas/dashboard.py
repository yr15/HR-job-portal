import datetime

from pydantic import BaseModel


class ApplicationsByDay(BaseModel):
    date: datetime.date
    count: int


class DashboardStatsOut(BaseModel):
    total_jobs: int
    active_jobs: int
    total_applications: int
    applied_count: int
    shortlisted_count: int
    rejected_count: int
    applications_by_day: list[ApplicationsByDay]


class CandidateStatsOut(BaseModel):
    total_applications: int
    applied_count: int
    shortlisted_count: int
    rejected_count: int
