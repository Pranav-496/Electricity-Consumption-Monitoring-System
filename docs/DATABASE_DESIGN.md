# Database Design Specification — Electricity Consumption Monitoring System

## 1. Overview
The database for the Electricity Consumption Monitoring System is engineered using **Supabase PostgreSQL**. It strictly models the entities and relationships specified in the Academic DBMS Project Report and ER Diagram, adhering to third normal form (3NF), relational constraints, check conditions, derived attributes, and Row Level Security (RLS).

---

## 2. Entity-Relationship (ER) Mapping

| ER Diagram Entity | PostgreSQL Table | Primary Key | Foreign Keys & Relationships |
| :--- | :--- | :--- | :--- |
| **User** | `public.profiles` | `id` (UUID, ref `auth.users`) | 1:N with `consumers` (User manages Consumer) |
| **Tariff** | `public.tariffs` | `id` (UUID) | 1:N with `meters` (Tariff applies to Meter) |
| **Consumer** | `public.consumers` | `id` (UUID) | Ref `profiles(id)` via `user_id` (Manager Admin) and `consumer_user_id` (Portal Account) |
| **Meter** | `public.meters` | `id` (UUID) | Ref `consumers(id)` (1:1 enforced by UNIQUE constraint), Ref `tariffs(id)` |
| **Consumption** | `public.consumption_readings` | `(meter_id, reading_date)` **Composite PK** | Ref `meters(id)`. Derived attribute: `units_consumed` |
| **Bill** | `public.bills` | `id` (UUID) | **Composite FK** `(meter_id, reading_date)` referencing `consumption_readings` |
| **Payment** | `public.payments` | `id` (UUID) | Ref `bills(id)` (1:N for partial payments ledger) |
| **Alert** | `public.alerts` | `id` (UUID) | Composite FK `(meter_id, reading_date)` referencing `consumption_readings`, Ref `bills(id)` |
| **Report** | `public.reports` | `id` (UUID) | Ref `profiles(id)` (generated_by) |
| **Report_Bills** | `public.report_bills` | `(report_id, bill_id)` **Composite PK** | Junction table mapping multiple bills to a report |

---

## 3. Detailed Table Schemas

### 3.1 `profiles`
Extends Supabase Auth users with system role permissions:
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('admin', 'consumer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 3.2 `tariffs`
Stores pricing models for residential, commercial, and industrial consumers:
```sql
CREATE TABLE public.tariffs (
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
```

### 3.3 `consumers`
Stores electricity consumers. Enforces the 1:N User-Manages-Consumer relationship while providing authenticated portal login via `consumer_user_id`:
```sql
CREATE TABLE public.consumers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    consumer_user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 3.4 `meters`
Enforces the **1:1 Consumer-has-Meter** relationship through a `UNIQUE (consumer_id)` constraint:
```sql
CREATE TABLE public.meters (
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
```

### 3.5 `consumption_readings`
Records cumulative meter readings. Uses a composite primary key `(meter_id, reading_date)`.
```sql
CREATE TABLE public.consumption_readings (
    meter_id UUID NOT NULL REFERENCES public.meters(id) ON DELETE RESTRICT,
    reading_date DATE NOT NULL,
    previous_reading NUMERIC(12, 2) NOT NULL CHECK (previous_reading >= 0),
    current_reading NUMERIC(12, 2) NOT NULL CHECK (current_reading >= 0),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (meter_id, reading_date),
    CONSTRAINT chk_reading_order CHECK (current_reading >= previous_reading)
);
```

### Derived View: `v_consumption_readings`
Units consumed is a derived attribute (`current_reading - previous_reading`) and is not redundantly stored:
```sql
CREATE OR REPLACE VIEW public.v_consumption_readings AS
SELECT 
    cr.meter_id,
    m.meter_number,
    c.id AS consumer_id,
    c.name AS consumer_name,
    t.id AS tariff_id,
    t.name AS tariff_name,
    cr.reading_date,
    cr.previous_reading,
    cr.current_reading,
    (cr.current_reading - cr.previous_reading) AS units_consumed,
    cr.created_at
FROM public.consumption_readings cr
JOIN public.meters m ON cr.meter_id = m.id
JOIN public.consumers c ON m.consumer_id = c.id
JOIN public.tariffs t ON m.tariff_id = t.id;
```

### 3.6 `bills`
Generated bills reference the composite key `(meter_id, reading_date)`. Prevents duplicate bill creation via `UNIQUE (meter_id, reading_date)`.
```sql
CREATE TABLE public.bills (
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
```

### 3.7 `payments`
Maintains verified receipts against bills:
```sql
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE RESTRICT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'card')),
    reference_number TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 4. Stored Procedures & Triggers

### 4.1 Chronological Reading Consistency Trigger
Trigger function `fn_validate_consumption_reading` runs `BEFORE INSERT OR UPDATE` on `consumption_readings`:
- Finds the chronological predecessor reading for the meter and asserts `previous_reading >= predecessor.current_reading`.
- Finds the chronological successor reading for the meter and asserts `current_reading <= successor.previous_reading`.

### 4.2 Transactional Payment Stored Procedure
Function `record_payment_transaction(p_bill_id, p_amount, p_payment_mode, p_reference_number, p_recorded_by)`:
- Executes `SELECT * FROM bills WHERE id = p_bill_id FOR UPDATE` to lock the bill row against race conditions.
- Reconciles total payments recorded so far: `outstanding_balance = amount - sum(payments)`.
- Validates `p_amount <= outstanding_balance`.
- Inserts new payment record.
- Sets `payment_status` to `'paid'` if outstanding balance reaches zero, or `'partially_paid'` otherwise.
