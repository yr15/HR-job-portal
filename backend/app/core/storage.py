import uuid
from pathlib import Path

from app.core.config import settings

RESUME_SUBDIR = "resumes"


def resume_path_for(candidate_id: uuid.UUID) -> Path:
    directory = Path(settings.upload_dir) / RESUME_SUBDIR
    directory.mkdir(parents=True, exist_ok=True)
    return directory / f"{candidate_id}.pdf"
