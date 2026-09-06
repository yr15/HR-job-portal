from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr

VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>"


def _upload(client, candidate, filename="resume.pdf", content=VALID_PDF_BYTES, content_type="application/pdf"):
    return client.post(
        "/api/v1/candidates/me/resume",
        files={"file": (filename, content, content_type)},
        headers=auth_header(candidate),
    )


def test_candidate_can_upload_resume(client, db_session):
    candidate = create_candidate(db_session, email="cand-upload@test.com")

    response = _upload(client, candidate)

    assert response.status_code == 200
    assert response.json()["candidate_profile"]["resume_filename"] == "resume.pdf"


def test_upload_rejects_non_pdf_content_type(client, db_session):
    candidate = create_candidate(db_session, email="cand-nonpdf@test.com")

    response = _upload(client, candidate, filename="resume.txt", content=b"hello", content_type="text/plain")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_FILE_TYPE"


def test_upload_rejects_spoofed_pdf_content(client, db_session):
    candidate = create_candidate(db_session, email="cand-spoofed@test.com")

    response = _upload(client, candidate, content=b"not actually a pdf")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_FILE_CONTENT"


def test_upload_rejects_oversized_file(client, db_session):
    candidate = create_candidate(db_session, email="cand-oversized@test.com")
    oversized = b"%PDF-1.4\n" + b"0" * (5 * 1024 * 1024 + 1)

    response = _upload(client, candidate, content=oversized)

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "FILE_TOO_LARGE"


def test_hr_cannot_upload_resume(client, db_session):
    hr_user = create_hr(db_session, email="hr-noupload@test.com")

    response = client.post(
        "/api/v1/candidates/me/resume",
        files={"file": ("resume.pdf", VALID_PDF_BYTES, "application/pdf")},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 403


def test_hr_can_download_candidate_resume(client, db_session):
    hr_user = create_hr(db_session, email="hr-download@test.com")
    candidate = create_candidate(db_session, email="cand-download@test.com")
    _upload(client, candidate)

    response = client.get(f"/api/v1/candidates/{candidate.id}/resume", headers=auth_header(hr_user))

    assert response.status_code == 200
    assert response.content == VALID_PDF_BYTES
    assert response.headers["content-type"] == "application/pdf"
    assert "inline" in response.headers["content-disposition"]


def test_candidate_can_download_own_resume(client, db_session):
    candidate = create_candidate(db_session, email="cand-ownresume@test.com")
    _upload(client, candidate)

    response = client.get(f"/api/v1/candidates/{candidate.id}/resume", headers=auth_header(candidate))

    assert response.status_code == 200


def test_other_candidate_cannot_download_resume(client, db_session):
    candidate = create_candidate(db_session, email="cand-target@test.com")
    other = create_candidate(db_session, email="cand-snoop@test.com")
    _upload(client, candidate)

    response = client.get(f"/api/v1/candidates/{candidate.id}/resume", headers=auth_header(other))

    assert response.status_code == 403


def test_download_resume_not_uploaded_returns_404(client, db_session):
    hr_user = create_hr(db_session, email="hr-noresume@test.com")
    candidate = create_candidate(db_session, email="cand-noresume@test.com")

    response = client.get(f"/api/v1/candidates/{candidate.id}/resume", headers=auth_header(hr_user))

    assert response.status_code == 404
