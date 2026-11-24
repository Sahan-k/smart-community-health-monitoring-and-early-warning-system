# HealthGuard AI — Email Alert System Setup

Automated HIGH RISK health alert emails are sent to **all registered users**
whose email address is on file in the database. Email delivery uses Gmail SMTP
with an App Password and runs in the background after a HIGH RISK report is
submitted — it never delays the API response or crashes the application.

---

## 1. Environment Variables

Configure the following in `backend/.env`:

```env
SMTP_EMAIL=healthguardai.alerts@gmail.com
SMTP_PASSWORD=your-16-character-google-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

> **Never** commit `.env` to version control. `.env.example` contains safe
> placeholder values and is safe to commit.

---

## 2. Generating a Gmail App Password

1. Sign in to the **Google Account** for `healthguardai.alerts@gmail.com`.
2. Go to **Google Account → Security → How you sign in → 2-Step Verification**
   and ensure it is **enabled**.
3. Navigate to **Google Account → Security → App Passwords** (search "App Passwords").
4. Select app **"Mail"** and device **"Other (Custom name)"** → type `HealthGuard AI`.
5. Click **Generate** — copy the 16-character password shown.
6. Paste it as the value of `SMTP_PASSWORD` in `backend/.env`.

> App Passwords only appear if 2-Step Verification is active.
> Use the 16-character App Password — **not** your regular Gmail password.

---

## 3. Database Migration (run once)

The email notification system requires an `email_alert_log` table to prevent
duplicate emails being sent for the same alert.

```bash
# From the project root (activate your venv first)
python -m backend.app.database.migrations.add_email_alert_log
```

Expected output:
```
[Migration] email_alert_log table created (or already exists). Done.
```

This is idempotent — safe to run multiple times.

---

## 4. How It Works

| Step | What happens |
|------|-------------|
| User submits a health report | `POST /api/reports` is called |
| ML model + 7-day rolling window | Risk is calculated (`Low / Medium / High`) |
| HIGH Risk detected | An `Alert` record is created in the DB |
| Background task fires | `send_high_risk_alert_emails()` is queued via `BackgroundTasks` |
| Recipient list fetched | All `users` rows with a non-null `email` are queried from the DB |
| Duplicate check | `email_alert_log` is queried — already-sent emails are skipped |
| Emails dispatched | HTML + plain-text email sent via Gmail SMTP (STARTTLS port 587) |
| Result recorded | Successful sends are inserted into `email_alert_log` |
| Failure isolation | SMTP failures are logged; the application continues normally |

---

## 5. Email Content

Each alert email includes:

- **HealthGuard AI branding** (header + footer)
- Alert title: **HIGH RISK HEALTH ALERT**
- Detected disease / suspected outbreak
- Affected location: State, District, Taluk
- Risk level: **HIGH** (badge)
- Number of reported cases
- Date and time of detection
- Recommended preventive measures (bulleted list)
- Medical advice (contact healthcare professionals if symptomatic)
- Professional HTML layout (mobile-friendly) with plain-text fallback

---

## 6. Files Modified / Created

| File | Change |
|------|--------|
| `backend/app/services/email_service.py` | **Replaced** — full rewrite with HTML email, multi-user dispatch, dedup |
| `backend/app/routes/reports_routes.py` | Updated to call `send_high_risk_alert_emails()` with full context |
| `backend/app/models/db_models.py` | Added `EmailAlertLog` SQLAlchemy model |
| `backend/app/database/migrations/add_email_alert_log.py` | **New** — creates `email_alert_log` table |
| `backend/.env` | Added SMTP variables (SMTP_EMAIL, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT) |
| `backend/.env.example` | **New** — placeholder credentials for version control |
| `backend/EMAIL_ALERTS_SETUP.md` | **Updated** — this file |

---

## 7. Testing Safely

Before enabling for all users, test with a known address:

```python
# Run from the project root (venv activated)
# Edit the test snippet values before running
python - <<'EOF'
import os, sys
from pathlib import Path
sys.path.insert(0, str(Path(".").resolve()))
from dotenv import load_dotenv
load_dotenv("backend/.env")

from backend.app.services.email_service import _get_smtp_config, _send_single_email
from backend.app.services.email_service import _build_html_email, _build_plain_text_email
from datetime import datetime

cfg = _get_smtp_config()
if not cfg:
    print("SMTP not configured — set SMTP_EMAIL and SMTP_PASSWORD in backend/.env")
else:
    html = _build_html_email("Dengue", "Karnataka", "Bengaluru Urban", "Bengaluru North", 12, datetime.utcnow(), None)
    plain = _build_plain_text_email("Dengue", "Karnataka", "Bengaluru Urban", "Bengaluru North", 12, datetime.utcnow(), None)
    ok = _send_single_email(cfg, "your-test-email@example.com", "TEST — HealthGuard AI Alert", html, plain)
    print("Sent!" if ok else "Failed — check logs.")
EOF
```

Replace `your-test-email@example.com` with your own address.

---

## 8. Security Notes

- SMTP credentials are **only** in `backend/.env` — never in source code, API responses, or logs.
- `.env` is (and must remain) in `.gitignore`.
- Recipient emails are fetched from the database — never hardcoded.
- The `email_alert_log` table uses a `UNIQUE(alert_id, recipient_email)` constraint as a database-level safeguard against duplicate inserts.
