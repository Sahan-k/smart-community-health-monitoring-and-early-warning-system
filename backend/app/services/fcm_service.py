"""
Firebase Cloud Messaging (FCM) service for HealthGuard AI.
Handles push notification sending and location-based targeting.
Admin SDK credentials are loaded from environment only — never from frontend.
"""
import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Firebase Admin SDK initialisation (lazy, singleton)
# ---------------------------------------------------------------------------

_firebase_app = None


def _get_firebase_app():
    """Initialise Firebase Admin SDK once and return the app instance."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON", "").strip()
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()

        if cred_json:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
        elif cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            logger.warning(
                "FCM: No Firebase credentials found. "
                "Set FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH."
            )
            return None

        # Only initialise if not already done (supports hot-reload)
        try:
            _firebase_app = firebase_admin.get_app()
        except ValueError:
            _firebase_app = firebase_admin.initialize_app(cred)

        logger.info("FCM: Firebase Admin SDK initialised successfully.")
        return _firebase_app

    except ImportError:
        logger.error("FCM: firebase-admin package not installed. Run: pip install firebase-admin")
        return None
    except Exception as exc:
        logger.error("FCM: Failed to initialise Firebase Admin SDK: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Multilingual precaution templates
# ---------------------------------------------------------------------------

PRECAUTION_TEMPLATES = {
    "en": {
        "default": "Wash hands frequently, drink safe water, avoid crowded places, and seek medical help if symptoms worsen.",
        "Dengue": "Eliminate stagnant water, use mosquito repellents, wear full-sleeve clothing, and visit a doctor if fever persists.",
        "Malaria": "Use bed nets, apply insect repellent, avoid outdoor activity at dusk/dawn, and get tested if fever recurs.",
        "Cholera": "Drink only boiled or bottled water, avoid raw foods, use ORS for diarrhea, and visit nearest health centre.",
        "Typhoid": "Drink safe water, avoid street food, wash vegetables, and complete the full antibiotic course if prescribed.",
        "Viral Fever": "Rest, stay hydrated, take prescribed medication, and avoid contact with others to prevent spread.",
        "Tuberculosis": "Complete the full treatment course, cover mouth while coughing, ventilate rooms, and isolate if advised.",
    },
    "kn": {
        "default": "ಆಗಾಗ್ಗೆ ಕೈ ತೊಳೆಯಿರಿ, ಸುರಕ್ಷಿತ ನೀರು ಕುಡಿಯಿರಿ, ಜನಸಂದಣಿಯ ಸ್ಥಳಗಳನ್ನು ತಪ್ಪಿಸಿ ಮತ್ತು ಲಕ್ಷಣಗಳು ಹದಗೆಟ್ಟರೆ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ.",
        "Dengue": "ನಿಂತ ನೀರನ್ನು ತೆಗೆದುಹಾಕಿ, ಸೊಳ್ಳೆ ನಿರೋಧಕ ಬಳಸಿ, ಪೂರ್ಣ ತೋಳಿನ ಬಟ್ಟೆ ಧರಿಸಿ.",
        "Malaria": "ಸೊಳ್ಳೆ ಪರದೆ ಬಳಸಿ, ಕೀಟ ನಿರೋಧಕ ಲೇಪಿಸಿ, ಸಂಧ್ಯಾಕಾಲ/ಮುಂಜಾನೆ ಹೊರಗೆ ಹೋಗುವುದನ್ನು ತಪ್ಪಿಸಿ.",
        "Cholera": "ಕುದಿಸಿದ/ಬಾಟಲ್ ನೀರು ಮಾತ್ರ ಕುಡಿಯಿರಿ, ಕಚ್ಚಾ ಆಹಾರ ತಪ್ಪಿಸಿ, ಭೇದಿಗೆ ORS ಬಳಸಿ.",
        "Viral Fever": "ವಿಶ್ರಾಂತಿ ತೆಗೆಳ್ಳಿ, ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ, ಮನೆಯಲ್ಲಿರಿ ಮತ್ತು ಡಾಕ್ಟರ್ ಸಲಹೆ ಪಾಲಿಸಿ.",
    },
    "hi": {
        "default": "बार-बार हाथ धोएं, सुरक्षित पानी पिएं, भीड़भाड़ वाली जगहों से बचें और लक्षण बिगड़ने पर डॉक्टर से मिलें।",
        "Dengue": "रुके हुए पानी को हटाएं, मच्छर भगाने वाली क्रीम लगाएं, पूरी बाँह के कपड़े पहनें।",
        "Malaria": "मच्छरदानी का उपयोग करें, शाम/सुबह बाहर न जाएं, बुखार बार-बार आए तो जांच कराएं।",
        "Cholera": "केवल उबला/बोतलबंद पानी पिएं, कच्चा खाना न खाएं, दस्त के लिए ORS लें।",
        "Viral Fever": "आराम करें, खूब पानी पिएं, डॉक्टर की दवा लें और दूसरों के संपर्क से बचें।",
    },
}


def _get_precautions(disease: Optional[str], lang: str) -> str:
    lang_map = PRECAUTION_TEMPLATES.get(lang, PRECAUTION_TEMPLATES["en"])
    if disease and disease in lang_map:
        return lang_map[disease]
    return lang_map.get("default", PRECAUTION_TEMPLATES["en"]["default"])


ALERT_TITLE_TEMPLATES = {
    "en": "🚨 Health Alert: {disease} in {location}",
    "kn": "🚨 ಆರೋಗ್ಯ ಎಚ್ಚರಿಕೆ: {location}ನಲ್ಲಿ {disease}",
    "hi": "🚨 स्वास्थ्य चेतावनी: {location} में {disease}",
}

ALERT_BODY_TEMPLATES = {
    "en": "{risk_level} risk detected. {precautions}",
    "kn": "{risk_level} ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ. {precautions}",
    "hi": "{risk_level} जोखिम पाया गया। {precautions}",
}

RISK_LABELS = {
    "en": {"High Risk": "High", "Medium Risk": "Medium", "Low Risk": "Low",
           "High Risk Signal": "High", "low": "Low", "medium": "Medium", "high": "High"},
    "kn": {"High Risk": "ಹೆಚ್ಚಿನ", "Medium Risk": "ಮಧ್ಯಮ", "Low Risk": "ಕಡಿಮೆ",
           "High Risk Signal": "ಹೆಚ್ಚಿನ", "low": "ಕಡಿಮೆ", "medium": "ಮಧ್ಯಮ", "high": "ಹೆಚ್ಚಿನ"},
    "hi": {"High Risk": "उच्च", "Medium Risk": "मध्यम", "Low Risk": "निम्न",
           "High Risk Signal": "उच्च", "low": "निम्न", "medium": "मध्यम", "high": "उच्च"},
}


# ---------------------------------------------------------------------------
# Core send function
# ---------------------------------------------------------------------------

def send_push_notification(
    tokens: list,
    title: str,
    body: str,
    data: dict = None,
) -> dict:
    """
    Send FCM push notification to a list of device tokens.
    Returns a dict with sent/failed counts and failed tokens.
    """
    if not tokens:
        return {"sent": 0, "failed": 0, "failed_tokens": []}

    app = _get_firebase_app()
    if app is None:
        logger.warning("FCM: Firebase app not initialised. Skipping push.")
        return {"sent": 0, "failed": 0, "failed_tokens": [], "error": "Firebase not configured"}

    try:
        from firebase_admin import messaging

        # Build multicast message
        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon="/favicon.ico",
                    badge="/favicon.ico",
                    require_interaction=True,
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link=data.get("click_url", "/") if data else "/"
                ),
            ),
        )

        response = messaging.send_each_for_multicast(message)
        failed_tokens = []
        for idx, resp in enumerate(response.responses):
            if not resp.success:
                failed_tokens.append(tokens[idx])
                logger.warning("FCM: Token failed: %s — %s", tokens[idx][:20], resp.exception)

        logger.info(
            "FCM: Sent %d, Failed %d out of %d tokens.",
            response.success_count, response.failure_count, len(tokens)
        )
        return {
            "sent": response.success_count,
            "failed": response.failure_count,
            "failed_tokens": failed_tokens,
        }

    except Exception as exc:
        logger.error("FCM: send_push_notification error: %s", exc)
        return {"sent": 0, "failed": len(tokens), "failed_tokens": tokens, "error": str(exc)}


# ---------------------------------------------------------------------------
# Deactivate failed tokens in DB
# ---------------------------------------------------------------------------

def deactivate_failed_tokens(failed_tokens: list, db):
    """Mark FCM tokens that FCM rejected as inactive."""
    if not failed_tokens:
        return
    try:
        from backend.app.models.db_models import FCMToken
        db.query(FCMToken).filter(FCMToken.token.in_(failed_tokens)).update(
            {"is_active": False}, synchronize_session=False
        )
        db.commit()
        logger.info("FCM: Deactivated %d failed tokens.", len(failed_tokens))
    except Exception as exc:
        logger.error("FCM: Failed to deactivate tokens: %s", exc)


# ---------------------------------------------------------------------------
# Alert notification dispatcher
# ---------------------------------------------------------------------------

def send_alert_push_notifications(
    alert_id: int,
    disease: Optional[str],
    risk_level: Optional[str],
    location_name: Optional[str],
    db,
):
    """
    Build and send push notifications for a verified alert.
    Sends to ALL users with active FCM tokens (community-wide),
    with language-aware messages per user's preferred_language.
    Deactivates tokens rejected by FCM.
    """
    try:
        from backend.app.models.db_models import FCMToken, User
        from sqlalchemy.orm import Session

        # Fetch all active tokens with user preferred language
        rows = (
            db.query(FCMToken.token, User.preferred_language)
            .join(User, FCMToken.user_id == User.id)
            .filter(FCMToken.is_active == True)
            .all()
        )

        if not rows:
            logger.info("FCM: No active FCM tokens found. Skipping push for alert %d.", alert_id)
            return

        disease_label = disease or "Health Issue"
        location_label = location_name or "your area"
        risk_label_en = risk_level or "Unknown"
        click_url = f"/alerts/{alert_id}"

        # Group tokens by language for efficiency
        lang_groups: dict = {}  # lang -> [token]
        for token, lang in rows:
            lng = lang or "en"
            if lng not in ALERT_TITLE_TEMPLATES:
                lng = "en"
            lang_groups.setdefault(lng, []).append(token)

        all_failed: list = []

        for lang, token_list in lang_groups.items():
            risk_translated = RISK_LABELS.get(lang, RISK_LABELS["en"]).get(risk_label_en, risk_label_en)
            precautions = _get_precautions(disease_label, lang)

            title = ALERT_TITLE_TEMPLATES.get(lang, ALERT_TITLE_TEMPLATES["en"]).format(
                disease=disease_label, location=location_label
            )
            body = ALERT_BODY_TEMPLATES.get(lang, ALERT_BODY_TEMPLATES["en"]).format(
                risk_level=risk_translated, precautions=precautions
            )

            result = send_push_notification(
                tokens=token_list,
                title=title,
                body=body,
                data={
                    "alert_id": str(alert_id),
                    "disease": disease_label,
                    "risk_level": risk_label_en,
                    "location": location_label,
                    "click_url": click_url,
                    "type": "health_alert",
                },
            )
            all_failed.extend(result.get("failed_tokens", []))

        if all_failed:
            deactivate_failed_tokens(all_failed, db)

    except Exception as exc:
        logger.error("FCM: send_alert_push_notifications error: %s", exc)
