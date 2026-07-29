# Security Telemetry & Super Admin Provisioning

## Overview
TransitOS implements a strictly separated architecture for creating new users. Because the React frontend (`shouldCreateUser: false`) is banned from generating Auth accounts to prevent unauthorized access via OTP, all user provisioning must be routed through a secure Python backend endpoint.

## The Telemetry Wall
When a Super Admin attempts to provision a new driver or admin, the request hits the `POST /api/v1/admin/provision` endpoint.

Before the backend communicates with the Supabase Admin API, it performs a **Telemetry Check**:
1. **IP Extraction:** The backend extracts the `request.client.host` to identify the origin IP address.
2. **Device Fingerprinting:** The backend extracts the `User-Agent` header to identify the operating system, browser, and device type.

### Security Benefit
If an Admin's email is compromised and an attacker attempts to provision a backdoor account using a stolen OTP session, the Telemetry Wall can block the request if the IP address or Device Fingerprint does not match the Admin's known behavioral profile (e.g., a sudden request from a foreign IP using a Windows desktop when the Admin typically uses an iPhone in Nairobi).

## Backend Execution
If the telemetry checks pass, the backend uses the `SUPABASE_SERVICE_ROLE_KEY` (a master key that bypasses RLS) to:
1. Create the user in the core `auth.users` system so they can receive OTPs.
2. Instantly insert the user's UUID into the `user_roles` table, assigning them their operational privileges (`ADMIN` or `DRIVER`) and binding them to their respective `tenant_id`.
