"""
Application configuration.

Centralizes settings that would, in a real deployment, come from environment
variables / a .env file. Kept simple and explicit for the coursework build.
"""
import os

# --- Security / Auth ---
SECRET_KEY = os.environ.get("GADGETPOS_SECRET_KEY", "dev-secret-key-change-in-production-4630")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hour shift-length session

# --- Database ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "gadgetpos.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# --- Business rules ---
DEFAULT_TAX_RATE = 0.0825  # 8.25%, matches the Stitch UI mock (Section 13 reporting / Apply Tax use case)
CURRENCY_SYMBOL = "K"  # Zambian Kwacha (ZMW)

# --- External API integration mode ---
# All three external integrations (Flutterwave, Africa's Talking, Mailgun) run in MOCK mode
# because this environment has no real sandbox credentials. See technical_services/notifications
# and business_infrastructure/payment_gateway for the stub implementations. Flip to False and
# supply real keys via environment variables to go live against real sandboxes.
USE_MOCK_EXTERNAL_APIS = True

FLUTTERWAVE_SECRET_KEY = os.environ.get("FLUTTERWAVE_SECRET_KEY", "")
AFRICASTALKING_API_KEY = os.environ.get("AFRICASTALKING_API_KEY", "")
AFRICASTALKING_USERNAME = os.environ.get("AFRICASTALKING_USERNAME", "")
MAILGUN_API_KEY = os.environ.get("MAILGUN_API_KEY", "")
MAILGUN_DOMAIN = os.environ.get("MAILGUN_DOMAIN", "")

# Low stock notifications: who receives the mocked SMS/email alert
STORE_MANAGER_PHONE = os.environ.get("STORE_MANAGER_PHONE", "+260-97-000-0000")
STORE_MANAGER_EMAIL = os.environ.get("STORE_MANAGER_EMAIL", "manager@gadgetpos.example")
