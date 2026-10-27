# REST API Documentation — Electricity Consumption Monitoring System

Base URL: `http://localhost:5000/api/v1`

All responses follow the standard JSON envelope structure:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "timestamp": "2024-04-30T12:00:00.000Z"
}
```

---

## 1. Authentication & Profile

### `POST /auth/login`
- **Description**: Authenticate user credentials and return session token.
- **Access**: Public (Rate-limited)
- **Body**:
  ```json
  {
    "email": "admin@electric.local",
    "password": "Admin@12345"
  }
  ```

### `POST /auth/register`
- **Description**: Self-service registration for new electricity consumers.
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "consumer@example.com",
    "username": "johndoe",
    "full_name": "Johnathan Doe",
    "password": "Password@123"
  }
  ```

### `GET /auth/me`
- **Description**: Fetch current authenticated profile and linked consumer meter records.
- **Access**: Authenticated

### `PATCH /auth/profile`
- **Description**: Update user's full name.
- **Access**: Authenticated

---

## 2. Dashboard Analytics

### `GET /dashboard/overview`
- **Description**: Aggregated KPIs (Consumers, Active Meters, Total Consumption kWh, Bills Generated, Payments Collected, Outstanding Amount, Active Alerts). Scoped to consumer account if logged in as consumer.
- **Access**: Authenticated

### `GET /dashboard/consumption-trend`
- **Description**: Monthly chronological aggregation of units consumed.
- **Access**: Authenticated

### `GET /dashboard/billing-summary`
- **Description**: Monthly comparison between billed charges and recorded payments collected.
- **Access**: Authenticated

### `GET /dashboard/recent-activity`
- **Description**: Recent meter readings, recent bills, and active alerts.
- **Access**: Authenticated

---

## 3. Consumers

### `GET /consumers`
- **Description**: List all registered consumers. Supports `search` and `is_active` query filters.
- **Access**: Admin

### `GET /consumers/:id`
- **Description**: Detailed consumer profile, assigned meter, consumption history, and bill statements.
- **Access**: Admin or Assigned Consumer

### `POST /consumers`
- **Description**: Register a new consumer record.
- **Access**: Admin
- **Body**:
  ```json
  {
    "name": "Acme Retail Ltd",
    "address": "100 Broadway St",
    "contact": "+1-555-0100",
    "email": "acme@example.com"
  }
  ```

### `PATCH /consumers/:id`
- **Description**: Update consumer contact or address information.
- **Access**: Admin

### `DELETE /consumers/:id`
- **Description**: Soft deactivation of consumer account. Preserves historical billing and consumption integrity.
- **Access**: Admin

---

## 4. Meters

### `GET /meters`
- **Description**: List all registered smart meters and their consumer assignments.
- **Access**: Admin

### `GET /meters/:id`
- **Description**: Specific meter hardware details and readings.
- **Access**: Admin or Assigned Consumer

### `POST /meters`
- **Description**: Register and assign a meter. Enforces 1:1 consumer relationship.
- **Access**: Admin
- **Body**:
  ```json
  {
    "meter_number": "MTR-2024-010",
    "consumer_id": "c1111111-0000-0000-0000-000000000001",
    "tariff_id": "11111111-1111-1111-1111-111111111111",
    "meter_type": "Smart Meter",
    "meter_status": "active"
  }
  ```

### `PATCH /meters/:id/status`
- **Description**: Toggle meter status between active and inactive.
- **Access**: Admin

---

## 5. Tariffs

### `GET /tariffs`
- **Description**: List all configured tariff categories and rates.
- **Access**: Authenticated

### `POST /tariffs`
- **Description**: Create a new tariff category.
- **Access**: Admin
- **Body**:
  ```json
  {
    "name": "Commercial Peak",
    "description": "Small business slab",
    "rate_per_unit": 9.20,
    "fixed_charge": 220.00,
    "tax_percentage": 12.00
  }
  ```

### `PATCH /tariffs/:id`
- **Description**: Update tariff rates. Existing bills preserve historical applied rates.
- **Access**: Admin

---

## 6. Consumption Telemetry

### `GET /consumption`
- **Description**: List chronological readings. Supports `meter_id`, `consumer_id`, and date range filters.
- **Access**: Authenticated (Consumer scoped)

### `POST /consumption`
- **Description**: Record cumulative meter reading. Automatically calculates `units_consumed` and evaluates alert conditions.
- **Access**: Admin
- **Body**:
  ```json
  {
    "meter_id": "m1111111-0000-0000-0000-000000000001",
    "reading_date": "2024-05-31",
    "previous_reading": 2390.00,
    "current_reading": 2640.00
  }
  ```

---

## 7. Billing & Payments

### `GET /bills`
- **Description**: List billing statements. Supports `payment_status` and `meter_id` filters.
- **Access**: Authenticated (Consumer scoped)

### `POST /bills/generate`
- **Description**: Compute charges and generate official bill statement using assigned tariff.
- **Access**: Admin
- **Body**:
  ```json
  {
    "meter_id": "m1111111-0000-0000-0000-000000000001",
    "reading_date": "2024-04-30",
    "bill_date": "2024-05-01",
    "due_date": "2024-05-20"
  }
  ```

### `GET /bills/:id/download`
- **Description**: Generate and stream official utility bill invoice PDF.
- **Access**: Authenticated

### `POST /payments`
- **Description**: Record verified payment transaction and update bill status transactionally.
- **Access**: Admin
- **Body**:
  ```json
  {
    "bill_id": "b1111111-0000-0000-0000-000000000004",
    "amount": 1000.00,
    "payment_mode": "upi",
    "reference_number": "UPI/20240505/11223"
  }
  ```

---

## 8. Alerts & Reports

### `GET /alerts`
- **Description**: Fetch system notices and threshold exceedance alerts.
- **Access**: Authenticated

### `POST /alerts/check`
- **Description**: Trigger system-wide automated scan for consumption surges (> 500 kWh or > 50% increase) and overdue invoices.
- **Access**: Admin

### `POST /reports/generate`
- **Description**: Generate comprehensive report (daily, monthly, yearly, consumer-wise, meter-wise, billing).
- **Access**: Authenticated

### `GET /reports/:report_type/download`
- **Description**: Export report data in CSV format.
- **Access**: Authenticated
