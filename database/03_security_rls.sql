-- 1. Create User Roles mapping to link Supabase Auth to specific Tenants
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'DRIVER')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- 2. Drop the old basic RLS policy for active_trips if it exists
DROP POLICY IF EXISTS tenant_isolation_policy ON active_trips;

-- 3. Enable Strict RLS on all critical tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES FOR USER ROLES
-- ==========================================
-- Users can only read their own roles
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- POLICIES FOR ACTIVE TRIPS (Anti-Spoofing)
-- ==========================================
-- Passenger (Public) Read Access
CREATE POLICY "Public can view active trips" ON active_trips
    FOR SELECT USING (true);

-- Driver Write Access (Anti-Spoofing GPS updates)
-- A driver can only update a trip if they have the 'DRIVER' role for that tenant
CREATE POLICY "Drivers can update trips for their tenant" ON active_trips
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'DRIVER' 
            AND tenant_id = active_trips.tenant_id
        )
    );

-- Admin Insert/Update Access (Generating Timetables)
CREATE POLICY "Admins can insert and update trips" ON active_trips
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN' 
            AND tenant_id = active_trips.tenant_id
        )
    );

-- ==========================================
-- POLICIES FOR ROUTES AND TENANTS
-- ==========================================
-- Public Read Access
CREATE POLICY "Public can view routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public can view tenants" ON tenants FOR SELECT USING (true);

-- Admin Edit Access for Routes
CREATE POLICY "Admins can manage routes" ON routes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN' 
            AND tenant_id = routes.tenant_id
        )
    );
