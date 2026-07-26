import os
import hmac
import hashlib

# These will be populated from your Supabase / Hosting environment later
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "mock_id")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "mock_token")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "mock_verify_token")

def verify_whatsapp_webhook(request_body: str, signature_header: str, app_secret: str) -> bool:
    """
    Verifies that the incoming webhook actually came from Meta/WhatsApp 
    using the HMAC SHA256 signature.
    """
    if not signature_header:
        return False
        
    expected_hash = hmac.new(
        app_secret.encode('utf-8'),
        request_body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Meta sends signature in format: sha256=EXPECTED_HASH
    return signature_header == f"sha256={expected_hash}"

def send_interactive_button(recipient_phone: str, message: str):
    """
    Sends the T-15 Mins prompt to the driver's phone with BOARDING/DEPARTED buttons.
    """
    print(f"[WHATSAPP BOT] Sending interactive prompt to {recipient_phone}: {message}")
    # TODO: Implement actual requests.post to Meta Graph API
    return True

def broadcast_daily_schedule(group_id: str, schedule_text: str):
    """
    Sends the 5 AM automated timetable to the Sacco WhatsApp Group.
    """
    print(f"[WHATSAPP BOT] Broadcasting schedule to group {group_id}:\n{schedule_text}")
    # TODO: Implement actual requests.post to Meta Graph API
    return True
