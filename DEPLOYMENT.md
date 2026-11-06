# Production Deployment Guide: Taw Platform

This guide walks you through deploying the complete Ethiopian Relationship Awareness & Safety Community platform using:
- **Neon**: Serverless PostgreSQL database with connection pooling
- **Render**: Node.js backend API & persistent Telegram bot
- **Vercel**: React admin dashboard frontend
- **Cloudinary**: Cloud storage & CDN for user-submitted photos and evidence

---

## Production Architecture

```
┌──────────────────────────────────────┐
│           Vercel Frontend            │
│     https://taw-admin.vercel.app     │
│       (React 18 + Vite 6 SPA)        │
└──────────────────┬───────────────────┘
                   │ HTTPS API Requests (JWT Auth)
                   ▼
┌──────────────────────────────────────┐     ┌────────────────────────┐
│         Render Web Service           │◄────┤  Telegram Bot / Users  │
│        (Node 22 REST API)            │     │  (Long Polling/Worker) │
│       https://taw-api.onrender.com   │     └───────────┬────────────┘
└───┬──────────────┬───────────────┬───┘                 │
    │              │               │                     │
    ▼              ▼               ▼                     ▼
┌─────────┐  ┌───────────┐  ┌──────────────┐      ┌──────────────┐
│  Neon   │  │   Redis   │  │  Cloudinary  │      │   Telegram   │
│ Postgres│  │  (BullMQ) │  │ Image CDN &  │◄─────┤ Channel Post │
│ Pooling │  │  (Optional│  │ Evidence     │      │  (Broadcast) │
└─────────┘  └───────────┘  └──────────────┘      └──────────────┘
```

---

