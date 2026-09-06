"""
Technical Services Layer -- Notification (SMS).

Backs the SMSServiceAPI box in layered_architecture.md's Business
Infrastructure layer, implemented against Africa's Talking (see README
Section 6). MOCKED: no real Africa's Talking sandbox credentials are
available in this environment, so `send_sms` logs what would have been
sent and returns a realistic fake response shaped like the real SDK's.

To go live: `pip install africastalking`, set AFRICASTALKING_API_KEY /
AFRICASTALKING_USERNAME in the environment, and swap the body of
`send_sms` for a real `africastalking.SMS.send(...)` call.
"""
import uuid
from datetime import datetime, timezone

from app.config import AFRICASTALKING_API_KEY, USE_MOCK_EXTERNAL_APIS
from app.technical_services.logging.logger import log_action


def send_sms(to: str, message: str) -> dict:
    if USE_MOCK_EXTERNAL_APIS or not AFRICASTALKING_API_KEY:
        fake_message_id = f"ATXid_{uuid.uuid4().hex[:24]}"
        log_action(
            "sms_sent_mock",
            actor="AfricasTalkingStub",
            detail=f"to={to} message={message!r} messageId={fake_message_id}",
        )
        return {
            "SMSMessageData": {
                "Message": "Sent to 1/1 Total Cost: ZMW 0.0000 (MOCK)",
                "Recipients": [
                    {
                        "statusCode": 101,
                        "number": to,
                        "status": "Success",
                        "cost": "ZMW 0.0000",
                        "messageId": fake_message_id,
                    }
                ],
            },
            "mocked": True,
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }

    # --- Real integration path (requires real sandbox credentials) ---
    # import africastalking
    # africastalking.initialize(AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY)
    # sms = africastalking.SMS
    # return sms.send(message, [to])
    raise NotImplementedError("Real Africa's Talking integration not configured.")
