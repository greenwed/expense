# 💰 RupeeTrack — Full-Stack Personal & Family Expense Tracker

A modern, responsive full-stack Expense Tracker Web App featuring dual workspaces (Personal & Collaborative Family), JWT authentication, real-time balance calculations, category-wise spending visualizer with Recharts, 80% budget threshold alerts, and UUID-based invite links for shared group budgeting.

---

## ✨ Key Features

- **🔐 Privacy-First JWT Authentication**:
  - Simple registration: Name, unique Username, and Password.
  - No email or phone number required.
  - Secure session storage with JWTs.

- **👤 Personal Workspace**:
  - Set theoretical monthly budget in **₹ (INR)** (editable anytime).
  - Add expenses across 6 categories: `Food`, `Shopping`, `Entertainment`, `Medical`, `Transport`, `Others`.
  - Date & Time selector with "Use Current Time" 1-click option.
  - Real-time remaining balance calculation (`Budget − Total Spent`).
  - Edit and delete any entry with instant balance updates.
  - Search entries by description & filter by category pills.
  - Interactive **Recharts Donut/Pie Chart** showing percentages and ₹ amounts.
  - Month filter (`<` / `>` and Month picker) to navigate past and future months.

- **⚠️ 80% & 100% Budget Warning System**:
  - Visual amber warning alert banner triggers when spending exceeds **80%** of budget.
  - Red danger alert triggers when spending exceeds **100%** of budget with a progress bar.

- **👨‍👩‍👧 Family Workspace (Group Budgeting)**:
  - Create custom-named family groups (e.g. `MyHome Family`).
  - Shareable UUID invite links (`/join/<invite-token>`) with 1-click copy.
  - **Role-Based Access Control (RBAC)**:
    - **Admin**: Full control (add/edit/delete any expense, rename group, set budget, promote/demote members, remove members, regenerate invite links).
    - **Moderator**: Can edit/delete any member's expense and change monthly budget.
    - **Member**: Can add their own expenses only.
  - Shared spending pie chart and member expense list with author attribution tags (`Added by: Name (Role)`).

- **📱 Mobile Responsive & Clean UI**:
  - Built with React 18, Tailwind CSS, Lucide icons, and Recharts.

---

## 🛠 Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Lucide React, Recharts
- **Backend**: Node.js, Express, CORS, Dotenv, UUID
- **Database**: MongoDB / Mongoose (with built-in persistent zero-setup fallback)
- **Authentication**: JWT & Bcrypt password hashing
- **Deployment**: Vercel & Render ready

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Backend & Frontend
```bash
npm run dev
```

- Frontend Dev Server: `http://localhost:3000`
- Full-Stack Backend Server: `http://localhost:5001`

---

## ☁️ Free Cloud Deployment

For step-by-step instructions on deploying to **Vercel** or **Render** with **MongoDB Atlas (Free M0 Sandbox)** and connecting a custom domain with free SSL, see:
📖 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 👥 Demo Accounts

| Role | Username | Password |
|---|---|---|
| **Admin** | `karthik` | `password123` |
| **Moderator** | `priya` | `password123` |
| **Member** | `rahul` | `password123` |
