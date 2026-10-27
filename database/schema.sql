-- =============================================================================
-- Electricity Consumption Monitoring System — Database Schema
-- Target: PostgreSQL / Supabase
-- Description: Core tables, constraints, views, and functions
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES (Extends Supabase auth.users for application roles)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('admin', 'consumer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to automatically create profile when new auth.user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Consumer'),
        'consumer' -- Enforce consumer role by default. Admins must be provisioned explicitly.
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 2. TARIFFS (Tariff-based billing requirement)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    rate_per_unit NUMERIC(10, 2) NOT NULL CHECK (rate_per_unit >= 0),
    fixed_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (fixed_charge >= 0),
    tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 5.00 CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 3. CONSUMERS (ER Entity: Consumer)
-- User manages Consumer (1:N) & Authenticated consumer ownership mapping
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.consumers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Admin managing this consumer
    consumer_user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL, -- Linked portal login
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 4. METERS (ER Entity: Meter)
-- Consumer has Meter (1:1 enforced by UNIQUE consumer_id)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_number TEXT NOT NULL UNIQUE,
    consumer_id UUID NOT NULL UNIQUE REFERENCES public.consumers(id) ON DELETE RESTRICT,
    installation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meter_type TEXT NOT NULL DEFAULT 'Smart Meter' CHECK (meter_type IN ('Single Phase', 'Three Phase', 'Smart Meter', 'Digital', 'Analog')),
    meter_status TEXT NOT NULL DEFAULT 'active' CHECK (meter_status IN ('active', 'inactive', 'maintenance')),
    tariff_id UUID NOT NULL REFERENCES public.tariffs(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 5. CONSUMPTION READINGS (ER Entity: Consumption)
-- Composite Primary Key: (meter_id, reading_date)
-- Units Consumed is derived: (current_reading - previous_reading)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.consumption_readings (
    meter_id UUID NOT NULL REFERENCES public.meters(id) ON DELETE RESTRICT,
    reading_date DATE NOT NULL,
    previous_reading NUMERIC(12, 2) NOT NULL CHECK (previous_reading >= 0),
    current_reading NUMERIC(12, 2) NOT NULL CHECK (current_reading >= 0),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (meter_id, reading_date),
    CONSTRAINT chk_reading_order CHECK (current_reading >= previous_reading)
);

-- Chronological consistency trigger
CREATE OR REPLACE FUNCTION public.fn_validate_consumption_reading()
RETURNS TRIGGER AS $$
DECLARE
    v_last_reading NUMERIC(12, 2);
    v_next_reading NUMERIC(12, 2);
BEGIN
    -- Check predecessor: meter's latest reading before this reading_date
    SELECT current_reading INTO v_last_reading
    FROM public.consumption_readings
    WHERE meter_id = NEW.meter_id AND reading_date < NEW.reading_date
    ORDER BY reading_date DESC
    LIMIT 1;

    IF v_last_reading IS NOT NULL AND NEW.previous_reading < v_last_reading THEN
        RAISE EXCEPTION 'Previous reading (%) cannot be lower than the prior cumulative reading (%) for meter %',
            NEW.previous_reading, v_last_reading, NEW.meter_id;
    END IF;

    -- Check successor: meter's earliest reading after this reading_date
    SELECT previous_reading INTO v_next_reading
    FROM public.consumption_readings
    WHERE meter_id = NEW.meter_id AND reading_date > NEW.reading_date
    ORDER BY reading_date ASC
    LIMIT 1;

    IF v_next_reading IS NOT NULL AND NEW.current_reading > v_next_reading THEN
        RAISE EXCEPTION 'Current reading (%) cannot exceed subsequent reading (%) for meter %',
            NEW.current_reading, v_next_reading, NEW.meter_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_consumption ON public.consumption_readings;
CREATE TRIGGER trg_validate_consumption
    BEFORE INSERT OR UPDATE ON public.consumption_readings
    FOR EACH ROW EXECUTE FUNCTION public.fn_validate_consumption_reading();

-- Derived Consumption View (Exposing units_consumed without redundant storage)
CREATE OR REPLACE VIEW public.v_consumption_readings AS
SELECT 
    cr.meter_id,
    m.meter_number,
    c.id AS consumer_id,
    c.name AS consumer_name,
    c.address AS consumer_address,
    t.id AS tariff_id,
    t.name AS tariff_name,
    t.rate_per_unit,
    cr.reading_date,
    cr.previous_reading,
    cr.current_reading,
    (cr.current_reading - cr.previous_reading) AS units_consumed,
    cr.created_by,
    cr.created_at
FROM public.consumption_readings cr
JOIN public.meters m ON cr.meter_id = m.id
JOIN public.consumers c ON m.consumer_id = c.id
JOIN public.tariffs t ON m.tariff_id = t.id;

-- =============================================================================
-- 6. BILLS (ER Entity: Bill)
-- References composite key of Consumption Readings
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL,
    reading_date DATE NOT NULL,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    units_consumed NUMERIC(12, 2) NOT NULL CHECK (units_consumed >= 0),
    rate_per_unit NUMERIC(10, 2) NOT NULL CHECK (rate_per_unit >= 0),
    fixed_charge NUMERIC(10, 2) NOT NULL CHECK (fixed_charge >= 0),
    tax_amount NUMERIC(10, 2) NOT NULL CHECK (tax_amount >= 0),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'overdue')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    FOREIGN KEY (meter_id, reading_date) REFERENCES public.consumption_readings(meter_id, reading_date) ON DELETE RESTRICT,
    CONSTRAINT uq_bill_meter_reading UNIQUE (meter_id, reading_date),
    CONSTRAINT chk_bill_dates CHECK (due_date >= bill_date AND billing_period_end >= billing_period_start)
);

