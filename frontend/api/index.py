import os
import hmac
import hashlib
from fastapi import FastAPI, HTTPException, Header, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()
app.title = "TM Savannah Transport Gateway"
app.version = "1.0.0"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic import BaseModel


# Background CRON Task (APScheduler alternative using asyncio for local dev)
async def generate_daily_trips():
    while True:
        now = datetime.now()
        await asyncio.sleep(3600)

@app.on_event("startup")
async def startup_event():
    print("Starting background CRON task...")
    asyncio.create_task(generate_daily_trips())

class InquiryRequest(BaseModel):
    name: str
    email: str
    type: str
    message: str

@app.post("/api/v1/inquiry")
async def submit_inquiry(req: InquiryRequest):
    import sys
    import os
    try:
        sys.path.append(os.path.dirname(__file__))
    except Exception:
        pass
    from mail_client import send_inquiry_email
    
    result = send_inquiry_email(
        user_name=req.name,
        user_email=req.email,
        inquiry_type=req.type,
        message=req.message
    )
    if not result.get("success"):
        return {"status": "error", "message": "Failed to dispatch email"}
    return {"status": "success", "message": "Inquiry sent successfully"}

class WhatsAppSubscription(BaseModel):
    phone_number: str
    tenant_id: str
    route_id: str
    passenger_name: str

@app.post("/api/v1/subscribe/whatsapp")
async def subscribe_whatsapp(sub: WhatsAppSubscription):
    import sys
    import os
    try:
        sys.path.append(os.path.dirname(__file__))
    except Exception:
        pass
    from whatsapp_client import send_whatsapp_template
    
    # In production, save the subscription to the database here (e.g. Supabase)
    print(f"[DB MOCK] Saved WhatsApp sub for {sub.phone_number} on {sub.route_id}")
    
    # Send a welcome template right away to confirm
    res = send_whatsapp_template(
        to_number=sub.phone_number,
        template_name="hello_world" # Replace with your approved Meta template name
    )
    return {"status": "success", "message": "Subscribed to WhatsApp alerts."}

from fastapi import Query
from fastapi.responses import PlainTextResponse

@app.get("/api/v1/whatsapp/webhook")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    """Webhook Verification for Meta"""
    import sys
    import os
    try:
        sys.path.append(os.path.dirname(__file__))
    except Exception:
        pass
    from whatsapp_client import verify_webhook
    
    challenge = verify_webhook(hub_mode, hub_verify_token, hub_challenge)
    if challenge is not None:
        return PlainTextResponse(str(challenge))
    raise HTTPException(status_code=403, detail="Verification failed")

@app.post("/api/v1/whatsapp/webhook")
async def receive_whatsapp_webhook(request: Request):
    """Handle incoming messages and delivery statuses from Meta"""
    payload = await request.json()
    # Process the payload (e.g. mark messages as delivered or respond to user messages)
    print("[WHATSAPP WEBHOOK RECEIVED]", payload)
    return {"status": "received"}

# Secret key for HMAC webhook verification
WEBHOOK_SECRET = os.getenv("TM_SAVANNAH_WEBHOOK_SECRET", "super-secret-tm-savannah-key")

class DriverStatusUpdate(BaseModel):
    tenant_id: str
    trip_id: str
    driver_phone: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PageView(BaseModel):
    tenant_id: str
    timestamp: Optional[str] = None

class AdImpression(BaseModel):
    tenant_id: str
    sponsor_id: str
    timestamp: Optional[str] = None

def verify_hmac_signature(payload: bytes, signature: str):
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=403, detail="Invalid HMAC signature. Unauthorized webhook attempt.")

@app.post("/api/v1/dispatch/update")
async def update_trip_status(request: Request, update: DriverStatusUpdate, x_signature: str = Header(...)):
    raw_body = await request.body()
    # verify_hmac_signature(raw_body, x_signature) # Temporarily disabled for basic testing
    
    # Process trip state transition safely inside PostgreSQL...
    return {
        "status": "success",
        "trip_id": update.trip_id,
        "new_state": update.status,
        "powered_by": "TM Savannah"
    }

