"""Idempotent demo-data seeding, run once from entrypoint.sh on every container start.

Skips entirely if the first demo HR user already exists, so re-running on an
already-seeded database (e.g. `docker compose up` without `-v`) is a no-op.
"""

import logging

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import (
    Application,
    ApplicationStatus,
    CandidateProfile,
    EmploymentType,
    HRProfile,
    Job,
    User,
    UserRole,
)

logger = logging.getLogger(__name__)

DEMO_HR_MARKER_EMAIL = "hr@test.com"

# (full_name, headline, experience_years, skills, location) — appended after the two
# primary demo candidates (candidate@test.com / candidate2@test.com) as candidate3..22.
BULK_CANDIDATES = [
    ("Arjun Rao", "Data Scientist", 4, ["Python", "Machine Learning", "Pandas", "SQL"], "Bangalore"),
    ("Sneha Kulkarni", "DevOps Engineer", 5, ["AWS", "Docker", "Kubernetes", "Terraform"], "Pune"),
    ("Rohan Mehta", "Mobile Developer", 3, ["React Native", "JavaScript", "iOS", "Android"], "Mumbai"),
    ("Ishaan Kapoor", "Product Manager", 6, ["Product Strategy", "Agile", "Analytics", "SQL"], "Bangalore"),
    ("Divya Reddy", "UI/UX Designer", 2.5, ["Figma", "User Research", "Prototyping"], "Hyderabad"),
    ("Vikram Singh", "Cloud Engineer", 5, ["AWS", "Terraform", "Kubernetes", "Linux"], "Hyderabad"),
    ("Meera Pillai", "QA Engineer", 3, ["Selenium", "Manual Testing", "JIRA"], "Chennai"),
    ("Aditya Joshi", "Machine Learning Engineer", 4, ["Python", "TensorFlow", "PyTorch", "SQL"], "Bangalore"),
    ("Pooja Desai", "Business Analyst", 3.5, ["SQL", "Excel", "Power BI", "Analytics"], "Mumbai"),
    ("Nikhil Bhatt", "Full Stack Developer", 2, ["Node.js", "React", "MongoDB", "Express"], "Pune"),
    ("Shreya Iyer", "Data Analyst", 1.5, ["SQL", "Python", "Excel", "Tableau"], "Chennai"),
    ("Karthik Nambiar", "Network Engineer", 6, ["Networking", "Cisco", "Security", "Linux"], "Delhi"),
    ("Ananya Rao", "Content Writer", 2, ["SEO", "Content Strategy", "Copywriting"], "Remote"),
    ("Rahul Choudhary", "Digital Marketer", 3, ["SEO", "Google Ads", "Analytics", "Social Media"], "Delhi"),
    ("Kavya Menon", "Scrum Master", 5, ["Agile", "Scrum", "JIRA", "Stakeholder Management"], "Bangalore"),
    ("Suresh Pillai", "Backend Engineer", 7, ["Java", "Spring Boot", "PostgreSQL", "Microservices"], "Chennai"),
    ("Neha Agarwal", "Frontend Engineer", 2.5, ["React", "TypeScript", "Tailwind CSS"], "Gurgaon"),
    ("Manish Kumar", "Site Reliability Engineer", 4.5, ["Kubernetes", "Prometheus", "AWS", "Python"], "Bangalore"),
    ("Ritu Sharma", "Technical Writer", 3, ["Documentation", "Markdown", "API Docs"], "Remote"),
    ("Varun Nair", "Sales Executive", 2, ["Salesforce", "CRM", "Negotiation", "B2B Sales"], "Mumbai"),
]

