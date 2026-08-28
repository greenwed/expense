# 🚀 RupeeTrack - Expense Tracker Cloud Deployment Guide

This guide walks you through deploying **RupeeTrack** to **100% free cloud hosting platforms** (Vercel & Render) with **MongoDB Atlas** database and **custom domains** with automated free SSL certificates.

---

## 🌟 Quick Overview of Free Hosting Options

| Component | Free Provider | Free Tier Details |
|---|---|---|
| **Frontend & Serverless API** | **Vercel** | Free Hobby Tier (Unlimited personal deployments, automatic SSL, global edge CDN) |
| **All-in-One Fullstack Service** | **Render** | Free Web Service (Node.js runtime + automatic builds + free SSL) |
| **Database** | **MongoDB Atlas** | Free M0 Sandbox Cluster (512 MB storage, free forever, zero credit card) |
| **Custom Domain** | Any Registrar | (e.g. Namecheap, Cloudflare, GoDaddy) Connects to Vercel/Render for $0 extra |

---

## 🛠️ Step-by-Step Deployment (Option A: Recommended — Vercel + MongoDB Atlas)

### Step 1: Set up Free MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and register for a free account.
2. Click **Create Deployment** and select the **M0 Free** cluster tier (512 MB storage, $0/month forever).
3. Under **Database Access**, create a database user (e.g., username `admin`, password `securePassword123`).
4. Under **Network Access**, click **Add IP Address** -> select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Go to your cluster, click **Connect** -> **Drivers** (Node.js) -> copy your connection string:
   ```env
   MONGODB_URI="mongodb+srv://admin:securePassword123@cluster0.abcde.mongodb.net/expensetracker?retryWrites=true&w=majority"
   ```

---

### Step 2: Push Code to GitHub
1. In your local project directory, initialize and commit your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of RupeeTrack Expense Tracker"
   ```
2. Create a new repository on [GitHub](https://github.com) (e.g. `expensetracker`).
3. Link and push to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/expensetracker.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 3: Deploy on Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New...** -> **Project**.
2. Select and import your `expensetracker` GitHub repository.
3. In the **Environment Variables** section, add:

| Key | Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` *(from Step 1)* | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | *(Random 32-character string)* | Secret for JWT user sessions (e.g. `super-secret-key-2026`) |

4. Click **Deploy**. Vercel will automatically build the Vite frontend and deploy the serverless API routes in under 60 seconds!

---

## 🐳 Alternative Free Deployment (Option B: Render.com)

If you prefer an all-in-one Node.js container service:

1. Go to [Render.com](https://render.com) and sign up (Free).
2. Click **New +** -> **Web Service** -> connect your GitHub repository.
3. Configure the settings:
   - **Name**: `rupeetrack`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: Your random secret key
   - `PORT`: `10000` (Render default)
5. Click **Create Web Service**. Render will build and launch your full-stack app.

---

## 🌐 Attaching Your Custom Domain (with Free SSL)

You can point any custom domain you own (e.g., `expenses.yourdomain.com` or `mybudget.in`):

### In Vercel:
1. In your Vercel project dashboard, go to **Settings -> Domains**.
2. Type your domain (e.g. `budget.yourdomain.com` or `yourdomain.com`) and click **Add**.
3. Configure DNS records in your domain registrar:
   - For root domain (`yourdomain.com`): **A Record** -> `@` -> `76.76.21.21`
   - For subdomain (`budget.yourdomain.com`): **CNAME Record** -> `budget` -> `cname.vercel-dns.com`
4. Within minutes, DNS validates and Vercel provisions a **Free Automated Let's Encrypt SSL** certificate with HTTPS!

---

## 🧪 Local Testing Before Deploying

To test locally anytime:
```bash
# Start both backend API server and Vite frontend concurrently
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your web browser.