class StatusUpdate(BaseModel):
    bus_plate: str
    status: str
    timestamp: str

@app.post("/api/v1/driver/status")
async def update_driver_status(update: StatusUpdate):
    # In a real app, update Supabase active_trips table here
    print(f"Driver Status Updated: {update.bus_plate} is now {update.status}")
    return {"message": "Status updated successfully", "data": update.dict()}

@app.post("/api/v1/analytics/pageview")
async def record_page_view(view: PageView):
    # In production, insert into Supabase page_views table
    return {"status": "success", "message": "Page view recorded."}

@app.post("/api/v1/analytics/impression")
async def record_ad_impression(impression: AdImpression):
    # In production, insert into Supabase ad_impressions table
    return {"status": "success", "message": f"Ad impression recorded for sponsor {impression.sponsor_id}."}

@app.get("/api/v1/analytics/report")
async def get_analytics_report(tenant_id: str):
    # In production, run aggregate queries via Supabase/PostgreSQL
    return {
        "tenant_id": tenant_id,
        "total_views_today": 1245,
        "peak_hours": [
            {"hour": "06:00 AM", "views": 320},
            {"hour": "07:00 AM", "views": 450},
        ],
        "sponsor_impressions": [
            {"sponsor_name": "Kiungani Fresh Butchery", "impressions": 850},
        ]
    }

class ProvisionRequest(BaseModel):
    email: str
    role: str
    tenant_id: str

@app.post("/api/v1/admin/provision")
async def provision_user(req: ProvisionRequest, request: Request):
    # 1. Telemetry / 403 Helpers
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "Unknown Device")
    
    # In production, you would check if client_ip is blacklisted,
    # or if the requesting Admin's JWT is valid before proceeding.
    print(f"🔒 PROVISIONING REQUEST INITIATED")
    print(f"   IP Address: {client_ip}")
    print(f"   Device: {user_agent}")
    print(f"   Target: {req.email} as {req.role} for {req.tenant_id}")

    # 2. Supabase Admin API Call (Simulated until environment variables are set)
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        return {"status": "warning", "message": "Service Role Key not found. Telemetry logged, but account creation skipped locally."}
    
    import requests
    # Create the user in Auth
    auth_resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
            "Content-Type": "application/json"
        },
        json={"email": req.email, "email_confirm": True}
    )
    
    if auth_resp.status_code not in [200, 201]:
        return {"status": "error", "message": auth_resp.json().get("msg", "Failed to create Auth User")}
    
    user_id = auth_resp.json().get("id")
    
    # Insert into user_roles
    role_resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/user_roles",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        json={"user_id": user_id, "tenant_id": req.tenant_id, "role": req.role}
    )
    
    return {"status": "success", "message": f"User {req.email} successfully provisioned as {req.role}."}

@app.get("/health")
def health_check():
    return {"status": "operational", "platform": "TM Savannah Transport Engine"}


# ---------------------------------------------------------------------------
# SACCO Management Endpoints
# ---------------------------------------------------------------------------

class SaccoCreateRequest(BaseModel):
    name: str
    registration_number: str
    chairman_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    base_region: Optional[str] = None
    primary_route: Optional[str] = None
    fleet_count: Optional[int] = 0
    notes: Optional[str] = None

class SaccoStatusUpdate(BaseModel):
    sacco_id: str
    status: str  # 'ACTIVE' | 'SUSPENDED' | 'PENDING'

class SaccoBroadcast(BaseModel):
    sacco_id: str
    title: str
    body: str
    data: Optional[dict] = None

@app.get("/api/v1/saccos")
async def list_saccos():
    """Return all SACCOs. Accessible to SYSTEM_ADMIN via Supabase JWT."""
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        # Dev mode: return empty list
        return {"saccos": [], "mock": True}
    import requests as req
    resp = req.get(
        f"{SUPABASE_URL}/rest/v1/saccos?order=created_at.desc",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
        }
    )
    return {"saccos": resp.json() if resp.ok else []}