# (title, description, skills, location, employment_type, min_exp, max_exp, salary_min, salary_max, hr) —
# "hr" is 1 or 2, referring to which seeded HR account posts it.
BULK_JOBS = [
    (
        "Data Scientist",
        "Analyze large datasets and build predictive models to guide product decisions. "
        "Strong foundation in statistics and machine learning required.",
        ["Python", "Machine Learning", "SQL"],
        "Bangalore",
        EmploymentType.FULL_TIME,
        2,
        6,
        1_500_000,
        2_500_000,
        1,
    ),
    (
        "Mobile Developer - React Native",
        "Build and ship features across our iOS and Android apps from a single React "
        "Native codebase, working closely with backend and design.",
        ["React Native", "JavaScript", "iOS", "Android"],
        "Mumbai",
        EmploymentType.FULL_TIME,
        1,
        4,
        900_000,
        1_600_000,
        2,
    ),
    (
        "Product Manager",
        "Own the roadmap for a core product area, working with engineering, design, and "
        "customers to prioritize and ship features that matter.",
        ["Product Strategy", "Agile", "Analytics"],
        "Bangalore",
        EmploymentType.FULL_TIME,
        4,
        9,
        2_000_000,
        3_500_000,
        1,
    ),
    (
        "UI/UX Designer",
        "Design intuitive, accessible interfaces for our web and mobile products, from "
        "wireframes through high-fidelity prototypes.",
        ["Figma", "User Research", "Prototyping"],
        "Remote",
        EmploymentType.CONTRACT,
        2,
        5,
        1_000_000,
        1_800_000,
        2,
    ),
    (
        "Cloud Engineer - AWS",
        "Design and operate our AWS infrastructure, focusing on reliability, cost "
        "efficiency, and infrastructure-as-code practices.",
        ["AWS", "Terraform", "Kubernetes"],
        "Hyderabad",
        EmploymentType.FULL_TIME,
        3,
        7,
        1_800_000,
        2_800_000,
        1,
    ),
]


def _create_hr(db, *, email, password, full_name, company_name, designation) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=UserRole.HR,
    )
    db.add(user)
    db.flush()
    db.add(HRProfile(user_id=user.id, company_name=company_name, designation=designation))
    return user


def _create_candidate(
    db, *, email, password, full_name, headline, experience_years, skills, location, phone, resume_url
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=UserRole.CANDIDATE,
    )
    db.add(user)
    db.flush()
    db.add(
        CandidateProfile(
            user_id=user.id,
            headline=headline,
            total_experience_years=experience_years,
            skills=skills,
            location=location,
            phone=phone,
            resume_url=resume_url,
        )
    )
    return user


