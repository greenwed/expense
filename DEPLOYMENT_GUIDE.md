# 🚀 RupeeTrack - Neon PostgreSQL + Email OTP + Vercel Deployment Guide

This guide walks you through deploying **RupeeTrack** to **Vercel** with **Neon Serverless PostgreSQL** database, **Email OTP verification**, and automated table schema creation.

---

## 🌟 Architecture & Free Cloud Services

| Component | Cloud Provider | Free Tier Details |
|---|---|---|
| **Database** | **Neon.tech** | Free Tier (0.5 GB Serverless PostgreSQL, Connection Pooling, Instant Branching) |
| **Frontend & API** | **Vercel** | Free Hobby Tier (Unlimited deployments, Serverless API functions, Free SSL) |
| **Email OTP Delivery** | **Gmail / Resend / Zoho** | Free (e.g. Gmail App Password: 500 emails/day, Resend: 3,000 emails/month free) |
| **Custom Domain** | Any Registrar | (e.g. Namecheap, GoDaddy, Cloudflare) Free SSL on Vercel |

---

## 🛠️ Step-by-Step Deployment

### Step 1: Copy Your Neon PostgreSQL Connection String
1. Log into your [Neon Console](https://console.neon.tech).
2. On your Project Dashboard, under **Connection Details**:
   - Ensure the connection type is **Pooled connection** (recommended for serverless Vercel).
   - Copy the PostgreSQL URI:
     ```env
     postgresql://neondb_owner:your_password@ep-cool-pool-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

> **Note**: RupeeTrack automatically detects and initializes all SQL tables (`users`, `otp_verifications`, `personal_budgets`, `personal_expenses`, `family_groups`, `family_budgets`, `family_expenses`) upon your first connection!

---

### Step 2: Push Your Code to GitHub
In your `/Users/karthi-8017/Karthik/Others/Expense` folder:
```bash
cd /Users/karthi-8017/Karthik/Others/Expense
git add .
git commit -m "feat: Add email OTP verification, forgot password/username recovery"
git push origin main
```

---

### Step 3: Deploy on Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New... ➔ Project**.
2. Import your GitHub repository.
3. In **Environment Variables**, add:

| Variable Name | Value | Required? | Description |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:...` *(from Step 1)* | **Yes** | Your Neon PostgreSQL connection string |
| `JWT_SECRET` | *(Any random 32-character string)* | **Yes** | Secret for user sessions (e.g. `rupeetrack-secret-jwt-key-2026`) |
| `GMAIL_USER` | `yourname@gmail.com` | Optional | Gmail address for sending OTP emails |
| `GMAIL_APP_PASSWORD` | `xxxx xxxx xxxx xxxx` | Optional | 16-character Google App Password |

*(Note: If Gmail/SMTP variables are not added, OTPs will still function in simulated dev mode).*

4. Click **Deploy**. Vercel will build the frontend and deploy the serverless functions in ~45 seconds!

---

### 📧 Setting up Free Gmail App Password (Optional for Live Emails)
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification** (if not already enabled).
3. Search for **"App passwords"** in the top search bar.
4. Create an App Password with the name `RupeeTrack` and copy the 16-letter password into `GMAIL_APP_PASSWORD` on Vercel.

---

### 🌐 Add Your Custom Domain (Optional)
1. In your Vercel Project Dashboard, navigate to **Settings ➔ Domains**.
2. Type your domain (e.g., `budget.yourname.com` or `yourname.com`) and click **Add**.
3. Add the displayed DNS records (**CNAME** for subdomain or **A Record** `76.76.21.21` for root domain).
4. SSL certificate is provisioned automatically with HTTPS enabled.
