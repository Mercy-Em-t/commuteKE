-- SACCO Registry Table
-- Stores onboarded SACCOs managed by the SYSTEM_ADMIN
CREATE TABLE IF NOT EXISTS saccos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identity
    name VARCHAR(100) NOT NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., "NTSA/SACCO/2024/001"
    -- Contact
    chairman_name VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    -- Operations
    base_region VARCHAR(100),          -- e.g., "Kiambu County"
    primary_route VARCHAR(200),        -- e.g., "Kiungani → CBD"
    fleet_count INT DEFAULT 0,
    -- Platform
    tenant_id VARCHAR(50) UNIQUE,      -- links to tenants table once activated
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),
    onboarded_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only SYSTEM_ADMIN can manage SACCOs
ALTER TABLE saccos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_admin_full_access" ON saccos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'SYSTEM_ADMIN'
    )
);

-- Allow public read of ACTIVE saccos (for the route selector)
CREATE POLICY "public_can_read_active_saccos" ON saccos
FOR SELECT USING (status = 'ACTIVE');
