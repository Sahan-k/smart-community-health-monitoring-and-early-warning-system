"""
HealthGuard AI — Email Notification Service
============================================
Sends professionally branded HIGH RISK health alert emails to ALL registered
users whose email address is on record in the database.

Environment variables (set in backend/.env):
    SMTP_EMAIL     — sender address  (e.g. healthguardai.alerts@gmail.com)
    SMTP_PASSWORD  — Gmail App Password (16-char, never the real password)
    SMTP_SERVER    — SMTP host        (default: smtp.gmail.com)
    SMTP_PORT      — SMTP port        (default: 587)

Duplicate-alert prevention:
    Before sending, this service queries the email_alert_log table.
    If a row (alert_id, recipient_email) already exists the email is skipped.
    Successful sends are recorded in email_alert_log.

Failure isolation:
    All exceptions are caught and logged. SMTP failures never crash the
    application or delay API responses.
"""

import logging
import os
import smtplib
import ssl
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Tuple, Dict, Any

from sqlalchemy import text
from backend.app.database.connection import SessionLocal

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database table auto-initialization for deduplication
# ---------------------------------------------------------------------------

def _ensure_log_table_exists():
    """Ensure email_alert_log table exists in the database for deduplication."""
    try:
        with SessionLocal() as db:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS email_alert_log (
                    id              SERIAL PRIMARY KEY,
                    alert_id        INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
                    recipient_email VARCHAR(150) NOT NULL,
                    sent_at         TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                    UNIQUE (alert_id, recipient_email)
                );
                CREATE INDEX IF NOT EXISTS idx_email_alert_log_alert_id ON email_alert_log(alert_id);
                CREATE INDEX IF NOT EXISTS idx_email_alert_log_recipient ON email_alert_log(recipient_email);
            """))
            db.commit()
    except Exception as exc:
        logger.warning("[EMAIL SERVICE] Table verification notice: %s", exc)


# ---------------------------------------------------------------------------
# SMTP credential helpers
# ---------------------------------------------------------------------------

def _get_smtp_config() -> Tuple[Optional[dict], Optional[str]]:
    """
    Load and sanitize SMTP config from environment.
    Returns (config_dict, error_message).
    Password spaces and surrounding quotes are automatically stripped to support
    copy-pasted Google App Passwords (e.g. "abcd efgh ijkl mnop").
    """
    email = (os.getenv("SMTP_EMAIL", "") or os.getenv("SMTP_FROM_EMAIL", "") or os.getenv("SMTP_USERNAME", "")).strip()
    raw_password = os.getenv("SMTP_PASSWORD", "").strip()
    # Strip quotes and internal spaces (Google displays app passwords in 4-char groups)
    password = raw_password.replace(" ", "").strip("'\"")

    if not email:
        msg = "SMTP_EMAIL is not set in backend/.env."
        print(f"[EMAIL SERVICE] CONFIG WARNING: {msg}")
        logger.warning("[EMAIL SERVICE] %s", msg)
        return None, msg

    if not password:
        msg = "SMTP_PASSWORD is empty in backend/.env. High-risk alert emails cannot be sent."
        print(f"[EMAIL SERVICE] CONFIG WARNING: {msg}")
        logger.warning("[EMAIL SERVICE] %s", msg)
        return None, msg

    # Detect placeholder password
    if password == "your-16-char-app-password-here" or "placeholder" in password.lower() or "your-16" in password.lower():
        msg = (
            "SMTP_PASSWORD in backend/.env is still set to placeholder text ('your-16-char-app-password-here'). "
            "Please paste your real 16-character Gmail App Password into backend/.env (from Google Account -> Security -> App Passwords)."
        )
        print(f"[EMAIL SERVICE] CRITICAL WARNING: {msg}")
        logger.warning("[EMAIL SERVICE] %s", msg)
        return None, msg

    try:
        port = int(os.getenv("SMTP_PORT", "587"))
    except ValueError:
        port = 587

    if not (1 <= port <= 65535):
        port = 587

    server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip() or "smtp.gmail.com"

    return {
        "email": email,
        "password": password,
        "server": server,
        "port": port,
    }, None


# ---------------------------------------------------------------------------
# HTML email template
# ---------------------------------------------------------------------------

def _build_html_email(
    disease: Optional[str],
    location_state: Optional[str],
    location_district: Optional[str],
    location_taluk: Optional[str],
    cases_count: Optional[int],
    detected_at: Optional[datetime],
    alert_message: Optional[str],
) -> str:
    """Return a mobile-friendly branded HTML email body for a HIGH RISK alert."""

    disease_label = disease or "Suspected Disease Outbreak"
    state_label = location_state or "Karnataka"
    district_label = location_district or "—"
    taluk_label = location_taluk or "—"
    cases_label = str(cases_count) if cases_count is not None else "—"
    detected_at_label = (
        detected_at.strftime("%d %B %Y, %I:%M %p UTC")
        if detected_at else datetime.utcnow().strftime("%d %B %Y, %I:%M %p UTC")
    )
    extra_info = (
        f'<p style="margin:0 0 8px 0;"><strong>Details:</strong> {alert_message}</p>'
        if alert_message else ""
    )

    current_year = datetime.utcnow().year

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HIGH RISK HEALTH ALERT — HealthGuard AI</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f4f7fb;padding:24px 0;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;
                      box-shadow:0 2px 12px rgba(0,0,0,0.10);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#c0392b 0%,#922b21 100%);
                        padding:28px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1px;">
                🛡️ HealthGuard AI
              </div>
              <div style="font-size:13px;color:#f5b7b1;margin-top:4px;letter-spacing:0.5px;">
                Smart Community Health Monitoring &amp; Early Warning System
              </div>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background:#e74c3c;padding:14px 32px;text-align:center;">
              <span style="display:inline-block;background:#ffffff;color:#c0392b;
                           font-size:15px;font-weight:700;letter-spacing:1.5px;
                           padding:6px 20px;border-radius:20px;">
                ⚠️ HIGH RISK HEALTH ALERT
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <p style="margin:0 0 20px 0;font-size:15px;color:#2c3e50;line-height:1.6;">
                Our disease risk surveillance system has detected a <strong style="color:#c0392b;">HIGH RISK</strong>
                health signal in your community. Please review the details below and take
                immediate precautionary measures.
              </p>

              <!-- Alert Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#fdf2f2;border:1px solid #f5b7b1;border-radius:8px;
                            margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h2 style="margin:0 0 16px 0;font-size:17px;color:#922b21;
                                border-bottom:2px solid #f5b7b1;padding-bottom:10px;">
                      🔴 Alert Details
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0;width:40%;font-size:13px;color:#7f8c8d;
                                   font-weight:600;vertical-align:top;">
                          Detected Disease / Outbreak:
                        </td>
                        <td style="padding:5px 0;font-size:14px;color:#2c3e50;
                                   font-weight:700;vertical-align:top;">
                          {disease_label}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#7f8c8d;
                                   font-weight:600;vertical-align:top;">
                          Affected State:
                        </td>
                        <td style="padding:5px 0;font-size:14px;color:#2c3e50;vertical-align:top;">
                          {state_label}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#7f8c8d;
                                   font-weight:600;vertical-align:top;">
                          Affected District:
                        </td>
                        <td style="padding:5px 0;font-size:14px;color:#2c3e50;vertical-align:top;">
                          {district_label}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#7f8c8d;
                                   font-weight:600;vertical-align:top;">
                          Affected Taluk:
                        </td>
                        <td style="padding:5px 0;font-size:14px;color:#2c3e50;vertical-align:top;">
                          {taluk_label}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#7f8c8d;
                                   font-weight:600;vertical-align:top;">
                          Risk Level:
                        </td>
                        <td style="padding:5px 0;vertical-align:top;">
                          <span style="display:inline-block;background:#c0392b;color:#ffffff;
                                       font-size:12px;font-weight:700;padding:3px 12px;
                                       border-radius:12px;letter-spacing:0.5px;">
                            HIGH
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#7f8c8d;
                                   font-weight:600;vertical-align:top;">
                          Reported Cases:
                        </td>
                        <td style="padding:5px 0;font-size:14px;color:#2c3e50;vertical-align:top;">
                          {cases_label}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#7f8c8d;
                                   font-weight:600;vertical-align:top;">
                          Date &amp; Time Detected:
                        </td>
                        <td style="padding:5px 0;font-size:14px;color:#2c3e50;vertical-align:top;">
                          {detected_at_label}
                        </td>
                      </tr>
                    </table>
                    {extra_info}
                  </td>
                </tr>
              </table>

              <!-- Preventive Measures -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#eaf4fc;border:1px solid #aed6f1;border-radius:8px;
                            margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h2 style="margin:0 0 14px 0;font-size:17px;color:#1a5276;
                                border-bottom:2px solid #aed6f1;padding-bottom:10px;">
                      🛡️ Recommended Preventive Measures
                    </h2>
                    <ul style="margin:0;padding-left:18px;color:#2c3e50;font-size:14px;
                               line-height:1.8;">
                      <li>Wash hands frequently with soap and clean water for at least 20 seconds.</li>
                      <li>Drink only boiled or purified water. Avoid untreated water sources.</li>
                      <li>Avoid crowded places and maintain physical distancing where possible.</li>
                      <li>Wear a mask in public areas, especially in markets and health facilities.</li>
                      <li>Keep surroundings clean; eliminate stagnant water to prevent mosquito breeding.</li>
                      <li>Eat freshly cooked food; avoid raw or street food during outbreak periods.</li>
                      <li>Isolate yourself if you experience symptoms to protect others.</li>
                      <li>Report any new cases to your nearest health worker or ASHA.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Medical Advice Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#fef9e7;border:1px solid #f9e79f;border-radius:8px;
                            margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;font-size:14px;color:#7d6608;line-height:1.6;">
                      <strong>⚕️ Medical Advice:</strong> If you or someone in your
                      household is experiencing symptoms such as fever, cough, diarrhoea,
                      rash, or difficulty breathing — <strong>contact a healthcare
                      professional or visit your nearest health centre immediately.</strong>
                      Do not self-medicate. This is an automated early-warning alert and
                      is not a medical diagnosis.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;border-top:1px solid #ecf0f1;
                        padding:20px 32px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:13px;color:#7f8c8d;">
                This is an automated alert from <strong>HealthGuard AI</strong> —
                Smart Community Health Monitoring &amp; Early Warning System.
              </p>
              <p style="margin:0;font-size:12px;color:#bdc3c7;">
                © {current_year} HealthGuard AI · Karnataka, India ·
                <em>Protecting communities through early detection.</em>
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#bdc3c7;">
                You are receiving this because you are a registered user of HealthGuard AI.
                Please do not reply to this automated email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _build_plain_text_email(
    disease: Optional[str],
    location_state: Optional[str],
    location_district: Optional[str],
    location_taluk: Optional[str],
    cases_count: Optional[int],
    detected_at: Optional[datetime],
    alert_message: Optional[str],
) -> str:
    """Plain-text fallback for email clients that cannot render HTML."""
    disease_label = disease or "Suspected Disease Outbreak"
    state_label = location_state or "Karnataka"
    district_label = location_district or "—"
    taluk_label = location_taluk or "—"
    cases_label = str(cases_count) if cases_count is not None else "—"
    detected_at_label = (
        detected_at.strftime("%d %B %Y, %I:%M %p UTC")
        if detected_at else datetime.utcnow().strftime("%d %B %Y, %I:%M %p UTC")
    )

    lines = [
        "=" * 60,
        "  HEALTHGUARD AI — HIGH RISK HEALTH ALERT",
        "  Smart Community Health Monitoring & Early Warning System",
        "=" * 60,
        "",
        "ALERT: A HIGH RISK health situation has been detected in your area.",
        "",
        "--- ALERT DETAILS ---",
        f"Detected Disease / Outbreak : {disease_label}",
        f"Affected State              : {state_label}",
        f"Affected District           : {district_label}",
        f"Affected Taluk              : {taluk_label}",
        f"Risk Level                  : HIGH",
        f"Reported Cases              : {cases_label}",
        f"Date & Time Detected        : {detected_at_label}",
    ]
    if alert_message:
        lines += ["", f"Details: {alert_message}"]

    lines += [
        "",
        "--- RECOMMENDED PREVENTIVE MEASURES ---",
        "• Wash hands frequently with soap and clean water.",
        "• Drink only boiled or purified water.",
        "• Avoid crowded places; maintain physical distancing.",
        "• Wear a mask in public areas.",
        "• Keep surroundings clean; eliminate stagnant water.",
        "• Eat freshly cooked food; avoid raw or street food.",
        "• Isolate yourself if you have symptoms.",
        "• Report new cases to your nearest health worker or ASHA.",
        "",
        "--- MEDICAL ADVICE ---",
        "If you or anyone in your household experiences fever, cough, diarrhoea,",
        "rash, or breathing difficulty — contact a healthcare professional or visit",
        "your nearest health centre IMMEDIATELY. Do not self-medicate.",
        "",
        "This is an automated early-warning alert and is NOT a medical diagnosis.",
        "",
        "=" * 60,
        "  HealthGuard AI · Karnataka, India",
        "  Protecting communities through early detection.",
        "  Please do not reply to this automated email.",
        "=" * 60,
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Core send function (single recipient)
# ---------------------------------------------------------------------------

def _send_single_email(
    smtp_cfg: dict,
    recipient_email: str,
    subject: str,
    html_body: str,
    plain_body: str,
) -> Tuple[bool, Optional[str]]:
    """
    Open one SMTP connection and send to a single recipient.
    Returns (True, None) on success, or (False, error_reason) on failure.
    Credentials are NEVER logged or exposed.
    """
    msg = MIMEMultipart("alternative")
    msg["From"] = f"HealthGuard AI Alerts <{smtp_cfg['email']}>"
    msg["To"] = recipient_email
    msg["Subject"] = subject

    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    print(f"[EMAIL SERVICE] Connecting to {smtp_cfg['server']}:{smtp_cfg['port']} via STARTTLS for {recipient_email}...")

    try:
        with smtplib.SMTP(smtp_cfg["server"], smtp_cfg["port"], timeout=10) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
            server.login(smtp_cfg["email"], smtp_cfg["password"])
            refused = server.send_message(msg)
            if refused:
                err_msg = f"SMTP server refused recipient {recipient_email}."
                print(f"[EMAIL SERVICE] FAILED: {err_msg}")
                logger.error("[EMAIL SERVICE] %s", err_msg)
                return False, err_msg

        success_msg = f"HIGH RISK alert email successfully delivered to {recipient_email}."
        print(f"[EMAIL SERVICE] SUCCESS: {success_msg}")
        logger.info("[EMAIL SERVICE] %s", success_msg)
        return True, None

    except smtplib.SMTPAuthenticationError as exc:
        err_msg = (
            f"Gmail SMTP Authentication rejected credentials for {smtp_cfg['email']} "
            f"(code {exc.smtp_code}: {exc.smtp_error.decode('utf-8', errors='ignore') if isinstance(exc.smtp_error, bytes) else str(exc.smtp_error)}). "
            f"Verify your 16-character Gmail App Password in backend/.env."
        )
        print(f"[EMAIL SERVICE] AUTHENTICATION ERROR: {err_msg}")
        logger.error("[EMAIL SERVICE] %s", err_msg)
        return False, err_msg

    except smtplib.SMTPConnectError as exc:
        err_msg = f"Could not connect to SMTP server {smtp_cfg['server']}:{smtp_cfg['port']} — {exc}"
        print(f"[EMAIL SERVICE] CONNECTION ERROR: {err_msg}")
        logger.error("[EMAIL SERVICE] %s", err_msg)
        return False, err_msg

    except Exception as exc:
        err_msg = f"Delivery failed for {recipient_email}: {type(exc).__name__} — {exc}"
        print(f"[EMAIL SERVICE] ERROR: {err_msg}")
        logger.error("[EMAIL SERVICE] %s", err_msg)
        return False, err_msg


# ---------------------------------------------------------------------------
# Duplicate-prevention helpers (use email_alert_log table)
# ---------------------------------------------------------------------------

def _already_sent(db, alert_id: int, recipient_email: str) -> bool:
    """Return True if this alert has already been emailed to this address."""
    try:
        row = db.execute(
            text(
                "SELECT 1 FROM email_alert_log "
                "WHERE alert_id = :aid AND recipient_email = :email LIMIT 1"
            ),
            {"aid": alert_id, "email": recipient_email},
        ).fetchone()
        return row is not None
    except Exception as exc:
        logger.warning(
            "[EMAIL SERVICE] Could not check email_alert_log for alert %d / %s — %s. Allowing send.",
            alert_id, recipient_email, exc,
        )
        return False


def _record_sent(db, alert_id: int, recipient_email: str) -> None:
    """Insert a row into email_alert_log to prevent future duplicates."""
    try:
        db.execute(
            text(
                "INSERT INTO email_alert_log (alert_id, recipient_email, sent_at) "
                "VALUES (:aid, :email, :sent_at) "
                "ON CONFLICT (alert_id, recipient_email) DO NOTHING"
            ),
            {
                "aid": alert_id,
                "email": recipient_email,
                "sent_at": datetime.utcnow(),
            },
        )
        db.commit()
    except Exception as exc:
        logger.warning(
            "[EMAIL SERVICE] Could not record send in email_alert_log for alert %d / %s — %s",
            alert_id, recipient_email, exc,
        )


# ---------------------------------------------------------------------------
# Public API — called from reports_routes.py
# ---------------------------------------------------------------------------

def send_high_risk_alert_emails(
    alert_id: int,
    disease: Optional[str] = None,
    location_state: Optional[str] = None,
    location_district: Optional[str] = None,
    location_taluk: Optional[str] = None,
    cases_count: Optional[int] = None,
    detected_at: Optional[datetime] = None,
    alert_message: Optional[str] = None,
    db_session=None,
) -> dict:
    """
    Send a branded HIGH RISK health alert email to ALL registered users who
    have an email address on record.

    • Retrieves recipient addresses from the database — no hardcoded emails.
    • Checks email_alert_log before sending to avoid duplicate emails.
    • Manages its own database session if not provided, ensuring background tasks never fail.
    • Never raises; all SMTP failures are caught, logged, and isolated.
    • Returns a summary dict: {"sent": int, "skipped": int, "failed": int}
    """
    _ensure_log_table_exists()

    smtp_cfg, err = _get_smtp_config()
    if smtp_cfg is None:
        print(f"[EMAIL SERVICE] CANNOT SEND: {err}")
        return {
            "status": "failed",
            "sent": 0,
            "sent_count": 0,
            "failed": 0,
            "failed_count": 0,
            "skipped": 0,
            "skipped_count": 0,
            "recipients_count": 0,
            "recipients": [],
            "message": f"Email delivery failed: {err}",
            "error": err
        }

    # Open a fresh database session if none is passed or if the session is closed
    own_session = False
    db = db_session
    if db is None or not getattr(db, "is_active", False):
        db = SessionLocal()
        own_session = True

    try:
        # Fetch all registered users with a non-null email
        from backend.app.models.db_models import User
        users = db.query(User).filter(User.email.isnot(None)).all()
        recipient_emails: List[str] = [
            u.email.strip().lower()
            for u in users
            if u.email and u.email.strip()
        ]

        if not recipient_emails:
            print(f"[EMAIL SERVICE] No registered users with an email found in database for alert_id={alert_id}.")
            return {
                "status": "no_recipients",
                "sent": 0,
                "sent_count": 0,
                "failed": 0,
                "failed_count": 0,
                "skipped": 0,
                "skipped_count": 0,
                "recipients_count": 0,
                "recipients": [],
                "message": "No registered email recipients found",
                "error": None
            }

        print(f"[EMAIL SERVICE] Initiating HIGH RISK alert email dispatch for alert #{alert_id}")
        print(f"[EMAIL SERVICE] Found {len(recipient_emails)} registered recipient(s): {', '.join(recipient_emails)}")

        subject = f"🚨 HealthGuard AI – High Disease Risk Alert: {disease or 'Outbreak'} in {location_taluk or location_district or location_state or 'Your Area'}"
        html_body = _build_html_email(
            disease, location_state, location_district, location_taluk,
            cases_count, detected_at, alert_message,
        )
        plain_body = _build_plain_text_email(
            disease, location_state, location_district, location_taluk,
            cases_count, detected_at, alert_message,
        )

        sent = 0
        skipped = 0
        failed = 0
        last_error = None

        for email in recipient_emails:
            # Duplicate-alert prevention
            if _already_sent(db, alert_id, email):
                print(f"[EMAIL SERVICE] Skipping duplicate HIGH RISK alert #{alert_id} for {email} (already recorded).")
                skipped += 1
                continue

            success, send_err = _send_single_email(smtp_cfg, email, subject, html_body, plain_body)
            if success:
                _record_sent(db, alert_id, email)
                sent += 1
            else:
                failed += 1
                last_error = send_err

        print(f"[EMAIL SERVICE] Dispatch summary for alert #{alert_id}: Sent={sent}, Skipped={skipped}, Failed={failed}")
        status = "success" if sent > 0 else ("skipped" if skipped > 0 and failed == 0 else "failed")
        msg_str = (
            f"Email sent successfully to {sent} registered user(s)"
            if sent > 0
            else (
                f"Email already sent to {skipped} recipient(s) for this alert (duplicate prevented)."
                if skipped > 0 and failed == 0
                else f"Email delivery failed: {last_error or 'SMTP failure'}"
            )
        )
        return {
            "status": status,
            "sent": sent,
            "sent_count": sent,
            "failed": failed,
            "failed_count": failed,
            "skipped": skipped,
            "skipped_count": skipped,
            "recipients_count": len(recipient_emails),
            "recipients": recipient_emails,
            "message": msg_str,
            "error": last_error,
        }

    except Exception as exc:
        print(f"[EMAIL SERVICE] Unexpected error during email dispatch: {exc}")
        logger.error("[EMAIL SERVICE] Unexpected error: %s", exc)
        return {
            "status": "failed",
            "sent": 0,
            "sent_count": 0,
            "failed": 1,
            "failed_count": 1,
            "skipped": 0,
            "skipped_count": 0,
            "recipients_count": len(recipient_emails) if 'recipient_emails' in locals() else 0,
            "recipients": recipient_emails if 'recipient_emails' in locals() else [],
            "message": f"Email delivery failed: {exc}",
            "error": str(exc),
        }
    finally:
        if own_session and db is not None:
            db.close()


# ---------------------------------------------------------------------------
# Test Helpers: SMTP Connection Test & Diagnostic Email Send
# ---------------------------------------------------------------------------

def test_smtp_connection() -> Dict[str, Any]:
    """
    Test helper: Validates SMTP settings, performs STARTTLS handshake,
    and attempts authentication with smtp.gmail.com:587.
    Returns status dict with diagnostics.
    """
    smtp_cfg, err = _get_smtp_config()
    if smtp_cfg is None:
        return {
            "status": "failed",
            "code": "CONFIG_ERROR",
            "message": err,
            "sender": os.getenv("SMTP_EMAIL", "healthguardai.alerts@gmail.com"),
            "server": f"{os.getenv('SMTP_SERVER', 'smtp.gmail.com')}:{os.getenv('SMTP_PORT', '587')}",
        }

    try:
        print(f"[EMAIL SERVICE] Testing SMTP connection to {smtp_cfg['server']}:{smtp_cfg['port']}...")
        with smtplib.SMTP(smtp_cfg["server"], smtp_cfg["port"], timeout=10) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
            server.login(smtp_cfg["email"], smtp_cfg["password"])

        msg = f"Successfully authenticated to {smtp_cfg['server']}:{smtp_cfg['port']} as {smtp_cfg['email']}."
        print(f"[EMAIL SERVICE] SUCCESS: {msg}")
        return {
            "status": "success",
            "message": msg,
            "sender": smtp_cfg["email"],
            "server": f"{smtp_cfg['server']}:{smtp_cfg['port']}",
        }
    except smtplib.SMTPAuthenticationError as exc:
        err_msg = (
            f"Gmail SMTP Authentication rejected credentials for {smtp_cfg['email']} "
            f"(code {exc.smtp_code}). Verify your 16-character Gmail App Password in backend/.env."
        )
        print(f"[EMAIL SERVICE] AUTHENTICATION ERROR: {err_msg}")
        return {
            "status": "failed",
            "code": "AUTH_ERROR",
            "message": err_msg,
            "sender": smtp_cfg["email"],
            "server": f"{smtp_cfg['server']}:{smtp_cfg['port']}",
        }
    except Exception as exc:
        err_msg = f"Failed to connect to SMTP server {smtp_cfg['server']}:{smtp_cfg['port']} — {exc}"
        print(f"[EMAIL SERVICE] CONNECTION ERROR: {err_msg}")
        return {
            "status": "failed",
            "code": "CONNECT_ERROR",
            "message": err_msg,
            "sender": smtp_cfg["email"],
            "server": f"{smtp_cfg['server']}:{smtp_cfg['port']}",
        }


def send_test_email(recipient_email: str) -> Dict[str, Any]:
    """
    Test helper: Attempts to send a sample HIGH RISK alert email to verify
    SMTP credentials, STARTTLS handshake, and network connectivity.
    Returns status dict with diagnostics.
    """
    _ensure_log_table_exists()

    smtp_cfg, err = _get_smtp_config()
    if smtp_cfg is None:
        return {
            "status": "error",
            "code": "CONFIG_ERROR",
            "message": err,
            "sender": os.getenv("SMTP_EMAIL", ""),
            "server": f"{os.getenv('SMTP_SERVER', 'smtp.gmail.com')}:{os.getenv('SMTP_PORT', '587')}",
        }

    subject = "🚨 HealthGuard AI – High Disease Risk Alert [SMTP Diagnostic Test]"
    now = datetime.utcnow()
    html_body = _build_html_email(
        disease="Dengue Fever Cluster (Test Alert)",
        location_state="Karnataka",
        location_district="Bengaluru Urban",
        location_taluk="Bengaluru North",
        cases_count=3,
        detected_at=now,
        alert_message="This is a test notification verifying Gmail SMTP configuration and automated dispatch.",
    )
    plain_body = _build_plain_text_email(
        disease="Dengue Fever Cluster (Test Alert)",
        location_state="Karnataka",
        location_district="Bengaluru Urban",
        location_taluk="Bengaluru North",
        cases_count=3,
        detected_at=now,
        alert_message="This is a test notification verifying Gmail SMTP configuration and automated dispatch.",
    )

    success, send_err = _send_single_email(smtp_cfg, recipient_email, subject, html_body, plain_body)
    if success:
        return {
            "status": "success",
            "message": f"Test email successfully delivered to {recipient_email}!",
            "sender": smtp_cfg["email"],
            "recipient": recipient_email,
            "smtp_server": f"{smtp_cfg['server']}:{smtp_cfg['port']}",
        }
    else:
        return {
            "status": "error",
            "code": "SMTP_SEND_FAILED",
            "message": send_err or "Failed to deliver email.",
            "sender": smtp_cfg["email"],
            "recipient": recipient_email,
            "smtp_server": f"{smtp_cfg['server']}:{smtp_cfg['port']}",
        }


def send_high_risk_alert_email(
    recipient_email: Optional[str],
    alert_title: str,
    alert_message: str,
) -> bool:
    """Backward-compatible single-recipient wrapper."""
    if not recipient_email or not recipient_email.strip():
        return False
    smtp_cfg, err = _get_smtp_config()
    if smtp_cfg is None:
        return False
    plain = (
        f"HIGH RISK HEALTH ALERT\n\n{alert_title}\n\n{alert_message}\n\n"
        "This automated alert is not a medical diagnosis. "
        "Please contact a healthcare professional for medical advice."
    )
    success, _ = _send_single_email(smtp_cfg, recipient_email.strip(), alert_title, plain, plain)
    return success
