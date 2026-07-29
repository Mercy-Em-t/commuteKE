import os
import smtplib
import json
from datetime import datetime
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_USER = os.getenv("MAIL_CLIENT_ID")
SMTP_PASS = os.getenv("MAIL_SECRET")
SMTP_SERVER = "tms-mail.tmsavannah.com"
SMTP_PORT = 587
INQUIRY_INBOX = os.getenv("INQUIRY_INBOX", "memurugat@gmail.com")

def _log_inquiry_fallback(user_name: str, user_email: str, inquiry_type: str, message: str):
    """Persist inquiry to /tmp/inquiries.jsonl so nothing is lost if SMTP fails."""
    try:
        entry = {
            "ts": datetime.utcnow().isoformat(),
            "name": user_name,
            "email": user_email,
            "type": inquiry_type,
            "message": message
        }
        with open("/tmp/inquiries.jsonl", "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as log_err:
        print(f"[Inquiry Log] Could not write fallback log: {log_err}")

def send_inquiry_email(user_name: str, user_email: str, inquiry_type: str, message: str) -> dict:
    """Sends a system notification email to the admin team via SMTP."""

    # Always persist inquiry first so nothing is ever silently dropped
    _log_inquiry_fallback(user_name, user_email, inquiry_type, message)

    if not SMTP_USER or not SMTP_PASS:
        print("[Mail] MAIL_CLIENT_ID or MAIL_SECRET not set — inquiry logged to /tmp/inquiries.jsonl only.")
        return {"success": True, "mock": True}

    msg = EmailMessage()
    msg['Subject'] = f"[Transy Inquiry] {inquiry_type} from {user_name}"
    msg['From'] = SMTP_USER
    msg['To'] = INQUIRY_INBOX
    msg['Reply-To'] = user_email

    content = (
        f"New Inquiry — Transy Platform\n"
        f"{'='*40}\n"
        f"Name:    {user_name}\n"
        f"Email:   {user_email}\n"
        f"Type:    {inquiry_type}\n"
        f"Time:    {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
        f"{'='*40}\n\n"
        f"{message}"
    )
    msg.set_content(content)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        print(f"[Mail] Inquiry from {user_email} dispatched to {INQUIRY_INBOX}")
        return {"success": True}
    except Exception as e:
        print(f"[Mail Error] SMTP failed — inquiry still logged. Error: {e}")
        return {"success": True, "mock": True, "smtp_error": str(e)}
