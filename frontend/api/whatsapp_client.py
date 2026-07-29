import os
import requests
import json
import hmac
import hashlib

# These would ideally be fetched from os.environ or a .env file
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "commuteKE_secret_token_123")
GRAPH_API_VERSION = "v20.0"

def send_whatsapp_template(to_number: str, template_name: str, language_code: str = "en_US", components: list = None):
    """
    Sends a WhatsApp template message using the Meta Graph API.
    """
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID:
        print(f"[MOCK WHATSAPP] Would send template '{template_name}' to {to_number}")
        print(f"[MOCK WHATSAPP] Components: {components}")
        return {"status": "mock", "message": "Credentials missing, simulated send"}

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": language_code
            }
        }
    }

    if components:
        payload["template"]["components"] = components

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f"[WHATSAPP] Successfully sent message to {to_number}")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"[WHATSAPP ERROR] Failed to send message to {to_number}: {e}")
        if e.response is not None:
            print(f"[WHATSAPP ERROR DETAILS] {e.response.text}")
        return None

def verify_webhook(hub_mode: str, hub_verify_token: str, hub_challenge: str):
    """
    Verifies the webhook setup from Meta.
    """
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    return None
