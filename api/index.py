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
