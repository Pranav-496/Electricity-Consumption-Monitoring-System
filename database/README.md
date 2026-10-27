# Database Setup Guide — Electricity Consumption Monitoring System

This project uses **Supabase PostgreSQL** as its relational database engine, implementing academic DBMS concepts including:
- Composite Primary Keys and Composite Foreign Keys
- Derived Attributes (Units Consumed) calculated via PostgreSQL Views
- Chronological Consistency Constraints via PL/pgSQL Triggers
- Atomic Stored Procedures / Functions with Row Locking (`FOR UPDATE`) for Financial Transactions
- Comprehensive Row Level Security (RLS) policies for Role-Based Access Control (`admin` vs `consumer`)

---

## SQL Execution Order in Supabase SQL Editor

To initialize or reset your database, open your **Supabase Dashboard -> SQL Editor** and execute the scripts in the following order:

1. **`schema.sql`**
   - Enables UUID and cryptographic extensions
   - Creates `profiles`, `tariffs`, `consumers`, `meters`, `consumption_readings`, `bills`, `payments`, `alert_settings`, `alerts`, `reports`, and `report_bills`
   - Defines composite keys, constraints, and the `trg_validate_consumption` chronological trigger
   - Creates the `v_consumption_readings` view
   - Creates the `record_payment_transaction` PL/pgSQL function
   - Sets up automatic profile creation on auth sign-up

2. **`indexes.sql`**
   - Creates performance and foreign key lookup indexes for optimal query execution

3. **`rls_policies.sql`**
   - Enables RLS on all 11 tables
   - Creates security helper functions `is_admin()` and `get_current_consumer_id()`
   - Establishes granular policies for Admin and Consumer roles

4. **`seed.sql`**
   - Populates realistic demonstration data:
     - 3 Tariffs (Residential, Commercial, Industrial)
     - Demo administrator profile and 3 consumer profiles
     - 5 Consumers and 5 1:1 linked Meters
     - 11 Chronological meter readings demonstrating cumulative progression and consumption spikes
     - 6 Bills with exact energy charges, fixed charges, taxes, and due dates
     - 4 Recorded payments (full, partial, and overdue states)
     - Configured alert thresholds and generated alerts

---

## Initial Administrator Provisioning

In Supabase, authentication is managed by `auth.users`. To provision an Administrator:

### Method 1: Using the Supabase Dashboard
1. Go to **Authentication -> Users** in the Supabase Dashboard.
2. Click **Add User** -> **Create User**.
3. Enter Email: `admin@electric.local` and Password: `Admin@12345` (or your chosen password).
4. In **Table Editor -> profiles**, locate the profile created for this user and change `role` to `'admin'`.

### Method 2: Automatic via `seed.sql`
Running `seed.sql` automatically registers the demo admin (`admin@electric.local` / `Admin@12345`) and sets the `profiles.role` to `'admin'`.

---

## Entity Relationship Mapping

| ER Diagram Entity | Database Table | Key Attributes & Constraints |
| :--- | :--- | :--- |
| **User** | `profiles` | `id` (PK, ref `auth.users`), `username`, `role` (`admin`/`consumer`) |
| **Tariff** | `tariffs` | `id` (PK), `name`, `rate_per_unit`, `fixed_charge`, `tax_percentage` |
| **Consumer** | `consumers` | `id` (PK), `name`, `contact`, `user_id` (Manager Admin), `consumer_user_id` (Portal Login) |
| **Meter** | `meters` | `id` (PK), `meter_number` (UNIQUE), `consumer_id` (UNIQUE 1:1), `tariff_id` |
| **Consumption** | `consumption_readings` | Composite PK: `(meter_id, reading_date)`. Derived: `units_consumed` |
| **Bill** | `bills` | `id` (PK), Composite FK `(meter_id, reading_date)`, `amount`, `payment_status` |
| **Payment** | `payments` | `id` (PK), `bill_id` (FK), `amount`, `payment_mode`, `payment_date` |
| **Alert** | `alerts` | `id` (PK), Composite FK `(meter_id, reading_date)`, `alert_type`, `severity` |
| **Report** | `reports` | `id` (PK), `report_type`, `filters`, `report_date` |
| **Report_Bills** | `report_bills` | Composite PK: `(report_id, bill_id)` (Junction table) |
