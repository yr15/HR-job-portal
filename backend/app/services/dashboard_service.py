import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Application, ApplicationStatus, Job, User
from app.schemas.dashboard import ApplicationsByDay, CandidateStatsOut, DashboardStatsOut

TREND_DAYS = 14


def _fill_trend_gaps(counts_by_date: dict[datetime.date, int]) -> list[ApplicationsByDay]:
    today = datetime.datetime.now(datetime.timezone.utc).date()
    start = today - datetime.timedelta(days=TREND_DAYS - 1)
    days = []
    current = start
    while current <= today:
        days.append(ApplicationsByDay(date=current, count=counts_by_date.get(current, 0)))
        current += datetime.timedelta(days=1)
    return days


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

    trend_start = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=TREND_DAYS - 1)
    trend_rows = (
        db.query(func.date(Application.applied_at), func.count(Application.id))
        .join(Job, Application.job_id == Job.id)
        .filter(Job.hr_id == hr_user.id, Application.applied_at >= trend_start)
        .group_by(func.date(Application.applied_at))
        .all()
    )
    counts_by_date = {date: count for date, count in trend_rows}

    return DashboardStatsOut(
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_applications=total_applications,
        applied_count=applied_count,
        shortlisted_count=shortlisted_count,
        rejected_count=rejected_count,
        applications_by_day=_fill_trend_gaps(counts_by_date),
    )


def get_candidate_stats(db: Session, candidate_user: User) -> CandidateStatsOut:
    total_applications, applied_count, shortlisted_count, rejected_count = (
        db.query(
            func.count(Application.id),
            func.count(Application.id).filter(Application.status == ApplicationStatus.APPLIED),
            func.count(Application.id).filter(Application.status == ApplicationStatus.SHORTLISTED),
            func.count(Application.id).filter(Application.status == ApplicationStatus.REJECTED),
        )
        .filter(Application.candidate_id == candidate_user.id)
        .one()
    )

    return CandidateStatsOut(
        total_applications=total_applications,
        applied_count=applied_count,
        shortlisted_count=shortlisted_count,
        rejected_count=rejected_count,
    )
