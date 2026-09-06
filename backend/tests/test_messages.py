from tests.conftest import auth_header
from tests.factories import create_candidate, create_hr


def test_hr_can_bulk_send_message(client, db_session):
    hr_user = create_hr(db_session, email="hr-bulksend@test.com")
    cand1 = create_candidate(db_session, email="cand-bulk1@test.com")
    cand2 = create_candidate(db_session, email="cand-bulk2@test.com")

    response = client.post(
        "/api/v1/messages/bulk",
        json={"candidate_ids": [str(cand1.id), str(cand2.id)], "subject": "Hello", "body": "We'd love to chat."},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 201
    assert response.json()["sent_count"] == 2


def test_candidate_receives_message_in_inbox(client, db_session):
    hr_user = create_hr(db_session, email="hr-inbox@test.com", company_name="Inbox Co")
    candidate = create_candidate(db_session, email="cand-inbox@test.com")

    client.post(
        "/api/v1/messages/bulk",
        json={"candidate_ids": [str(candidate.id)], "subject": "Interview invite", "body": "Are you free Thursday?"},
        headers=auth_header(hr_user),
    )

    response = client.get("/api/v1/messages/me", headers=auth_header(candidate))

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["subject"] == "Interview invite"
    assert body["items"][0]["sender_company"] == "Inbox Co"
    assert body["items"][0]["read_at"] is None


def test_unread_count_and_mark_read(client, db_session):
    hr_user = create_hr(db_session, email="hr-unread@test.com")
    candidate = create_candidate(db_session, email="cand-unread@test.com")
    client.post(
        "/api/v1/messages/bulk",
        json={"candidate_ids": [str(candidate.id)], "subject": "Hi", "body": "Hi there"},
        headers=auth_header(hr_user),
    )

    unread_before = client.get("/api/v1/messages/me/unread-count", headers=auth_header(candidate))
    assert unread_before.json()["unread_count"] == 1

    message_id = client.get("/api/v1/messages/me", headers=auth_header(candidate)).json()["items"][0]["id"]
    read_response = client.patch(f"/api/v1/messages/{message_id}/read", headers=auth_header(candidate))
    assert read_response.status_code == 200
    assert read_response.json()["read_at"] is not None

    unread_after = client.get("/api/v1/messages/me/unread-count", headers=auth_header(candidate))
    assert unread_after.json()["unread_count"] == 0


def test_candidate_cannot_send_bulk_message(client, db_session):
    candidate = create_candidate(db_session, email="cand-nosend@test.com")
    other = create_candidate(db_session, email="cand-target2@test.com")

    response = client.post(
        "/api/v1/messages/bulk",
        json={"candidate_ids": [str(other.id)], "subject": "Hi", "body": "Hi"},
        headers=auth_header(candidate),
    )

    assert response.status_code == 403


def test_candidate_cannot_mark_others_message_read(client, db_session):
    hr_user = create_hr(db_session, email="hr-crossread@test.com")
    candidate = create_candidate(db_session, email="cand-crossread@test.com")
    other = create_candidate(db_session, email="cand-crossread-other@test.com")
    client.post(
        "/api/v1/messages/bulk",
        json={"candidate_ids": [str(candidate.id)], "subject": "Hi", "body": "Hi"},
        headers=auth_header(hr_user),
    )
    message_id = client.get("/api/v1/messages/me", headers=auth_header(candidate)).json()["items"][0]["id"]

    response = client.patch(f"/api/v1/messages/{message_id}/read", headers=auth_header(other))

    assert response.status_code == 404


def test_bulk_send_ignores_invalid_candidate_ids(client, db_session):
    hr_user = create_hr(db_session, email="hr-partialvalid@test.com")
    candidate = create_candidate(db_session, email="cand-partialvalid@test.com")

    response = client.post(
        "/api/v1/messages/bulk",
        json={
            "candidate_ids": [str(candidate.id), "00000000-0000-0000-0000-000000000000"],
            "subject": "Hi",
            "body": "Hi",
        },
        headers=auth_header(hr_user),
    )

    assert response.status_code == 201
    assert response.json()["sent_count"] == 1


def test_bulk_send_with_no_valid_recipients_returns_400(client, db_session):
    hr_user = create_hr(db_session, email="hr-novalid@test.com")

    response = client.post(
        "/api/v1/messages/bulk",
        json={"candidate_ids": ["00000000-0000-0000-0000-000000000000"], "subject": "Hi", "body": "Hi"},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "NO_VALID_RECIPIENTS"


def test_bulk_send_cannot_target_hr_accounts(client, db_session):
    hr_user = create_hr(db_session, email="hr-sender@test.com")
    other_hr = create_hr(db_session, email="hr-victim@test.com", company_name="Other Co")

    response = client.post(
        "/api/v1/messages/bulk",
        json={"candidate_ids": [str(other_hr.id)], "subject": "Hi", "body": "Hi"},
        headers=auth_header(hr_user),
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "NO_VALID_RECIPIENTS"
