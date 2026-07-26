-- 1. Page Views Table
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    view_timestamp TIMESTAMPTZ DEFAULT now(),
    -- Can add fields like user_agent or ip_hash for uniqueness if needed later
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ad Impressions Table
CREATE TABLE ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    sponsor_id UUID REFERENCES local_sponsors(id) ON DELETE CASCADE,
    impression_timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security Policies
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_page_views ON page_views
    USING (tenant_id = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_ad_impressions ON ad_impressions
    USING (tenant_id = current_setting('app.current_tenant', true));
