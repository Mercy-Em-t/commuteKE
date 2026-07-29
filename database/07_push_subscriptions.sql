-- ============================================================
-- 07_push_subscriptions.sql
-- Stores Web Push API subscriptions for device notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL, -- references the SACCO
    passenger_name VARCHAR(100),    -- optional, from localstorage
    endpoint TEXT NOT NULL UNIQUE,  -- Web Push URL
    p256dh TEXT NOT NULL,           -- Cryptographic key
    auth TEXT NOT NULL,             -- Cryptographic auth secret
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can subscribe (insert) from the PWA
CREATE POLICY "public_insert_subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (true);

-- 2. Only SYSTEM_ADMIN or the specific SACCO ADMIN can view subscriptions
CREATE POLICY "admin_read_subscriptions" ON push_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'SYSTEM_ADMIN'
        )
        OR EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'ADMIN' AND tenant_id = push_subscriptions.tenant_id
        )
    );
