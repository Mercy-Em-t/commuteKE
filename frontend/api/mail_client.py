import os
import json
import jwt
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# We expect these in the Vercel Environment Variables:
# MAIL_CLIENT_ID=commute_tmsavannah
# MAIL_SECRET=1aC9JclGrTWUgS5csXknleEqfFmhFo3wnmtkLfrbRc3AWh/goODWBVN3oQ5uPALy

CLIENT_ID = os.getenv("MAIL_CLIENT_ID", "commute_tmsavannah")
CLIENT_SECRET = os.getenv("MAIL_SECRET")
MAIL_DISPATCH_URL = "https://mail.tmsavannah.com/api/dispatch"
INQUIRY_INBOX = os.getenv("INQUIRY_INBOX", "memurugat@gmail.com")

def _log_inquiry_fallback(user_name: str, user_email: str, inquiry_type: str, message: str):
    """Persist inquiry to /tmp/inquiries.jsonl so nothing is lost if mail server fails."""
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

def _get_highway_token():
    if not CLIENT_SECRET:
        return None
    return jwt.encode(
        {"client_id": CLIENT_ID, "domain": "commute.tmsavannah.com"},
        CLIENT_SECRET,
        algorithm="HS256"
        # Note: PyJWT automatically handles expiry if 'exp' is provided, but we are keeping it simple for this script as long as the server accepts it without 'exp', or we can add it:
        # "exp": datetime.utcnow() + timedelta(minutes=10)
    )

def send_inquiry_email(user_name: str, user_email: str, inquiry_type: str, message: str) -> dict:
    """Sends a system notification email to the admin team via TM Savannah Mail Server."""

    # Always persist inquiry first so nothing is ever silently dropped
    _log_inquiry_fallback(user_name, user_email, inquiry_type, message)

    token = _get_highway_token()
    if not token:
        print("[Mail] MAIL_SECRET not set — inquiry logged to /tmp/inquiries.jsonl only.")
        return {"success": True, "mock": True}

    html_content = (
        f"<h2>New Inquiry — Transy Platform</h2>"
        f"<hr/>"
        f"<p><strong>Name:</strong> {user_name}</p>"
        f"<p><strong>Email:</strong> {user_email}</p>"
        f"<p><strong>Type:</strong> {inquiry_type}</p>"
        f"<p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>"
        f"<hr/>"
        f"<p>{message}</p>"
    )

    payload = {
        "client_id": CLIENT_ID,
        "to": INQUIRY_INBOX,
        "subject": f"[Transy Inquiry] {inquiry_type} from {user_name}",
        "html": html_content,
        "message_type": "notification",
        "replyTo": user_email
    }

    try:
        response = requests.post(
            MAIL_DISPATCH_URL,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "x-highway-token": token
            },
            timeout=10
        )
        response.raise_for_status()
        return {"success": True, "response": response.json()}
    except Exception as e:
        print(f"[Mail Error] Failed to send via TM Savannah Mail Server: {e}")
        return {"success": False, "error": str(e)}
