-- 1. Create Fleet Table
CREATE TABLE fleet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    registration_number VARCHAR(20) NOT NULL,
    capacity INT DEFAULT 14,
    driver_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'RETIRED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure a vehicle plate is unique per Sacco
ALTER TABLE fleet ADD CONSTRAINT unique_registration_per_tenant UNIQUE (tenant_id, registration_number);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Fleet
-- Admins can view and manage all vehicles in their Sacco
CREATE POLICY "Admins can manage fleet" ON fleet
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN' AND tenant_id = fleet.tenant_id)
);

-- Drivers can only view the vehicle assigned to them
CREATE POLICY "Drivers can view own vehicle" ON fleet
FOR SELECT USING (
  driver_id = auth.uid()
);

-- Passengers (anon users) can view active fleet details for tracking
CREATE POLICY "Public can view active fleet" ON fleet
FOR SELECT USING (
  status = 'ACTIVE'
);

-- 4. Sample Data for Testing
INSERT INTO fleet (tenant_id, registration_number, capacity, status)
VALUES 
('kiungani-01', 'KCD 123X', 14, 'ACTIVE'),
('kiungani-01', 'KAB 456Y', 14, 'ACTIVE');