-- =============================================================================
-- 7. PAYMENTS (ER Entity: Payment)
-- Bill is paid through Payment (1:N for partial payments support)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE RESTRICT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'card')),
    reference_number TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Transactional payment recording & bill status calculation function
CREATE OR REPLACE FUNCTION public.record_payment_transaction(
    p_bill_id UUID,
    p_amount NUMERIC,
    p_payment_mode TEXT,
    p_reference_number TEXT,
    p_recorded_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_bill RECORD;
    v_total_paid NUMERIC(12, 2);
    v_new_total NUMERIC(12, 2);
    v_balance NUMERIC(12, 2);
    v_new_status TEXT;
    v_payment_id UUID;
BEGIN
    -- Lock bill row for atomic update
    SELECT * INTO v_bill FROM public.bills WHERE id = p_bill_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill with ID % not found', p_bill_id;
    END IF;

    -- Calculate current total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.payments
    WHERE bill_id = p_bill_id;

    v_balance := v_bill.amount - v_total_paid;

    -- Validate payment amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero';
    END IF;

    IF p_amount > v_balance THEN
        RAISE EXCEPTION 'Payment amount (%) exceeds outstanding balance (%)', p_amount, v_balance;
    END IF;

    -- Insert payment record
    INSERT INTO public.payments (
        bill_id, payment_date, amount, payment_mode, reference_number, recorded_by
    ) VALUES (
        p_bill_id, timezone('utc'::text, now()), p_amount, p_payment_mode, p_reference_number, p_recorded_by
    ) RETURNING id INTO v_payment_id;

    -- Determine new status
    v_new_total := v_total_paid + p_amount;
    IF v_new_total >= v_bill.amount THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := 'partially_paid';
    END IF;

    -- Update bill status
    UPDATE public.bills
    SET payment_status = v_new_status
    WHERE id = p_bill_id;

    RETURN jsonb_build_object(
        'payment_id', v_payment_id,
        'bill_id', p_bill_id,
        'amount_paid', p_amount,
        'total_paid', v_new_total,
        'remaining_balance', v_bill.amount - v_new_total,
        'payment_status', v_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. ALERT SETTINGS & ALERTS (ER Entity: Alert)
-- Consumption triggers Alert (1:1 / 1:N)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.alert_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    high_consumption_threshold NUMERIC(10, 2) NOT NULL DEFAULT 500.00, -- in kWh
    percentage_increase_threshold NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- in %
    overdue_days_threshold INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL,
    reading_date DATE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    alert_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('High Consumption', 'Abnormal Usage', 'Unpaid Bill', 'Overdue Bill')),
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    FOREIGN KEY (meter_id, reading_date) REFERENCES public.consumption_readings(meter_id, reading_date) ON DELETE CASCADE,
    CONSTRAINT uq_alert_reading_type UNIQUE (meter_id, reading_date, alert_type)
);

-- =============================================================================
-- 9. REPORTS & REPORT_BILLS (ER Entity: Report)
-- Multiple bills may be included in one Report
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    report_type TEXT NOT NULL CHECK (report_type IN (
        'daily_consumption', 'monthly_consumption', 'yearly_consumption',
        'consumer_wise', 'meter_wise', 'billing_summary', 'payment_summary', 'outstanding_bills'
    )),
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    summary_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.report_bills (
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    PRIMARY KEY (report_id, bill_id)
);
