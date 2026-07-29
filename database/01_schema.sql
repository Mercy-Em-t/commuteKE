-- Enable PostGIS for geospatial calculations
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Tenants Table
CREATE TABLE tenants (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'kiungani-01'
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(100) DEFAULT 'transport.tmsavannah.com',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Routes Table with Polyline Geometry
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    polyline_path GEOMETRY(LineString, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Active Trips Table
CREATE TABLE active_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id),
    driver_phone VARCHAR(20) NOT NULL,
    vehicle_registration VARCHAR(20) NOT NULL,
    status VARCHAR(30) CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'BOARDING', 'IN_TRANSIT', 'WITHDRAWN', 'COMPLETED')),
    scheduled_departure TIMESTAMPTZ NOT NULL,
    actual_departure TIMESTAMPTZ,
    current_location GEOMETRY(Point, 4326),
    last_ping_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Push Subscriptions Table
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    preferred_slots VARCHAR(50)[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Local Sponsors (Monetization Engine)
CREATE TABLE local_sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    business_name VARCHAR(100) NOT NULL,
    banner_url TEXT NOT NULL,
    click_url TEXT,
    is_active BOOLEAN DEFAULT true,
    monthly_rate NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Policy Example
ALTER TABLE active_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON active_trips
    USING (tenant_id = current_setting('app.current_tenant', true));
