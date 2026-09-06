from pydantic import BaseModel


class DashboardStatsOut(BaseModel):
    total_jobs: int
    active_jobs: int
    total_applications: int
    applied_count: int
    shortlisted_count: int
    rejected_count: int