## Part 1: Provision Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech) and create or log in to your account.
2. Click **Create Project**:
   - **Project Name**: `taw-production`
   - **Postgres Version**: 16 (or 17)
   - **Region**: Frankfurt (`eu-central-1`) or Oregon/Ohio (choose closest to Render's region).
3. Once the database is created, Neon displays your Connection Details:
   - **Pooled connection string** (check "Connection pooling" checkbox):
     ```
     postgresql://neondb_owner:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
     ```
     *(This is your `DATABASE_URL`)*
   - **Direct connection string** (uncheck "Connection pooling"):
     ```
     postgresql://neondb_owner:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
     ```
     *(This is your `DIRECT_URL` used for running Prisma migrations)*

---

## Part 2: Set Up Cloudinary for Photo Storage

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account.
2. In the Cloudinary Dashboard (Console), locate your **Product Environment Credentials**:
   - **Cloud Name**: e.g. `dxyza123`
   - **API Key**: e.g. `123456789012345`
   - **API Secret**: e.g. `abcdefghijklmnopqrstuvwxyz`
   - Or the single **API Environment variable**:
     ```
     CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
     ```

---

## Part 3: Deploy Backend on Render

You can deploy the backend using either **Option A (Render Blueprint - Easiest)** or **Option B (Manual Web Service)**.

### Option A: Render Blueprint (`render.yaml`)
1. Log in to [render.com](https://render.com).
2. Go to **Blueprints** → **New Blueprint Instance**.
3. Select your GitHub repository: `https://github.com/Eyob-bit/taw.git`.
4. Render will read `render.yaml` and prompt for the required environment variables.
5. Click **Apply**.

### Option B: Manual Web Service
1. On Render, click **New +** → **Web Service**.
2. Connect your repository: `Eyob-bit/taw`.
3. Configure settings:
   - **Name**: `taw-api`
   - **Region**: Frankfurt (recommended)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile.api`
   - **Plan**: Starter ($7/mo recommended for 24/7 uptime without sleep)
4. Under **Advanced Settings**:
   - **Pre-Deploy Command**:
     ```bash
     npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && node apps/api/prisma/seed.js
     ```
     *(This runs migrations and seeds the super admin once per deployment without slowing container boot or risking race conditions).*
   - **Health Check Path**: `/health`

5. Add Environment Variables:
   | Variable | Value / Notes |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | Your Neon **Pooled** connection string |
   | `DIRECT_URL` | Your Neon **Direct** connection string |
   | `JWT_SECRET` | Secure random string (32+ chars) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `BOT_API_KEY` | Strong random token for bot API access |
   | `CORS_ORIGIN` | `https://taw-admin.vercel.app` (or `*`) |
   | `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
   | `TELEGRAM_BOT_TOKEN` | Token from @BotFather |
   | `TELEGRAM_BOT_USERNAME` | Your bot username (e.g. `tawkiwalesh_bot`) |
   | `TELEGRAM_CHANNEL_ID` | Your channel ID (e.g. `-1003900110535` or `@your_channel`) |
   | `TELEGRAM_DISCUSSION_GROUP_ID` | Group ID (e.g. `-100xxxxxxx`) |
   | `RUN_EMBEDDED_BOT` | `true` *(Runs the Telegram bot alongside the API in the same service to save cost)* |
   | `INITIAL_ADMIN_EMAIL` | `admin@ethiopia-awareness.org` |
   | `INITIAL_ADMIN_PASSWORD` | Strong password for initial admin login |
   | `INITIAL_ADMIN_NAME` | `Platform Super Admin` |
   | `REDIS_URL` | Optional (if using Upstash or Render Redis; falls back to in-memory async executor if left empty) |

6. Click **Create Web Service**.
7. Once deployed, copy your Render URL (e.g., `https://taw-api.onrender.com`).

---

## Part 4: Deploy Admin Dashboard on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and log in with GitHub.
2. Import repository **`Eyob-bit/taw`**.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Leave as `./` (or select `apps/admin`). The project includes both root and app `vercel.json` rewrite files for SPA routing.
   - **Build Command**: `npm --workspace=@taw/admin run build`
   - **Output Directory**: `apps/admin/dist`
4. Add Environment Variables:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://taw-api.onrender.com/api` *(Your Render backend URL + `/api`)* |
   | `VITE_TELEGRAM_CHANNEL_URL` | `https://t.me/your_channel` |
5. Click **Deploy**.
6. Vercel will build and assign your production URL (e.g., `https://taw-admin.vercel.app`).
7. Update `CORS_ORIGIN` in Render to match your exact Vercel URL.

---

## Part 5: Bot Operation: Embedded vs. Separate Worker

You have two options for running the Telegram Bot on Render:

| Mode | Configuration | Pros & Cons |
| :--- | :--- | :--- |
| **Embedded (Recommended)** | Set `RUN_EMBEDDED_BOT=true` on the `taw-api` service | Runs API + Bot in one single Render Starter service ($7/mo total). Ideal for low-to-medium traffic. |
| **Dedicated Worker** | Set `RUN_EMBEDDED_BOT=false` on `taw-api` and create a separate Render **Background Worker** using `Dockerfile.bot` | Full CPU/memory isolation for high traffic. Costs an additional Render service ($7/mo extra). |

---

## Part 6: Production Verification Checklist

1. **API Health Check**:
   Visit `https://<YOUR-RENDER-API>/health` in your browser. Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-11-07T...",
     "service": "Ethiopian Relationship Awareness API"
   }
   ```

2. **Admin Dashboard Login**:
   - Open your Vercel URL: `https://<YOUR-VERCEL-APP>.vercel.app/login`
   - Sign in with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`.
   - Verify Overview statistics and Moderation page load without CORS errors.

3. **Telegram Bot Submissions & Cloudinary**:
   - Open your bot in Telegram and send `/start`.
   - Select a language and category, accept guidelines.
   - Attach a test photo with description and confirm submission.
   - In Cloudinary Media Library, verify the photo uploaded into folder `taw_submissions` at full quality.
   - In the React Admin Dashboard (`/moderation`), verify the photo renders properly.

4. **Telegram Channel Publishing**:
   - Approve a submission in the Admin Dashboard.
   - Verify it publishes cleanly with bilingual formatting and hashtags to your designated Telegram Channel.