def seed(db) -> None:
    if db.query(User).filter(User.email == DEMO_HR_MARKER_EMAIL).first() is not None:
        logger.info("Demo data already present, skipping seed")
        return

    hr1 = _create_hr(
        db,
        email="hr@test.com",
        password="Hr@12345",
        full_name="Ananya Sharma",
        company_name="Northwind Technologies",
        designation="Senior Talent Acquisition Manager",
    )
    hr2 = _create_hr(
        db,
        email="hr2@test.com",
        password="Hr2@12345",
        full_name="Rahul Verma",
        company_name="Bluepeak Labs",
        designation="HR Manager",
    )

    candidate1 = _create_candidate(
        db,
        email="candidate@test.com",
        password="Candidate@12345",
        full_name="Priya Nair",
        headline="Backend Engineer",
        experience_years=3.5,
        skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        location="Bangalore",
        phone="+91-9000000001",
        resume_url="https://drive.google.com/file/d/example-priya-resume/view",
    )
    candidate2 = _create_candidate(
        db,
        email="candidate2@test.com",
        password="Candidate2@12345",
        full_name="Karan Mehta",
        headline="Frontend Engineer",
        experience_years=1.5,
        skills=["React", "TypeScript", "CSS", "JavaScript"],
        location="Pune",
        phone="+91-9000000002",
        resume_url=None,
    )

    job1 = Job(
        hr_id=hr1.id,
        title="Backend Engineer - Python/FastAPI",
        description=(
            "We are looking for a Backend Engineer to design and build REST APIs "
            "using Python and FastAPI, with a strong focus on data modeling and "
            "performance. You will work closely with the frontend and product teams."
        ),
        skills=["Python", "FastAPI", "PostgreSQL"],
        location="Bangalore",
        employment_type=EmploymentType.FULL_TIME,
        min_experience_years=2,
        max_experience_years=5,
        salary_min=1_200_000,
        salary_max=1_800_000,
    )
    job2 = Job(
        hr_id=hr1.id,
        title="Frontend Engineer - React",
        description=(
            "Build and maintain responsive, accessible web applications using "
            "React and TypeScript. Collaborate with designers and backend "
            "engineers to ship polished user-facing features."
        ),
        skills=["React", "TypeScript", "CSS"],
        location="Bangalore",
        employment_type=EmploymentType.FULL_TIME,
        min_experience_years=1,
        max_experience_years=3,
        salary_min=800_000,
        salary_max=1_400_000,
    )
    job3 = Job(
        hr_id=hr2.id,
        title="DevOps Engineer",
        description=(
            "Own our CI/CD pipelines and container infrastructure. Experience "
            "with Docker, Kubernetes, and AWS required."
        ),
        skills=["Docker", "Kubernetes", "AWS"],
        location="Pune",
        employment_type=EmploymentType.CONTRACT,
        min_experience_years=3,
        max_experience_years=6,
        salary_min=1_500_000,
        salary_max=2_200_000,
    )
    job4 = Job(
        hr_id=hr2.id,
        title="Data Analyst Intern",
        description=(
            "6-month internship supporting the analytics team with SQL "
            "reporting and data cleanup. Great fit for a recent graduate."
        ),
        skills=["SQL", "Excel", "Python"],
        location="Pune",
        employment_type=EmploymentType.INTERNSHIP,
        min_experience_years=0,
        max_experience_years=1,
    )
    job5 = Job(
        hr_id=hr1.id,
        title="Senior Full Stack Developer",
        description=(
            "Lead full-stack development across our Python/React stack, "
            "mentoring junior engineers and driving architectural decisions. "
            "This requisition is currently closed."
        ),
        skills=["Python", "React", "PostgreSQL", "AWS"],
        location="Bangalore",
        employment_type=EmploymentType.FULL_TIME,
        min_experience_years=4,
        max_experience_years=8,
        salary_min=2_000_000,
        salary_max=3_000_000,
        is_active=False,
    )
    job6 = Job(
        hr_id=hr2.id,
        title="QA Engineer - Part Time",
        description=(
            "Part-time QA role covering manual and automated testing of our "
            "web application ahead of releases."
        ),
        skills=["Selenium", "Manual Testing"],
        location="Pune",
        employment_type=EmploymentType.PART_TIME,
        min_experience_years=1,
        max_experience_years=3,
    )
    db.add_all([job1, job2, job3, job4, job5, job6])
    db.flush()

    db.add_all(
        [
            Application(job_id=job1.id, candidate_id=candidate1.id, status=ApplicationStatus.SHORTLISTED),
            Application(job_id=job2.id, candidate_id=candidate1.id, status=ApplicationStatus.APPLIED),
            Application(job_id=job3.id, candidate_id=candidate1.id, status=ApplicationStatus.REJECTED),
            Application(job_id=job2.id, candidate_id=candidate2.id, status=ApplicationStatus.SHORTLISTED),
            Application(job_id=job6.id, candidate_id=candidate2.id, status=ApplicationStatus.APPLIED),
        ]
    )

    for i, (full_name, headline, experience_years, skills, location) in enumerate(BULK_CANDIDATES, start=3):
        _create_candidate(
            db,
            email=f"candidate{i}@test.com",
            password="Password123",
            full_name=full_name,
            headline=headline,
            experience_years=experience_years,
            skills=skills,
            location=location,
            phone=f"+91-90000000{i:02d}",
            resume_url=None,
        )

    bulk_jobs = [
        Job(
            hr_id=(hr1 if hr_number == 1 else hr2).id,
            title=title,
            description=description,
            skills=skills,
            location=location,
            employment_type=employment_type,
            min_experience_years=min_exp,
            max_experience_years=max_exp,
            salary_min=salary_min,
            salary_max=salary_max,
        )
        for title, description, skills, location, employment_type, min_exp, max_exp, salary_min, salary_max, hr_number in BULK_JOBS
    ]
    db.add_all(bulk_jobs)

    db.commit()
    logger.info(
        "Demo data seeded: 2 HR users, %d candidates, %d jobs, 5 applications",
        2 + len(BULK_CANDIDATES),
        6 + len(BULK_JOBS),
    )


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
