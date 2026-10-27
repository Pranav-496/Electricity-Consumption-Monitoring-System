# Business Rules & Logic Specifications

## Rule 1: Electricity Consumption Calculation
- **Units Consumed Formula**:
  $$\text{Units Consumed} = \text{Current Cumulative Reading} - \text{Previous Cumulative Reading}$$
- **Derived Attribute**: Units consumed is computed on demand via PostgreSQL view `v_consumption_readings` and never redundantly persisted.
- **Chronological Consistency**:
  - `current_reading >= previous_reading` is enforced via CHECK constraint.
  - A reading's `previous_reading` cannot be lower than the meter's chronological predecessor's `current_reading`.
  - A reading's `current_reading` cannot be higher than the meter's chronological successor's `previous_reading`.
  - Duplicate meter readings on the exact same date are rejected by composite primary key `(meter_id, reading_date)`.

---

## Rule 2: Tariff-Based Billing Formula
- **Calculation Breakdown**:
  $$\text{Energy Charge} = \text{Units Consumed} \times \text{Tariff Rate Per Unit}$$
  $$\text{Subtotal} = \text{Energy Charge} + \text{Base Fixed Charge}$$
  $$\text{Tax Amount} = \frac{\text{Subtotal} \times \text{Tax Percentage}}{100}$$
  $$\text{Final Bill Amount} = \text{Subtotal} + \text{Tax Amount}$$
- **Historical Rate Immutability**: When a bill is generated, the exact tariff values (`rate_per_unit`, `fixed_charge`, `tax_amount`) used for that calculation are stored directly in the `bills` table. Updating a tariff in the future will never retroactively modify past billing statements.
- **Idempotency**: A bill can only be generated once for a given `(meter_id, reading_date)` pair, enforced by `UNIQUE (meter_id, reading_date)`.

---

## Rule 3: 1:1 Meter Assignment Integrity
- In this model, every consumer is entitled to exactly **one active meter**.
- Enforced at database level via `UNIQUE (consumer_id)` constraint on `public.meters`.
- Attempting to register a second meter for the same consumer is rejected with a relational constraint error.

---

## Rule 4: Payment Ledger & Transactional Settlement
- **Multiple Partial Payments**: Multiple payment entries can be recorded against a single bill.
- **Outstanding Balance**:
  $$\text{Outstanding Balance} = \text{Bill Amount} - \sum(\text{Verified Payments})$$
- **Payment Status Progression**:
  - `unpaid`: Zero payments recorded.
  - `partially_paid`: Payments recorded, but outstanding balance $> 0$.
  - `paid`: Outstanding balance $= 0$.
  - `overdue`: Due date has elapsed and outstanding balance $> 0$.
- **Overpayment Prevention**: Payment amounts exceeding the outstanding balance are rejected.
- **Atomic Execution**: Stored procedure `record_payment_transaction` locks the bill row with `FOR UPDATE` to guarantee serializable updates without race conditions.

---

## Rule 5: Automated Alert Detection
- **High Consumption Alert**: Triggered when a reading records $\text{Units Consumed} > 500\text{ kWh}$ (configurable via `alert_settings`).
- **Abnormal Usage Surge**: Triggered when consumption increases by $\ge 50\%$ compared to the immediately preceding cycle.
- **Overdue Bill Alert**: Automatically flagged when $\text{Current Date} > \text{Due Date}$ and $\text{Outstanding Balance} > 0$.
- **Deduplication**: Alerts for the same `(meter_id, reading_date, alert_type)` are deduplicated.

---

## Rule 6: Non-Destructive Entity Deactivation
- Direct destructive deletion (`CASCADE`) of consumers or meters that have linked consumption or financial records is prohibited to protect audit trails.
- Deactivating an account sets `is_active = false` or `meter_status = 'inactive'`, preventing further readings while keeping historical ledgers intact.
