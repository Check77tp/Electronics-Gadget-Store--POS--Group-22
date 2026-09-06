"""
Technical Services Layer -- Logging.

Per README Section 12 (Security): "log important system actions."
Simple, dependency-free logger: writes structured lines to both stdout
(visible in the uvicorn console) and a rotating-by-run log file so Samson
can review what happened overnight.
"""
import logging
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
LOG_PATH = os.path.join(BASE_DIR, "gadgetpos.log")

_logger = logging.getLogger("gadgetpos")
_logger.setLevel(logging.INFO)

if not _logger.handlers:
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    _logger.addHandler(stream_handler)

    file_handler = logging.FileHandler(LOG_PATH)
    file_handler.setFormatter(formatter)
    _logger.addHandler(file_handler)


def log_action(action: str, actor: str = "system", detail: str = "") -> None:
    """Log an important system action (login, sale completed, product changed, etc.)."""
    msg = f"action={action} actor={actor}"
    if detail:
        msg += f" detail={detail}"
    _logger.info(msg)


def log_error(action: str, detail: str = "") -> None:
    _logger.error(f"action={action} detail={detail}")


logger = _logger
