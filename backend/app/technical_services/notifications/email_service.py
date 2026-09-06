"""
Technical Services Layer -- Notification (Email).

Backs the EmailAPI box in layered_architecture.md's Business Infrastructure
layer, implemented against Mailgun (see README Section 6). MOCKED for the
same reason as sms_service.py -- no real Mailgun API key is available here.

To go live: set MAILGUN_API_KEY / MAILGUN_DOMAIN in the environment and
swap the body of `send_email` for a real `requests.post` to the Mailgun
Messages API.
"""
import uuid
from datetime import datetime, timezone

from app.config import MAILGUN_API_KEY, USE_MOCK_EXTERNAL_APIS
from app.technical_services.logging.logger import log_action


def send_email(to: str, subject: str, body: str) -> dict:
    if USE_MOCK_EXTERNAL_APIS or not MAILGUN_API_KEY:
        fake_id = f"<{uuid.uuid4().hex}@mock.mailgun.org>"
        log_action(
            "email_sent_mock",
            actor="MailgunStub",
            detail=f"to={to} subject={subject!r} id={fake_id}",
        )
        return {
            "id": fake_id,
            "message": "Queued. Thank you. (MOCK)",
            "mocked": True,
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }

    # --- Real integration path (requires real Mailgun API key) ---
    # import requests
    # return requests.post(
    #     f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
    #     auth=("api", MAILGUN_API_KEY),
    #     data={"from": f"GadgetPOS <noreply@{MAILGUN_DOMAIN}>", "to": [to], "subject": subject, "text": body},
    # ).json()
    raise NotImplementedError("Real Mailgun integration not configured.")
