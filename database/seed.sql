-- =============================================================================
-- Electricity Consumption Monitoring System — Academic Demonstration Seed Data
-- =============================================================================

-- 1. TARIFFS (Residential, Commercial, Industrial)
INSERT INTO public.tariffs (id, name, description, rate_per_unit, fixed_charge, tax_percentage, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Residential Standard', 'Standard domestic slab rate with low fixed charges', 5.50, 85.00, 5.00, true),
    ('22222222-2222-2222-2222-222222222222', 'Commercial General', 'Commercial small business and retail rate', 9.20, 220.00, 12.00, true),
    ('33333333-3333-3333-3333-333333333333', 'Industrial High-Tension', 'Industrial manufacturing and heavy equipment tariff', 12.80, 650.00, 18.00, true)
ON CONFLICT (id) DO UPDATE SET 
    rate_per_unit = EXCLUDED.rate_per_unit,
    fixed_charge = EXCLUDED.fixed_charge,
    tax_percentage = EXCLUDED.tax_percentage;

-- 2. DEMO AUTH USERS & PROFILES (Safe upsert into auth.users for Supabase SQL Editor)
DO $$
DECLARE
    v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_consumer1_id UUID := 'c0000000-0000-0000-0000-000000000001';
    v_consumer2_id UUID := 'c0000000-0000-0000-0000-000000000002';
    v_consumer3_id UUID := 'c0000000-0000-0000-0000-000000000003';
BEGIN
    -- Only insert into auth.users if running in Supabase environment where auth schema exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES 
            (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@electric.local', crypt('Admin@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"admin","full_name":"Chief Grid Admin"}', now(), now(), 'authenticated', 'authenticated'),
            (v_consumer1_id, '00000000-0000-0000-0000-000000000000', 'john.doe@example.com', crypt('Consumer@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"johndoe","full_name":"Johnathan Doe"}', now(), now(), 'authenticated', 'authenticated'),
            (v_consumer2_id, '00000000-0000-0000-0000-000000000000', 'rajesh.sharma@example.com', crypt('Consumer@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"rajesh_sharma","full_name":"Rajesh Sharma"}', now(), now(), 'authenticated', 'authenticated'),
            (v_consumer3_id, '00000000-0000-0000-0000-000000000000', 'techcorp@example.com', crypt('Consumer@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"techcorp","full_name":"TechCorp Logistics"}', now(), now(), 'authenticated', 'authenticated')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
        SELECT 
            id,
            id,
            id::text,
            json_build_object('sub', id::text, 'email', email),
            'email',
            now(),
            now()
        FROM auth.users
        ON CONFLICT (provider_id, provider) DO NOTHING;
    END IF;

    -- Upsert Profiles
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES
        (v_admin_id, 'admin', 'Chief Grid Administrator', 'admin'),
        (v_consumer1_id, 'johndoe', 'Johnathan Doe', 'consumer'),
        (v_consumer2_id, 'rajesh_sharma', 'Rajesh Sharma', 'consumer'),
        (v_consumer3_id, 'techcorp', 'TechCorp Logistics', 'consumer')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, username = EXCLUDED.username, full_name = EXCLUDED.full_name;
END $$;

-- 3. CONSUMERS (ER Entity: Consumer)
INSERT INTO public.consumers (id, name, address, contact, email, user_id, consumer_user_id, is_active)
VALUES
    ('c1111111-0000-0000-0000-000000000001', 'Johnathan Doe', '42 Park Avenue, Metro City', '+1-555-0192', 'john.doe@example.com', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', true),
    ('c2222222-0000-0000-0000-000000000002', 'Rajesh Sharma Retail', 'Shop #12, Commercial Central Plaza', '+91-98765-43210', 'rajesh.sharma@example.com', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', true),
    ('c3333333-0000-0000-0000-000000000003', 'TechCorp Logistics Inc.', 'Plot 88, Industrial Export Zone', '+1-800-555-TECH', 'techcorp@example.com', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', true),
    ('c4444444-0000-0000-0000-000000000004', 'Priya Patel', 'Apt 5B, Skyline Residency', '+91-98111-22334', 'priya.patel@example.com', 'a0000000-0000-0000-0000-000000000001', NULL, true),
    ('c5555555-0000-0000-0000-000000000005', 'GreenValley Supermarket', '77 Greenway Boulevard', '+1-555-0144', 'greenvalley@example.com', 'a0000000-0000-0000-0000-000000000001', NULL, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contact = EXCLUDED.contact;

-- 4. METERS (ER Entity: Meter, 1:1 with Consumers)
INSERT INTO public.meters (id, meter_number, consumer_id, installation_date, meter_type, meter_status, tariff_id)
VALUES
    ('d1111111-0000-0000-0000-000000000001', 'MTR-2024-001', 'c1111111-0000-0000-0000-000000000001', '2023-01-15', 'Smart Meter', 'active', '11111111-1111-1111-1111-111111111111'),
    ('d2222222-0000-0000-0000-000000000002', 'MTR-2024-002', 'c2222222-0000-0000-0000-000000000002', '2023-03-20', 'Three Phase', 'active', '22222222-2222-2222-2222-222222222222'),
    ('d3333333-0000-0000-0000-000000000003', 'MTR-2024-003', 'c3333333-0000-0000-0000-000000000003', '2023-06-10', 'Three Phase', 'active', '33333333-3333-3333-3333-333333333333'),
    ('d4444444-0000-0000-0000-000000000004', 'MTR-2024-004', 'c4444444-0000-0000-0000-000000000004', '2023-08-05', 'Single Phase', 'active', '11111111-1111-1111-1111-111111111111'),
    ('d5555555-0000-0000-0000-000000000005', 'MTR-2024-005', 'c5555555-0000-0000-0000-000000000005', '2023-10-12', 'Digital', 'active', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO UPDATE SET meter_status = EXCLUDED.meter_status, meter_type = EXCLUDED.meter_type;

-- 5. CONSUMPTION READINGS (ER Entity: Consumption)
-- Sequential chronological cumulative meter readings
INSERT INTO public.consumption_readings (meter_id, reading_date, previous_reading, current_reading, created_by)
VALUES
    -- Meter 1 (Residential John Doe)
    ('d1111111-0000-0000-0000-000000000001', '2024-01-31', 1000.00, 1220.00, 'a0000000-0000-0000-0000-000000000001'), -- 220 units
    ('d1111111-0000-0000-0000-000000000001', '2024-02-29', 1220.00, 1465.00, 'a0000000-0000-0000-0000-000000000001'), -- 245 units
    ('d1111111-0000-0000-0000-000000000001', '2024-03-31', 1465.00, 1780.00, 'a0000000-0000-0000-0000-000000000001'), -- 315 units
    ('d1111111-0000-0000-0000-000000000001', '2024-04-30', 1780.00, 2390.00, 'a0000000-0000-0000-0000-000000000001'), -- 610 units (High Consumption Spike!)

    -- Meter 2 (Commercial Rajesh Sharma)
    ('d2222222-0000-0000-0000-000000000002', '2024-01-31', 2500.00, 3120.00, 'a0000000-0000-0000-0000-000000000001'), -- 620 units
    ('d2222222-0000-0000-0000-000000000002', '2024-02-29', 3120.00, 3780.00, 'a0000000-0000-0000-0000-000000000001'), -- 660 units
    ('d2222222-0000-0000-0000-000000000002', '2024-03-31', 3780.00, 4490.00, 'a0000000-0000-0000-0000-000000000001'), -- 710 units
    ('d2222222-0000-0000-0000-000000000002', '2024-04-30', 4490.00, 5210.00, 'a0000000-0000-0000-0000-000000000001'), -- 720 units

    -- Meter 3 (Industrial TechCorp)
    ('d3333333-0000-0000-0000-000000000003', '2024-02-29', 10000.00, 13400.00, 'a0000000-0000-0000-0000-000000000001'), -- 3400 units
    ('d3333333-0000-0000-0000-000000000003', '2024-03-31', 13400.00, 17100.00, 'a0000000-0000-0000-0000-000000000001'), -- 3700 units
    ('d3333333-0000-0000-0000-000000000003', '2024-04-30', 17100.00, 20950.00, 'a0000000-0000-0000-0000-000000000001')  -- 3850 units
ON CONFLICT (meter_id, reading_date) DO UPDATE SET 
    previous_reading = EXCLUDED.previous_reading,
    current_reading = EXCLUDED.current_reading;

-- 6. BILLS (ER Entity: Bill)
-- Calculation: Energy = Units * Rate; Subtotal = Energy + Fixed; Tax = Subtotal * Tax% / 100; Amount = Subtotal + Tax
INSERT INTO public.bills (id, meter_id, reading_date, bill_date, billing_period_start, billing_period_end, units_consumed, rate_per_unit, fixed_charge, tax_amount, amount, due_date, payment_status)
VALUES
    -- Meter 1, Jan 2024: 220 units @ 5.50 = 1210; Sub = 1210 + 85 = 1295; Tax (5%) = 64.75; Total = 1359.75 (PAID)
    ('b1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', '2024-01-31', '2024-02-01', '2024-01-01', '2024-01-31', 220.00, 5.50, 85.00, 64.75, 1359.75, '2024-02-20', 'paid'),
    
    -- Meter 1, Feb 2024: 245 units @ 5.50 = 1347.50; Sub = 1432.50; Tax = 71.63; Total = 1504.13 (PAID)
    ('b1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000001', '2024-02-29', '2024-03-01', '2024-02-01', '2024-02-29', 245.00, 5.50, 85.00, 71.63, 1504.13, '2024-03-20', 'paid'),
    
    -- Meter 1, Mar 2024: 315 units @ 5.50 = 1732.50; Sub = 1817.50; Tax = 90.88; Total = 1908.38 (PARTIALLY_PAID)
    ('b1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', '2024-03-31', '2024-04-01', '2024-03-01', '2024-03-31', 315.00, 5.50, 85.00, 90.88, 1908.38, '2024-04-20', 'partially_paid'),
    
    -- Meter 1, Apr 2024: 610 units @ 5.50 = 3355.00; Sub = 3440.00; Tax = 172.00; Total = 3612.00 (UNPAID)
    ('b1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000001', '2024-04-30', '2024-05-01', '2024-04-01', '2024-04-30', 610.00, 5.50, 85.00, 172.00, 3612.00, '2024-05-20', 'unpaid'),

    -- Meter 2, Jan 2024: 620 units @ 9.20 = 5704; Sub = 5924; Tax (12%) = 710.88; Total = 6634.88 (PAID)
    ('b2222222-0000-0000-0000-000000000001', 'd2222222-0000-0000-0000-000000000002', '2024-01-31', '2024-02-01', '2024-01-01', '2024-01-31', 620.00, 9.20, 220.00, 710.88, 6634.88, '2024-02-20', 'paid'),

    -- Meter 2, Feb 2024: 660 units @ 9.20 = 6072; Sub = 6292; Tax = 755.04; Total = 7047.04 (OVERDUE)
    ('b2222222-0000-0000-0000-000000000002', 'd2222222-0000-0000-0000-000000000002', '2024-02-29', '2024-03-01', '2024-02-01', '2024-02-29', 660.00, 9.20, 220.00, 755.04, 7047.04, '2024-03-20', 'overdue')
ON CONFLICT (id) DO UPDATE SET payment_status = EXCLUDED.payment_status;

-- 7. PAYMENTS (ER Entity: Payment)
INSERT INTO public.payments (id, bill_id, payment_date, amount, payment_mode, reference_number, recorded_by)
VALUES
    -- Full payment for Bill 1
    ('e1111111-0000-0000-0000-000000000001', 'b1111111-0000-0000-0000-000000000001', '2024-02-10 14:30:00+00', 1359.75, 'upi', 'UPI/20240210/987123', 'a0000000-0000-0000-0000-000000000001'),
    -- Full payment for Bill 2
    ('e1111111-0000-0000-0000-000000000002', 'b1111111-0000-0000-0000-000000000002', '2024-03-12 11:15:00+00', 1504.13, 'card', 'CARD/TXN-5432-8899', 'a0000000-0000-0000-0000-000000000001'),
    -- Partial payment for Bill 3 (Amount: 1908.38, Paid: 1000.00, Outstanding: 908.38)
    ('e1111111-0000-0000-0000-000000000003', 'b1111111-0000-0000-0000-000000000003', '2024-04-15 16:45:00+00', 1000.00, 'bank_transfer', 'NEFT/20240415/77621', 'a0000000-0000-0000-0000-000000000001'),
    -- Full payment for Commercial Bill 1
    ('e2222222-0000-0000-0000-000000000001', 'b2222222-0000-0000-0000-000000000001', '2024-02-18 10:00:00+00', 6634.88, 'bank_transfer', 'RTGS/20240218/99812', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 8. ALERTS (ER Entity: Alert)
INSERT INTO public.alerts (id, meter_id, reading_date, bill_id, alert_date, alert_type, message, severity, is_read)
VALUES
    ('a1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', '2024-04-30', NULL, '2024-05-01 08:00:00+00', 'High Consumption', 'Monthly consumption of 610.00 kWh exceeded threshold (500 kWh). 93.6% surge compared to previous cycle.', 'critical', false),
    ('a2222222-0000-0000-0000-000000000002', 'd2222222-0000-0000-0000-000000000002', '2024-02-29', 'b2222222-0000-0000-0000-000000000002', '2024-03-21 00:05:00+00', 'Overdue Bill', 'Bill #b2222222 for Rs. 7,047.04 is past its due date (2024-03-20) with Rs. 7,047.04 outstanding balance.', 'warning', false)
ON CONFLICT (id) DO NOTHING;

-- 9. ALERT SETTINGS (Configurable rules)
INSERT INTO public.alert_settings (id, high_consumption_threshold, percentage_increase_threshold, overdue_days_threshold, is_active)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 500.00, 50.00, 1, true)
ON CONFLICT (id) DO UPDATE SET 
    high_consumption_threshold = EXCLUDED.high_consumption_threshold,
    percentage_increase_threshold = EXCLUDED.percentage_increase_threshold;