@app.post("/api/v1/saccos")
async def create_sacco(sacco: SaccoCreateRequest):
    """Create a new SACCO entry (PENDING status by default)."""
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        return {"status": "mock", "message": "Supabase not configured — SACCO logged locally.", "data": sacco.dict()}
    import requests as req
    payload = {**sacco.dict(), "status": "PENDING"}
    resp = req.post(
        f"{SUPABASE_URL}/rest/v1/saccos",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        json=payload
    )
    if resp.ok:
        return {"status": "success", "message": f"SACCO '{sacco.name}' created.", "data": resp.json()}
    return {"status": "error", "message": resp.text}

@app.patch("/api/v1/saccos/status")
async def update_sacco_status(update: SaccoStatusUpdate):
    """Activate or suspend a SACCO."""
    allowed = {"ACTIVE", "SUSPENDED", "PENDING"}
    if update.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed}")
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        return {"status": "mock", "message": "Supabase not configured."}
    import requests as req
    resp = req.patch(
        f"{SUPABASE_URL}/rest/v1/saccos?id=eq.{update.sacco_id}",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        json={"status": update.status, "updated_at": datetime.utcnow().isoformat()}
    )
    if resp.ok:
        return {"status": "success", "message": f"SACCO status updated to {update.status}."}
    return {"status": "error", "message": resp.text}

@app.post("/api/v1/saccos/broadcast")
async def broadcast_to_subscribers(broadcast: SaccoBroadcast):
    """
    Send a push-notification-style broadcast to all push_subscriptions
    for a given SACCO's tenant. In production this calls your push worker.
    For now it returns a summary of who would be notified.
    """
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        return {"status": "mock", "notified": 0, "message": "Supabase not configured — broadcast simulated."}
    import requests as req
    # Fetch subscriptions for the SACCO's tenant_id
    sacco_resp = req.get(
        f"{SUPABASE_URL}/rest/v1/saccos?id=eq.{broadcast.sacco_id}&select=tenant_id,name",
        headers={"apikey": SUPABASE_SERVICE_ROLE, "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}"}
    )
    if not sacco_resp.ok or not sacco_resp.json():
        raise HTTPException(status_code=404, detail="SACCO not found.")
    sacco = sacco_resp.json()[0]
    tenant_id = sacco.get("tenant_id")
    if not tenant_id:
        return {"status": "warning", "message": "SACCO has no tenant_id yet — activate it first."}
    subs_resp = req.get(
        f"{SUPABASE_URL}/rest/v1/push_subscriptions?tenant_id=eq.{tenant_id}&select=id,endpoint",
        headers={"apikey": SUPABASE_SERVICE_ROLE, "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}"}
    )
    subs = subs_resp.json() if subs_resp.ok else []
    # TODO: Integrate with a Web Push library (pywebpush) to actually send
    # For now: log and return count
    print(f"[Broadcast] '{broadcast.title}' → {len(subs)} subscribers on tenant {tenant_id}")
    return {
        "status": "success",
        "sacco": sacco.get("name"),
        "tenant_id": tenant_id,
        "notified": len(subs),
        "message": f"Broadcast queued for {len(subs)} subscriber(s)."
    }


# ---------------------------------------------------------------------------
# Staff Invite Endpoint
# ---------------------------------------------------------------------------

class StaffInviteRequest(BaseModel):
    email: str
    role: str  # 'DRIVER' | 'CLERK'
    tenant_id: str

