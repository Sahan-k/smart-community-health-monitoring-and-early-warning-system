import os
import unittest
from unittest.mock import patch

from backend.app.services import email_service


class HighRiskEmailTests(unittest.TestCase):
    def test_sends_gmail_smtp_message_when_configured(self):
        smtp_connection = unittest.mock.Mock()
        smtp_client = unittest.mock.MagicMock()
        smtp_client.__enter__.return_value = smtp_connection
        smtp_connection.send_message.return_value = {}

        with patch.dict(
            os.environ,
            {
                "SMTP_USERNAME": "alerts@example.com",
                "SMTP_PASSWORD": "app-password",
                "SMTP_FROM_EMAIL": "alerts@example.com",
            },
            clear=True,
        ), patch.object(email_service.smtplib, "SMTP", return_value=smtp_client) as smtp:
            sent = email_service.send_high_risk_alert_email(
                "member@example.com",
                "High Risk Signal: Dengue",
                "A high risk has been detected in the report area.",
            )

        self.assertTrue(sent)
        smtp.assert_called_once_with("smtp.gmail.com", 587, timeout=10)
        smtp_connection.starttls.assert_called_once()
        smtp_connection.login.assert_called_once_with("alerts@example.com", "app-password")
        message = smtp_connection.send_message.call_args.args[0]
        self.assertEqual(message["To"], "member@example.com")
        decoded_payload = message.get_payload()[0].get_payload(decode=True).decode('utf-8')
        self.assertIn("not a medical diagnosis", decoded_payload)

    def test_skips_delivery_when_smtp_credentials_are_missing(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(
            email_service.smtplib, "SMTP"
        ) as smtp:
            sent = email_service.send_high_risk_alert_email(
                "member@example.com",
                "High Risk Signal: Dengue",
                "A high risk has been detected in the report area.",
            )

        self.assertFalse(sent)
        smtp.assert_not_called()

    def test_skips_delivery_when_recipient_has_no_email(self):
        with patch.object(email_service.smtplib, "SMTP") as smtp:
            sent = email_service.send_high_risk_alert_email(
                None,
                "High Risk Signal: Dengue",
                "A high risk has been detected in the report area.",
            )

        self.assertFalse(sent)
        smtp.assert_not_called()


if __name__ == "__main__":
    unittest.main()
