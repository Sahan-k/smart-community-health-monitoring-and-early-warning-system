"""
HealthGuard AI — Configurable Active Risk Window
=================================================
Single source of truth for the rolling time window used in:
  • disease report counting
  • taluk-based risk threshold evaluation
  • HIGH RISK alert generation
  • dashboard current-risk statistics
  • risk-summary map endpoint

Configuration
-------------
Set the environment variable in backend/.env:

    RISK_REPORT_WINDOW_HOURS=24   # active window in hours (default: 24)

Switch from 24-hour testing mode to the production 7-day window:

    RISK_REPORT_WINDOW_HOURS=168

No code changes are required — restart the backend after editing .env.

Unified Testing Risk Thresholds (Demo / Verification):
------------------------------------------------------
  • 1 report           → LOW RISK
  • 2 reports          → MEDIUM RISK
  • 3 or more reports  → HIGH RISK

All valid reports are counted equally regardless of whether they come from
the same user or different users. Do NOT count unique users.
"""

import logging
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default and limits
# ---------------------------------------------------------------------------

_DEFAULT_HOURS = 24          # testing default
_MIN_HOURS = 1
_MAX_HOURS = 8760            # 1 year ceiling — sanity guard

# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def get_risk_window_hours() -> int:
    """
    Read RISK_REPORT_WINDOW_HOURS from the environment.
    Falls back to 24 hours if the variable is absent or invalid.
    Clamps to [1, 8760] hours.
    """
    raw = os.getenv("RISK_REPORT_WINDOW_HOURS", str(_DEFAULT_HOURS)).strip()
    try:
        hours = int(raw)
    except ValueError:
        logger.warning(
            "risk_window: RISK_REPORT_WINDOW_HOURS=%r is not a valid integer. "
            "Defaulting to %d hours.", raw, _DEFAULT_HOURS
        )
        return _DEFAULT_HOURS

    if hours < _MIN_HOURS or hours > _MAX_HOURS:
        logger.warning(
            "risk_window: RISK_REPORT_WINDOW_HOURS=%d is out of range [%d, %d]. "
            "Clamping to nearest bound.", hours, _MIN_HOURS, _MAX_HOURS
        )
        return max(_MIN_HOURS, min(hours, _MAX_HOURS))

    return hours


def get_active_window_start() -> datetime:
    """
    Return the UTC datetime that marks the start of the active report window.
    Reports with report_date >= this timestamp are considered ACTIVE.
    Reports older than this are EXPIRED and excluded from risk calculations.

    Example (RISK_REPORT_WINDOW_HOURS=24):
        If now is 2026-11-22 22:00 UTC, window_start = 2026-11-21 22:00 UTC
        A report from 2 hours ago   → ACTIVE
        A report from 23 hours ago  → ACTIVE
        A report from 25 hours ago  → EXPIRED
        A report from 2 days ago    → EXPIRED
    """
    hours = get_risk_window_hours()
    return datetime.utcnow() - timedelta(hours=hours)


def get_risk_thresholds() -> dict:
    """
    Return unified report-count thresholds for Low / Medium / High risk:
      • 1 report           → LOW RISK
      • 2 reports          → MEDIUM RISK
      • 3 or more reports  → HIGH RISK

    All reports are counted equally regardless of user identity.
    """
    return {
        "high": 3,      # >= 3 active reports in 24h window → HIGH RISK
        "medium": 2,    # == 2 active reports in 24h window → MEDIUM RISK
        "low": 1,       # <= 1 active report in 24h window  → LOW RISK
    }
