# Deployment Guide — PowerGrid ECMS
**Architecture**: React + Vite on **Vercel** | Express REST API on **Render** | PostgreSQL on **Supabase**

---

## 1. Database Status (Supabase)
Your database has **already been fully initialized and migrated** with all 11 relational tables, views (`v_consumption_readings`), stored procedures (`record_payment_transaction`), validation triggers (`trg_validate_consumption`), and demonstration seed accounts.

- **Supabase Project Reference**: `ufoqlplrofftqrqekajx`
- **Supabase URL**: `https://ufoqlplrofftqrqekajx.supabase.co`
- **Database Connection String**:
  ```text
  postgresql://postgres.ufoqlplrofftqrqekajx:Heisenberg%40409600@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
  ```
  *(Note: The `@` inside the password `Heisenberg@409600` is URL-encoded as `%40` so standard URI parsers do not mistake it for host separators)*.

---

## 2. Deploying Backend API to Render

### Step A: Push Code to GitHub
Ensure your latest repository code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure deployment and Supabase live schema"
git push origin main
```

### Step B: Create a Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`Electricity-Consumption-Monitoring-System`).
3. Fill in the service configuration:
   - **Name**: `ecms-backend-api` (or your preferred name)
   - **Region**: Singapore or Frankfurt (choose nearest to your Supabase region `ap-northeast-2`)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step C: Configure Render Environment Variables
Under the **Environment Variables** tab in your Render Web Service, add the following variables:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and error masking |
| `PORT` | `10000` | Port assigned by Render |
| `CLIENT_ORIGIN` | `https://your-frontend.vercel.app` *(or `*` during initial setup)* | Permitted CORS frontend origin |
| `DATABASE_URL` | `postgresql://postgres.ufoqlplrofftqrqekajx:Heisenberg%40409600@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres` | Direct Supabase PostgreSQL connection |
| `SUPABASE_URL` | `https://ufoqlplrofftqrqekajx.supabase.co` | Supabase API REST endpoint |
| `SUPABASE_ANON_KEY` | *(Copy from Supabase Dashboard)* | Public anon JWT key |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Copy from Supabase Dashboard)* | Secret service role key (never expose to frontend) |
| `ENABLE_DEMO_FALLBACK` | `false` | Disables in-memory fallback to enforce live database |

> **Where to find the Supabase Keys**:
> 1. Visit your Supabase Dashboard: [https://supabase.com/dashboard/project/ufoqlplrofftqrqekajx/settings/api](https://supabase.com/dashboard/project/ufoqlplrofftqrqekajx/settings/api)
> 2. Copy the `anon` `public` key -> `SUPABASE_ANON_KEY`
> 3. Copy the `service_role` `secret` key -> `SUPABASE_SERVICE_ROLE_KEY`

4. Click **Deploy Web Service**.
5. Once deployed, Render will provide your public backend URL (e.g. `https://ecms-backend-api.onrender.com`).
6. Verify the health check: `https://ecms-backend-api.onrender.com/api/v1/health` should return `{"status":"OK"}`.

---

## 3. Deploying Frontend to Vercel

### Step A: Import Repository into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Select your `Electricity-Consumption-Monitoring-System` repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step B: Configure Vercel Environment Variables
Under the **Environment Variables** section, add the following:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://ecms-backend-api.onrender.com/api/v1` | Your deployed Render backend API URL |
| `VITE_SUPABASE_URL` | `https://ufoqlplrofftqrqekajx.supabase.co` | Supabase API endpoint |
| `VITE_SUPABASE_ANON_KEY` | *(Copy from Supabase Dashboard)* | Public anon JWT key |

4. Click **Deploy**.
5. Vercel will build and assign your production frontend URL (e.g., `https://electricity-consumption-monitoring.vercel.app`).
6. A `client/vercel.json` rewrite file is already configured in the repo to handle client-side routing (`BrowserRouter`) without 404s on page refresh.

---

## 4. Final Handshake (CORS Connection)
Once Vercel gives you your frontend URL:
1. Go back to **Render Dashboard** -> `ecms-backend-api` -> **Environment Variables**.
2. Update `CLIENT_ORIGIN` to your exact Vercel URL (e.g. `https://electricity-consumption-monitoring.vercel.app`).
3. Click **Save Changes** (Render will automatically redeploy the backend with the new CORS origin).

---

## 5. Live Demonstration Credentials
Once deployed, log into your live application using the pre-seeded credentials:
- **Grid Administrator**:
  - Email: `admin@electric.local`
  - Password: `Admin@12345`
- **Consumer Portal**:
  - Email: `john.doe@example.com`
  - Password: `Consumer@123`
