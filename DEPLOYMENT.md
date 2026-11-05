# Production Deployment Guide: Taw Relationship Platform

This guide walks you through deploying the complete Ethiopian Relationship Awareness platform:
- **Admin Dashboard Frontend** on **Vercel**
- **REST API + Telegram Bot + PostgreSQL + Redis** on **Railway** (or **Render**)

---

## Architecture in Production

```
┌─────────────────────────────────┐
│     Vercel (React Frontend)     │
│   https://taw-admin.vercel.app  │
└────────────────┬────────────────┘
                 │ (HTTPS REST API / JWT)
                 ▼
┌────────────────────────────────────────────────────────┐
│             Railway / Render Backend Cloud             │
│                                                        │
│  ┌────────────────────────┐  ┌───────────────────────┐ │
│  │    Taw REST API        │  │     Telegram Bot      │ │
│  │ (Dockerfile.api)       │  │ (Dockerfile.bot)      │ │
│  └───────────┬────────────┘  └───────────┬───────────┘ │
│              │                           │             │
│              ▼                           ▼             │
│   ┌─────────────────────┐     ┌─────────────────────┐  │
│   │  PostgreSQL (Prisma)│     │ Redis 7 (BullMQ)    │  │
│   └─────────────────────┘     └─────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## Part 1: Deploy Backend, Database, Redis & Bot on Railway

Railway is the fastest and most seamless platform for deploying monorepos with PostgreSQL, Redis, and background workers.

### Step 1: Create a Project & Add Databases
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Provision PostgreSQL**.
3. In the same project canvas, click **+ Create** → **Database** → **Add Redis**.

### Step 2: Deploy the API Service
1. In the same Railway project canvas, click **+ Create** → **GitHub Repo** → Select `Eyob-bit/taw`.
2. Click the newly created service card and go to **Settings**:
   - Rename service to: `taw-api`.
   - Under **Build**:
     - **Build Type**: `Dockerfile`
     - **Dockerfile Path**: `Dockerfile.api`
   - Under **Networking**:
     - Click **Generate Domain** (e.g. `taw-api.up.railway.app`).
     - Set Target Port to `4000`.
3. Go to **Variables** on `taw-api` and add:
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` *(Railway variable reference)*
   - `REDIS_URL`: `${{Redis.REDIS_URL}}` *(Railway variable reference)*
   - `JWT_SECRET`: *(Generate a secure 32+ character string)*
   - `JWT_EXPIRES_IN`: `7d`
   - `BOT_API_KEY`: *(Generate a secret string, e.g. `taw_bot_secret_xyz123`)*
   - `CORS_ORIGIN`: `*` *(or your Vercel URL once deployed)*
   - `TELEGRAM_BOT_TOKEN`: `your_bot_token_from_botfather`
   - `TELEGRAM_CHANNEL_ID`: `@your_public_channel` *(or numerical ID e.g. `-100xxxxxxx`)*
   - `TELEGRAM_DISCUSSION_GROUP_ID`: `-100xxxxxxx`
   - `INITIAL_ADMIN_EMAIL`: `admin@ethiopia-awareness.org`
   - `INITIAL_ADMIN_PASSWORD`: `AdminPassword123!`
   - `INITIAL_ADMIN_NAME`: `Platform Super Admin`

> **Note**: On first startup, `Dockerfile.api` automatically runs `prisma migrate deploy` and `prisma/seed.js` to create all tables, categories, and your initial Super Admin.

### Step 3: Deploy the Telegram Bot Worker
1. In the Railway project canvas, click **+ Create** → **GitHub Repo** → Select `Eyob-bit/taw`.
2. Click the service card and go to **Settings**:
   - Rename service to: `taw-bot`.
   - Under **Build**:
     - **Build Type**: `Dockerfile`
     - **Dockerfile Path**: `Dockerfile.bot`
3. Go to **Variables** on `taw-bot` and add:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `API_BASE_URL`: `https://${{taw-api.RAILWAY_PUBLIC_DOMAIN}}/api` *(or your API public domain)*
   - `BOT_API_KEY`: `${{taw-api.BOT_API_KEY}}`
   - `TELEGRAM_BOT_TOKEN`: `your_bot_token_from_botfather`
   - `TELEGRAM_CHANNEL_ID`: `@your_public_channel`
   - `TELEGRAM_DISCUSSION_GROUP_ID`: `-100xxxxxxx`

---

## Part 2: Deploy the Admin Dashboard on Vercel

### Step 1: Import Project into Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
2. Select your repository: `Eyob-bit/taw`.

### Step 2: Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: Leave as `./` (or select `apps/admin`). The repository includes both root `vercel.json` and `apps/admin/vercel.json` configured for SPA routing.
- **Build Command**: `npm --workspace=@taw/admin run build`
- **Output Directory**: `apps/admin/dist`

### Step 3: Add Environment Variables
In the **Environment Variables** section on Vercel, add:
- `VITE_API_BASE_URL`: `https://<YOUR-RAILWAY-API-DOMAIN>/api` (e.g. `https://taw-api.up.railway.app/api`)
- `VITE_TELEGRAM_CHANNEL_URL`: `https://t.me/<your_channel>`

### Step 4: Click Deploy
Vercel will build the frontend and assign a live production URL (e.g. `https://taw-admin.vercel.app`).

---

## Part 3: Alternative Backend Deployment via Render (Blueprint)

If you prefer Render instead of Railway:
1. Log in to [render.com](https://render.com).
2. Go to **Blueprints** → **New Blueprint Instance**.
3. Connect your repository `Eyob-bit/taw`.
4. Render will automatically detect `render.yaml` and provision:
   - PostgreSQL (`taw-postgres`)
   - Redis (`taw-redis`)
   - Web Service (`taw-api`)
   - Worker (`taw-bot`)
5. Fill in the non-synced Telegram credentials (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`, `TELEGRAM_DISCUSSION_GROUP_ID`).
6. Click **Apply**.

---

## Part 4: Post-Deployment Verification Checklist

1. **Verify Backend Health**:
   Visit `https://<your-api-domain>/health` in your browser. It should return:
   ```json
   { "status": "healthy", "service": "Ethiopian Relationship Awareness API" }
   ```
2. **Log into Admin Dashboard**:
   - Open your Vercel URL: `https://<your-vercel-app>.vercel.app/login`
   - Login with `admin@ethiopia-awareness.org` and your configured `INITIAL_ADMIN_PASSWORD`.
   - Confirm you can see the Overview Dashboard, Categories, and Moderation queue.
3. **Test Telegram Bot**:
   - Open Telegram and search for your bot.
   - Send `/start`. Select Amharic or English.
   - Select a category, accept guidelines, and submit a test text.
   - Verify it appears in the Admin Dashboard Moderation or Publications queue.