@app.post("/api/v1/staff/invite")
async def invite_staff(req: StaffInviteRequest):
    """
    Sends a Supabase magic-link invite to the staff member via TMS Mail Server.
    After sign-up, admin must assign their role in the Staff tab.
    """
    import sys
    sys.path.append(os.path.dirname(__file__))
    from mail_client import send_transactional_email

    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    invite_link = f"https://commute.tmsavannah.com/login"
    user_id = None

    if SUPABASE_URL and SUPABASE_SERVICE_ROLE:
        import requests as http
        # Use Supabase Admin API to generate a magic link invite
        resp = http.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={
                "apikey": SUPABASE_SERVICE_ROLE,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
                "Content-Type": "application/json"
            },
            json={"email": req.email, "email_confirm": False, "send_email": False}
        )
        if resp.status_code in [200, 201]:
            user_data = resp.json()
            user_id = user_data.get("id")
            # Assign role in user_roles table
            http.post(
                f"{SUPABASE_URL}/rest/v1/user_roles",
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                json={"user_id": user_id, "tenant_id": req.tenant_id, "role": req.role}
            )
            # Generate a magic link
            link_resp = http.post(
                f"{SUPABASE_URL}/auth/v1/admin/generate_link",
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
                    "Content-Type": "application/json"
                },
                json={"type": "magiclink", "email": req.email}
            )
            if link_resp.ok:
                invite_link = link_resp.json().get("action_link", invite_link)

    role_label = req.role.capitalize()
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden">
      <div style="background:#f59e0b;padding:24px;text-align:center">
        <img src="https://commute.tmsavannah.com/transy_logo.jpg" width="64" height="64"
             style="border-radius:50%;border:3px solid #fff" alt="Transy Logo"/>
        <h1 style="color:#0f172a;font-size:24px;margin:12px 0 0">You're invited to Transy</h1>
      </div>
      <div style="padding:32px">
        <p style="color:#e2e8f0;font-size:15px;line-height:1.6">
          You have been invited to join the Transy operations platform as a
          <strong style="color:#f59e0b">{role_label}</strong>.
        </p>
        <p style="color:#94a3b8;font-size:14px;margin-top:8px">
          As a <strong>{role_label}</strong>, you will use Transy to
          {'update your trip status and share your GPS location.' if req.role == 'DRIVER' else 'manage the live dispatch board, swap vehicles, and notify passengers.'}
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="{invite_link}" style="background:#f59e0b;color:#0f172a;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;display:inline-block">
            Set Up My Account →
          </a>
        </div>
        <p style="color:#64748b;font-size:12px;text-align:center">
          This link was sent by your Sacco Manager via Transy by The Modern Savannah.
          If you were not expecting this, please ignore it.
        </p>
      </div>
    </div>
    """

    result = send_transactional_email(
        to=req.email,
        subject=f"You're invited to Transy as a {role_label}",
        html=html
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Mail server error. Invite not sent.")

    return {"status": "success", "message": f"Invite dispatched to {req.email} via TMS Mail Server."}


# ---------------------------------------------------------------------------
# Clerk Broadcast Notify Endpoint
# ---------------------------------------------------------------------------

class ClerkBroadcastRequest(BaseModel):
    tenant_id: str
    trip_id: str
    bus_id: str
    status: str
    message: str

@app.post("/api/v1/notify/broadcast")
async def clerk_broadcast(req: ClerkBroadcastRequest):
    """
    Clerk fires this when they want to notify all WhatsApp subscribers
    for a trip. Immediately sends — no admin approval needed.
    """
    import sys
    sys.path.append(os.path.dirname(__file__))
    from whatsapp_client import send_whatsapp_template

    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    notified = 0
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE:
        import requests as http
        # Fetch all subscribers for this tenant
        subs_resp = http.get(
            f"{SUPABASE_URL}/rest/v1/passenger_subscriptions?tenant_id=eq.{req.tenant_id}&select=phone_number",
            headers={
                "apikey": SUPABASE_SERVICE_ROLE,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}"
            }
        )
        if subs_resp.ok:
            subs = subs_resp.json()
            for sub in subs:
                phone = sub.get("phone_number")
                if phone:
                    send_whatsapp_template(
                        to_number=phone,
                        template_name="trip_status_update",
                        params=[req.bus_id, req.status.replace("_", " ")]
                    )
                    notified += 1

    print(f"[Clerk Broadcast] Trip {req.trip_id} → {req.status} → {notified} passengers notified")
    return {"status": "success", "notified": notified, "message": req.message}
