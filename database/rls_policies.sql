-- =============================================================================
-- Electricity Consumption Monitoring System — Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_bills ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS EVALUATION
-- =============================================================================

-- Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get consumer ID associated with current authenticated user
CREATE OR REPLACE FUNCTION public.get_current_consumer_id()
RETURNS UUID AS $$
DECLARE
    v_consumer_id UUID;
BEGIN
    SELECT id INTO v_consumer_id
    FROM public.consumers
    WHERE consumer_user_id = auth.uid()
    LIMIT 1;
    RETURN v_consumer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- 1. PROFILES POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Profiles: Users can read own profile" ON public.profiles;
CREATE POLICY "Profiles: Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles: Users can update own profile name" ON public.profiles;
CREATE POLICY "Profiles: Users can update own profile name"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevent privilege escalation
    );

DROP POLICY IF EXISTS "Profiles: Admin full access" ON public.profiles;
CREATE POLICY "Profiles: Admin full access"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- =============================================================================
-- 2. TARIFFS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Tariffs: Everyone authenticated can read active tariffs" ON public.tariffs;
CREATE POLICY "Tariffs: Everyone authenticated can read active tariffs"
    ON public.tariffs FOR SELECT
    TO authenticated
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Tariffs: Admin manage tariffs" ON public.tariffs;
CREATE POLICY "Tariffs: Admin manage tariffs"
    ON public.tariffs FOR ALL
    USING (public.is_admin());

-- =============================================================================
-- 3. CONSUMERS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Consumers: Consumer view own profile" ON public.consumers;
CREATE POLICY "Consumers: Consumer view own profile"
    ON public.consumers FOR SELECT
    USING (consumer_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Consumers: Admin manage consumers" ON public.consumers;
CREATE POLICY "Consumers: Admin manage consumers"
    ON public.consumers FOR ALL
    USING (public.is_admin());

-- =============================================================================
-- 4. METERS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Meters: Consumer view assigned meter" ON public.meters;
CREATE POLICY "Meters: Consumer view assigned meter"
    ON public.meters FOR SELECT
    USING (consumer_id = public.get_current_consumer_id() OR public.is_admin());

DROP POLICY IF EXISTS "Meters: Admin manage meters" ON public.meters;
CREATE POLICY "Meters: Admin manage meters"
    ON public.meters FOR ALL
    USING (public.is_admin());

-- =============================================================================
-- 5. CONSUMPTION READINGS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Consumption: Consumer view own meter readings" ON public.consumption_readings;
CREATE POLICY "Consumption: Consumer view own meter readings"
    ON public.consumption_readings FOR SELECT
    USING (
        meter_id IN (SELECT id FROM public.meters WHERE consumer_id = public.get_current_consumer_id())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Consumption: Admin manage readings" ON public.consumption_readings;
CREATE POLICY "Consumption: Admin manage readings"
    ON public.consumption_readings FOR ALL
    USING (public.is_admin());

-- =============================================================================
-- 6. BILLS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Bills: Consumer view own bills" ON public.bills;
CREATE POLICY "Bills: Consumer view own bills"
    ON public.bills FOR SELECT
    USING (
        meter_id IN (SELECT id FROM public.meters WHERE consumer_id = public.get_current_consumer_id())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Bills: Admin manage bills" ON public.bills;
CREATE POLICY "Bills: Admin manage bills"
    ON public.bills FOR ALL
    USING (public.is_admin());

-- =============================================================================
-- 7. PAYMENTS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Payments: Consumer view own payments" ON public.payments;
CREATE POLICY "Payments: Consumer view own payments"
    ON public.payments FOR SELECT
    USING (
        bill_id IN (
            SELECT b.id FROM public.bills b
            JOIN public.meters m ON b.meter_id = m.id
            WHERE m.consumer_id = public.get_current_consumer_id()
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Payments: Admin record payments" ON public.payments;
CREATE POLICY "Payments: Admin record payments"
    ON public.payments FOR ALL
    USING (public.is_admin());

-- =============================================================================
-- 8. ALERTS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Alerts: Consumer view own alerts" ON public.alerts;
CREATE POLICY "Alerts: Consumer view own alerts"
    ON public.alerts FOR SELECT
    USING (
        meter_id IN (SELECT id FROM public.meters WHERE consumer_id = public.get_current_consumer_id())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Alerts: Admin manage alerts" ON public.alerts;
CREATE POLICY "Alerts: Admin manage alerts"
    ON public.alerts FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Alerts: Consumer mark own alert as read" ON public.alerts;
CREATE POLICY "Alerts: Consumer mark own alert as read"
    ON public.alerts FOR UPDATE
    USING (meter_id IN (SELECT id FROM public.meters WHERE consumer_id = public.get_current_consumer_id()))
    WITH CHECK (is_read = true);

-- Alert Settings
DROP POLICY IF EXISTS "Alert Settings: Admin manage settings" ON public.alert_settings;
CREATE POLICY "Alert Settings: Admin manage settings"
    ON public.alert_settings FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Alert Settings: Authenticated read settings" ON public.alert_settings;
CREATE POLICY "Alert Settings: Authenticated read settings"
    ON public.alert_settings FOR SELECT
    TO authenticated
    USING (true);

-- =============================================================================
-- 9. REPORTS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Reports: Admin manage reports" ON public.reports;
CREATE POLICY "Reports: Admin manage reports"
    ON public.reports FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Reports: Consumers view own generated reports" ON public.reports;
CREATE POLICY "Reports: Consumers view own generated reports"
    ON public.reports FOR SELECT
    USING (generated_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Report Bills: Admin manage junction" ON public.report_bills;
CREATE POLICY "Report Bills: Admin manage junction"
    ON public.report_bills FOR ALL
    USING (public.is_admin());
