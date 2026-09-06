from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models import User, UserRole
from app.schemas.dashboard import DashboardStatsOut
from app.schemas.job import JobOut
from app.schemas.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Page
from app.services.dashboard_service import get_hr_dashboard_stats
from app.services.job_service import list_hr_jobs

router = APIRouter(prefix="/hr", tags=["hr"])


@router.get("/jobs", response_model=Page[JobOut])
def my_jobs(
    db: Session = Depends(get_db),
    hr_user: User = Depends(require_role(UserRole.HR)),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> Page[JobOut]:
    items, total = list_hr_jobs(db, hr_user, page=page, page_size=page_size)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/dashboard/stats", response_model=DashboardStatsOut)
def dashboard_stats(
    db: Session = Depends(get_db),
    hr_user: User = Depends(require_role(UserRole.HR)),
) -> DashboardStatsOut:
    return get_hr_dashboard_stats(db, hr_user)
