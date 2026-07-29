import os
import jwt
import time
import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("MAIL_CLIENT_ID")
CLIENT_SECRET = os.getenv("MAIL_SECRET")
MAIL_SERVER_URL = "https://mail.tmsavannah.com/api/dispatch"

def get_highway_token() -> str:
    """Generates a short-lived JWT for authenticating with the TM Savannah Mail Server."""
    if not CLIENT_ID or not CLIENT_SECRET:
        raise ValueError("MAIL_CLIENT_ID or MAIL_SECRET is missing from .env")
        
    payload = {
        "client_id": CLIENT_ID,
        "domain": "commute.tmsavannah.com",
        "iat": int(time.time()),
        "exp": int(time.time()) + 600 # 10 minutes expiration
    }
    
    return jwt.encode(payload, CLIENT_SECRET, algorithm="HS256")

def send_inquiry_email(user_name: str, user_email: str, inquiry_type: str, message: str) -> dict:
    """Sends a system notification email to the admin team about a new inquiry."""
    
    token = get_highway_token()
    
    body = {
        "client_id": CLIENT_ID,
        "template": "system_notification",
        "to": "memurugat@gmail.com", # Send to the internal team
        "message_type": "notification",
        "replyTo": user_email,
        "variables": {
            "brand_name": "Kiungani TransitOS",
            "alert_title": f"New Inquiry: {inquiry_type} from {user_name}",
            "alert_body": f"User Email: {user_email}\n\nMessage:\n{message}",
            "timestamp": str(time.time())
        }
    }
    
    response = requests.post(
        MAIL_SERVER_URL,
        headers={
            "Content-Type": "application/json",
            "x-highway-token": token
        },
        json=body
    )
    
    if response.status_code != 200:
        print(f"[Mail Error] {response.status_code}: {response.text}")
        return {"success": False, "error": response.text}
        
    return response.json()
