# 🚀 RupeeTrack - Neon PostgreSQL + Vercel Deployment Guide

This guide walks you through connecting your **Neon Serverless PostgreSQL** database to **RupeeTrack** and deploying to **Vercel** with automated table setup and free SSL.

---

## 🌟 Architecture & Free Cloud Services

| Component | Cloud Provider | Free Tier Details |
|---|---|---|
| **Database** | **Neon.tech** | Free Tier (0.5 GB Serverless PostgreSQL, Connection Pooling, Instant Branching) |
| **Frontend & API** | **Vercel** | Free Hobby Tier (Unlimited deployments, Serverless API functions, Free SSL) |
| **Custom Domain** | Any Registrar | (e.g. Namecheap, GoDaddy, Cloudflare) Free SSL on Vercel |

---

## 🛠️ Step-by-Step Deployment

### Step 1: Copy Your Neon PostgreSQL Connection String
1. Log into your [Neon Console](https://console.neon.tech).
2. Select your project (or create a new project named `expensetracker-db`).
3. On the **Dashboard**, under **Connection Details**:
   - Ensure the connection type is **Pooled connection** (recommended for serverless Vercel).
   - Copy the PostgreSQL URI:
     ```env
     postgresql://neondb_owner:your_password@ep-cool-pool-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

> **Note**: You do **NOT** need to create tables manually. RupeeTrack automatically detects and initializes all SQL tables (`users`, `personal_budgets`, `personal_expenses`, `family_groups`, `family_budgets`, `family_expenses`) upon your first connection!

---

### Step 2: Push Your Code to GitHub
In your `/Users/karthi-8017/Karthik/Others/Expense` folder:
```bash
cd /Users/karthi-8017/Karthik/Others/Expense
git add .
git commit -m "feat: Add Neon PostgreSQL support and database auto-schema"
git push origin main
```

---

### Step 3: Deploy on Vercel (1-Click)
1. Go to [Vercel](https://vercel.com) and click **Add New...** ➔ **Project**.
2. Import your GitHub repository.
3. In the **Environment Variables** section, add the following 2 variables:

| Variable Name | Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:...` *(from Step 1)* | Your Neon PostgreSQL connection string |
| `JWT_SECRET` | *(Any random 32-character string)* | Secret for user sessions (e.g. `rupeetrack-secret-jwt-key-2026`) |

4. Click **Deploy**. Vercel will build the frontend and deploy the serverless functions in ~45 seconds!

---

### Step 4: Add Your Custom Domain (Optional)
1. In your Vercel Project Dashboard, navigate to **Settings ➔ Domains**.
2. Type your domain (e.g., `budget.yourname.com` or `yourname.com`) and click **Add**.
3. Add the displayed DNS records (**CNAME** for subdomain or **A Record** `76.76.21.21` for root domain) in your domain provider.
4. SSL certificate is provisioned automatically with HTTPS enabled.

---

## 🧪 Local Testing with Neon

If you want to test your local server connected to your live Neon database:
1. Create a `.env` file in `/Users/karthi-8017/Karthik/Others/Expense/.env`:
   ```env
   DATABASE_URL="your-neon-postgresql-connection-string"
   JWT_SECRET="your-jwt-secret-key"
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. The server logs will confirm:
   `✅ Connected successfully to Neon Serverless PostgreSQL Database!`
