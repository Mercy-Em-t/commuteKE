import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_USER = os.getenv("MAIL_CLIENT_ID")
SMTP_PASS = os.getenv("MAIL_SECRET")
SMTP_SERVER = "tms-mail.tmsavannah"
SMTP_PORT = 587 # Default SMTP submission port

def send_inquiry_email(user_name: str, user_email: str, inquiry_type: str, message: str) -> dict:
    """Sends a system notification email to the admin team via SMTP."""
    
    if not SMTP_USER or not SMTP_PASS:
        print("Warning: MAIL_CLIENT_ID or MAIL_SECRET is missing. Simulating SMTP email.")
        return {"success": True, "mock": True}
        
    msg = EmailMessage()
    msg['Subject'] = f"New Inquiry: {inquiry_type} from {user_name}"
    msg['From'] = SMTP_USER
    msg['To'] = "memurugat@gmail.com" # Internal team
    msg['Reply-To'] = user_email
    
    content = f"Brand: Transy\nUser Email: {user_email}\n\nMessage:\n{message}"
    msg.set_content(content)
    
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return {"success": True}
    except Exception as e:
        print(f"[Mail Error] Failed to send email via SMTP: {e}")
        return {"success": False, "error": str(e)}
