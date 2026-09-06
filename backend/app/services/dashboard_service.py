from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Application, ApplicationStatus, Job, User
from app.schemas.dashboard import DashboardStatsOut


def get_hr_dashboard_stats(db: Session, hr_user: User) -> DashboardStatsOut:
    total_jobs, active_jobs = db.query(
        func.count(Job.id),
        func.count(Job.id).filter(Job.is_active.is_(True)),
    ).filter(Job.hr_id == hr_user.id).one()

    total_applications, applied_count, shortlisted_count, rejected_count = (
        db.query(
            func.count(Application.id),
            func.count(Application.id).filter(Application.status == ApplicationStatus.APPLIED),
            func.count(Application.id).filter(Application.status == ApplicationStatus.SHORTLISTED),
            func.count(Application.id).filter(Application.status == ApplicationStatus.REJECTED),
        )
        .join(Job, Application.job_id == Job.id)
        .filter(Job.hr_id == hr_user.id)
        .one()
    )

    return DashboardStatsOut(
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_applications=total_applications,
        applied_count=applied_count,
        shortlisted_count=shortlisted_count,
        rejected_count=rejected_count,
    )
