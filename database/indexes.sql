-- =============================================================================
-- Electricity Consumption Monitoring System — Performance & Integrity Indexes
-- =============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Consumers
CREATE INDEX IF NOT EXISTS idx_consumers_user_id ON public.consumers(user_id);
CREATE INDEX IF NOT EXISTS idx_consumers_consumer_user_id ON public.consumers(consumer_user_id);
CREATE INDEX IF NOT EXISTS idx_consumers_name ON public.consumers(name);
CREATE INDEX IF NOT EXISTS idx_consumers_is_active ON public.consumers(is_active);

-- Meters
CREATE INDEX IF NOT EXISTS idx_meters_consumer_id ON public.meters(consumer_id);
CREATE INDEX IF NOT EXISTS idx_meters_tariff_id ON public.meters(tariff_id);
CREATE INDEX IF NOT EXISTS idx_meters_meter_number ON public.meters(meter_number);
CREATE INDEX IF NOT EXISTS idx_meters_status ON public.meters(meter_status);

-- Consumption Readings (Composite index and lookup indexes)
CREATE INDEX IF NOT EXISTS idx_consumption_meter_date ON public.consumption_readings(meter_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_consumption_date ON public.consumption_readings(reading_date);

-- Bills
CREATE INDEX IF NOT EXISTS idx_bills_meter_date ON public.bills(meter_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON public.bills(bill_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON public.payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_mode ON public.payments(payment_mode);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_meter_date ON public.alerts(meter_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON public.alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_date ON public.alerts(alert_date DESC);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON public.reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_report_bills_bill_id ON public.report_bills(bill_id);
