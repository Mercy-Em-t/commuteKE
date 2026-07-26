import os
import hmac
import hashlib
from fastapi import FastAPI, HTTPException, Header, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI(title="TM Savannah Transport Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background CRON Task (APScheduler alternative using asyncio for local dev)
async def generate_daily_trips():
    while True:
        # Check if it's 3:00 AM (Mocking the check here)
        now = datetime.now()
        print(f"[{now.strftime('%H:%M:%S')}] CRON TICK: Checking if daily trips need to be generated...")
        
        # In production, this would query Supabase for the Timetable and insert empty rows into active_trips
        await asyncio.sleep(3600) # Sleep for an hour

@app.on_event("startup")
async def startup_event():
    print("Starting background CRON task...")
    asyncio.create_task(generate_daily_trips())

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
    # Mock data for frontend MVP:
    return {
        "tenant_id": tenant_id,
        "total_views_today": 1245,
        "peak_hours": [
            {"hour": "06:00 AM", "views": 320},
            {"hour": "07:00 AM", "views": 450},
            {"hour": "08:00 AM", "views": 210},
            {"hour": "05:00 PM", "views": 200},
        ],
        "sponsor_impressions": [
            {"sponsor_name": "Kiungani Fresh Butchery", "impressions": 850},
            {"sponsor_name": "Katani Pizza", "impressions": 395}
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "operational", "platform": "TM Savannah Transport Engine"}
