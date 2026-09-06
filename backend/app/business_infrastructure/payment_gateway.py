"""
Business Infrastructure Layer -- External APIs (Payment).

Implements the `iCreditAuthorizationService` interface from
design_class_diagram.md / layered_architecture.md: the Domain layer
(SalesController / Payment.authorize()) depends only on this interface,
never on a specific payment provider. Today it's backed by a Flutterwave
stub; swapping providers later is a config change, not a redesign.

MOCKED: no real Flutterwave sandbox secret key is available in this
environment. `authorize()` simulates a successful authorization for cash,
card, and mobile-money tenders and logs what would have been sent to
Flutterwave's Charge API.
"""
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from app.config import FLUTTERWAVE_SECRET_KEY, USE_MOCK_EXTERNAL_APIS
from app.technical_services.logging.logger import log_action


class ICreditAuthorizationService(ABC):
    """Interface (GRASP Polymorphism / Low Coupling): the Domain layer codes
    against this, not against a concrete provider."""

    @abstractmethod
    def authorize(self, amount: float, method: str, reference: str) -> dict:
        """Attempt to authorize `amount` for the given tender `method`
        ('cash' | 'card' | 'mobile_money'). Returns a dict with at least
        {"success": bool, "transaction_ref": str, "message": str}."""
        raise NotImplementedError


class FlutterwavePaymentService(ICreditAuthorizationService):
    """Stub implementation backed by Flutterwave's Charge API shape.

    Cash is trivially "authorized" locally (no gateway call needed --
    physical cash is being handed over at the register). Card and mobile
    money are routed through this simulated gateway call.
    """

    def authorize(self, amount: float, method: str, reference: str) -> dict:
        if method == "cash":
            # Cash never goes through a payment gateway.
            return {
                "success": True,
                "transaction_ref": f"CASH-{reference}",
                "message": "Cash payment accepted at register.",
                "mocked": False,
            }

        if USE_MOCK_EXTERNAL_APIS or not FLUTTERWAVE_SECRET_KEY:
            fake_tx_ref = f"FLW-{uuid.uuid4().hex[:16].upper()}"
            log_action(
                "payment_authorized_mock",
                actor="FlutterwaveStub",
                detail=(
                    f"method={method} amount={amount:.2f} reference={reference} "
                    f"tx_ref={fake_tx_ref}"
                ),
            )
            return {
                "success": True,
                "transaction_ref": fake_tx_ref,
                "message": f"Payment of {amount:.2f} approved (MOCK Flutterwave sandbox).",
                "mocked": True,
                "authorized_at": datetime.now(timezone.utc).isoformat(),
                "processor_response": {
                    "status": "successful",
                    "amount": amount,
                    "currency": "ZMW",
                    "payment_type": "card" if method == "card" else "mobilemoneyzambia",
                },
            }

        # --- Real integration path (requires a real Flutterwave secret key) ---
        # import requests
        # resp = requests.post(
        #     "https://api.flutterwave.com/v3/charges?type=card",
        #     headers={"Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}"},
        #     json={...},
        # )
        # return resp.json()
        raise NotImplementedError("Real Flutterwave integration not configured.")


def get_payment_service() -> ICreditAuthorizationService:
    """FastAPI dependency / simple factory -- swap this to change providers."""
    return FlutterwavePaymentService()
