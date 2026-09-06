"""A simple, explainable ATS-style match score — word/skill overlap plus experience
fit. This is NOT resume parsing or NLP: we never extract text from the uploaded
PDF, only structured profile data (skills, headline, experience) the candidate
entered themselves. Real ATS products that claim to "read" a resume are doing
something considerably more involved; this is a transparent heuristic, not that.
"""

import re

_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
    "in", "is", "it", "of", "on", "or", "our", "that", "the", "to", "we", "will",
    "with", "you", "your",
}

_WORD_PATTERN = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> set[str]:
    words = _WORD_PATTERN.findall(text.lower())
    return {w for w in words if w not in _STOPWORDS and len(w) > 2}


def compute_ats_score(job, candidate_profile) -> float:
    """Returns a 0-100 match score between a job and a candidate profile.

    Weighted: 50% skills-array overlap, 30% free-text keyword overlap
    (job title/description vs candidate headline/skills), 20% experience fit.
    """
    if candidate_profile is None:
        return 0.0

    job_skills = {s.strip().lower() for s in job.skills if s.strip()}
    candidate_skills = {s.strip().lower() for s in candidate_profile.skills if s.strip()}
    if job_skills:
        skill_score = len(job_skills & candidate_skills) / len(job_skills)
    else:
        skill_score = 0.5

    job_words = _tokenize(f"{job.title} {job.description}")
    candidate_words = _tokenize(f"{candidate_profile.headline or ''} {' '.join(candidate_profile.skills)}")
    if job_words:
        word_score = len(job_words & candidate_words) / len(job_words)
    else:
        word_score = 0.0

    experience = candidate_profile.total_experience_years
    if experience is None:
        experience_score = 0.5
    else:
        experience = float(experience)
        min_experience = float(job.min_experience_years or 0)
        max_experience = float(job.max_experience_years) if job.max_experience_years is not None else None
        if experience >= min_experience and (max_experience is None or experience <= max_experience):
            experience_score = 1.0
        else:
            gap = (min_experience - experience) if experience < min_experience else (experience - max_experience)
            experience_score = max(0.0, 1.0 - gap / 5)

    final = 0.5 * skill_score + 0.3 * word_score + 0.2 * experience_score
    return round(final * 100, 1)


def score_to_stars(score: float) -> int:
    if score >= 80:
        return 5
    if score >= 60:
        return 4
    if score >= 40:
        return 3
    if score >= 20:
        return 2
    return 1
