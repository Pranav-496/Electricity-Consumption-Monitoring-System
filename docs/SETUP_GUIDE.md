# System Setup & Deployment Guide

This guide walks you through setting up and demonstrating the **Electricity Consumption Monitoring System** for academic evaluation or production deployment.

---

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ recommended)
- **npm**: v9.0.0 or higher
- **Supabase Account**: (Free tier at [supabase.com](https://supabase.com))

---

## 2. Supabase Database Initialization

1. Log in to your **Supabase Dashboard** and create a new project.
2. In the left navigation, open **SQL Editor**.
3. Execute the SQL scripts located in the `database/` directory in this exact sequence:

   - **Step 1: Execute `database/schema.sql`**
     Creates extensions, all 11 tables, constraints, derived views, triggers, and stored procedures.
   - **Step 2: Execute `database/indexes.sql`**
     Builds relational lookup and composite query indexes.
   - **Step 3: Execute `database/rls_policies.sql`**
     Enables Row Level Security (RLS) and provisions granular policies for admin and consumer roles.
   - **Step 4: Execute `database/seed.sql`**
     Seeds demonstration tariffs, sample consumers, meters, chronological readings, bills, payments, and alerts.

4. Retrieve your API Keys from **Project Settings -> API**:
   - `Project URL`
   - `anon public` key
   - `service_role secret` key (server only)

---

## 3. Environment Configuration

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Supabase Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key

# Standalone demo fallback enabled if keys are not yet input
ENABLE_DEMO_FALLBACK=true
```

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

---

## 4. Installation & Startup

From the project root directory:

```bash
# 1. Install all dependencies (root, backend, and frontend)
npm run install:all

# 2. Run automated test suite to verify business rules
npm test

# 3. Start both backend REST API and frontend Vite server concurrently
npm run dev
```

The application will be live at:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000/api/v1`
- **API Health Check**: `http://localhost:5000/api/v1/health`

---

## 5. Academic Demonstration Quick Login

The application includes convenient 1-click demo login buttons on the login screen:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Grid Administrator** | `admin@electric.local` | `Admin@12345` | Full system dashboard, all consumers, all meters, bill generator, payment recording, alert rules, tariff management, global reports |
| **Consumer Portal** | `john.doe@example.com` | `Consumer@123` | Scoped to personal meter `MTR-2024-001`, personal consumption chart, personal bills, personal receipts, personal alerts |

---

## 6. Verifying DBMS Capabilities

During examination review, demonstrate:
1. **Derived Units Calculation**: Open **Consumption -> Record Meter Reading**. Enter previous reading (e.g. 2390) and current reading (e.g. 3000). Observe the live units calculated preview (610.00 kWh) and the alert trigger notice.
2. **Chronological Constraints**: Try entering a current reading lower than the previous reading. Observe client and server-side validation rejecting the record.
3. **1:1 Meter Rule**: In **Meters -> Register New Meter**, observe that consumers who already have an assigned meter cannot receive a second meter.
4. **Tariff Breakdown**: In **Billing -> Generate New Bill**, select a reading and verify the breakdown of Energy Charge, Fixed Charge, Tax, and Amount Due.
5. **Payment Reconciliation**: Record a partial payment (e.g. $1000) against an unpaid bill. Notice the status transitions to `PARTIALLY_PAID` and outstanding balance decreases atomically.
6. **PDF & CSV Export**: Download an official PDF utility invoice or export tabular analytics as CSV.
