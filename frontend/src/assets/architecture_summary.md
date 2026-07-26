# TransitOS: System Architecture & Route Map

This document outlines the entire anatomy of the system we built together. It catalogs every page, endpoint, and data pipeline.

## 1. Frontend Pages (React UI)
These are the user-facing screens rendered by `App.jsx`.

| Route | Role | Description |
| :--- | :--- | :--- |
| `/` | Public | The landing page and Sacco overview. |
| `/routes` | Public | List of all available Sacco routes. |
| `/track/:routeId` | Passenger | The live GPS map, timetable, and Subscription UI. |
| `/login` | Crew/Admin | Secure OTP authentication portal. |
| `/driver` | Driver | Driver Portal. Used to stream GPS and update trip statuses. |
| `/roster` | Admin | Dashboard to view active fleet and reassign vehicles. |
| `/admin` | Admin | High-level operations, analytics, and personnel provisioning. |
| `/admin/sandbox` | Tester | The God-Mode testing suite and live telemetry simulation. |

## 2. Backend Endpoints (Python FastAPI)
These are the engines running at `http://127.0.0.1:8001`.

### Data Ingestion (Input)
*   **`POST /api/v1/driver/status`**: Receives GPS pings and status updates from the Driver Portal.
*   **`POST /api/v1/analytics/pageview`**: Silently triggered when a passenger opens the map to track demand.
*   **`POST /api/v1/analytics/impression`**: Triggered when a passenger clicks a local sponsor ad.
*   **`POST /api/v1/inquiry`**: Handles customer support messages from the landing page.

### Data Digestion (Output)
*   **`GET /api/v1/analytics/report`**: Aggregates all pageviews and ad impressions into a JSON report for the Admin Dashboard.
*   **`POST /api/v1/admin/provision`**: The highly secure telemetry-walled endpoint used to create new Driver/Admin accounts in Auth.

## 3. Database & Realtime Pipelines (Supabase)
*   **`fleet` table**: Tracks vehicles (Active/Maintenance/Retired).
*   **`active_trips` table**: The core table. Holds the current state of a bus, its assigned driver, and its live `current_location` (PostGIS geometry).
*   **`god_mode_telemetry` channel**: A custom WebSocket multiplex channel used for our Sandbox simulation.
*   **`public:active_trips` channel**: The "Express Highway" WebSocket channel that pushes database updates directly to the passenger's phone map.
