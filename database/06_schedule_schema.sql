-- ============================================================
-- 06_schedule_schema.sql
-- Crew schedule slots + contact info for each SACCO
-- ============================================================

-- 1. Add contact fields to the saccos table
ALTER TABLE saccos
    ADD COLUMN IF NOT EXISTS manager_phone       VARCHAR(20),
    ADD COLUMN IF NOT EXISTS parcels_cbd_phone   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS parcels_cbd_contact VARCHAR(100),
    ADD COLUMN IF NOT EXISTS parcels_office_address TEXT,
    ADD COLUMN IF NOT EXISTS parcels_office_phone VARCHAR(20);

-- 2. Schedule slots table
CREATE TABLE IF NOT EXISTS schedule_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id        UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
    day_type        VARCHAR(10) NOT NULL CHECK (day_type IN ('WEEKDAY', 'SATURDAY', 'SUNDAY')),
    departure_time  TIME NOT NULL,
    driver_phones   TEXT[] NOT NULL DEFAULT '{}',  -- supports multiple phones per slot
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;

-- Passengers can read all slots
CREATE POLICY "public_read_schedule" ON schedule_slots
    FOR SELECT USING (true);

-- SYSTEM_ADMIN or SACCO ADMIN (matched via tenant) can manage slots
CREATE POLICY "admin_manage_schedule" ON schedule_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'SYSTEM_ADMIN'
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN saccos s ON s.tenant_id = ur.tenant_id
            WHERE ur.user_id = auth.uid()
              AND ur.role = 'ADMIN'
              AND s.id = schedule_slots.sacco_id
        )
    );

-- ============================================================
-- SEED: Kiungani Road SACCO
-- ============================================================

-- Upsert the SACCO row
INSERT INTO saccos (
    name, registration_number,
    base_region, primary_route, fleet_count,
    tenant_id, status,
    manager_phone, parcels_cbd_phone, parcels_cbd_contact,
    parcels_office_address, parcels_office_phone
) VALUES (
    'Kiungani Road SACCO',
    'NTSA/SACCO/2024/KNG001',
    'Machakos County',
    'Kiungani → Nairobi CBD',
    12,
    'kiungani-01',
    'ACTIVE',
    '0722757559',
    '0727003782',
    'Ms Karimi',
    'Maki Hse Katani Rd',
    '0721445182'
)
ON CONFLICT (tenant_id) DO UPDATE SET
    name = EXCLUDED.name,
    status = 'ACTIVE',
    manager_phone = EXCLUDED.manager_phone,
    parcels_cbd_phone = EXCLUDED.parcels_cbd_phone,
    parcels_cbd_contact = EXCLUDED.parcels_cbd_contact,
    parcels_office_address = EXCLUDED.parcels_office_address,
    parcels_office_phone = EXCLUDED.parcels_office_phone;

-- Clear and re-seed slots (idempotent)
DELETE FROM schedule_slots
WHERE sacco_id = (SELECT id FROM saccos WHERE tenant_id = 'kiungani-01');

-- Weekday slots
INSERT INTO schedule_slots (sacco_id, day_type, departure_time, driver_phones, sort_order) VALUES
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '05:30', ARRAY['0727699222'],              1),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '06:00', ARRAY['0711580275'],              2),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '06:15', ARRAY['0743897119','0701015996'], 3),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '06:30', ARRAY['0716138429','0738359558'], 4),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '07:00', ARRAY['0727699222'],              5),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '07:30', ARRAY['0711580275'],              6),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '08:30', ARRAY['0725027956'],              7),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '09:00', ARRAY['0716138429'],              8),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'WEEKDAY', '10:00', ARRAY['0722874977'],              9);

-- Saturday slots
INSERT INTO schedule_slots (sacco_id, day_type, departure_time, driver_phones, sort_order) VALUES
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'SATURDAY', '07:00', ARRAY['0729238638'], 1),
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'SATURDAY', '09:00', ARRAY['0795970637'], 2);

-- Sunday slots
INSERT INTO schedule_slots (sacco_id, day_type, departure_time, driver_phones, sort_order) VALUES
    ((SELECT id FROM saccos WHERE tenant_id = 'kiungani-01'), 'SUNDAY', '08:00', ARRAY['0702995701'], 1);
