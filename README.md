# Ethiopian Relationship Awareness & Community Platform

A production-oriented, privacy-preserving Telegram-based relationship awareness and safety community platform designed for Ethiopia. Inspired by relationship-awareness communities, it allows users to anonymously submit relationship-related questions and personal experiences through a Telegram bot, while protecting personal privacy, preventing defamation, routing sensitive safety concerns to human moderators, and offering a modern React admin dashboard.

---

## 1. Core Architecture & Workflow

```
[ Telegram User ]
        │  /start, language selection (Amharic / English), guidelines acceptance
        ▼
[ Telegraf Bot ]
        │  Submission text & attachments collected
        ▼
[ Content Processing Pipeline ]
        ├── PII Detection (Ethiopian & international phones, @handles, links)
        ├── Defamation & Allegation Screening (Amharic & English keywords)
        ├── Content Sanitization (Automatic PII redaction)
        └── Eligibility Classification
                 │
                 ├── Category 1: "Are We Dating the Same Guy?" (#are_we_dating_the_same_guy)
                 │     └── Safe questions ──► Auto-publish Pipeline ──► Telegram Channel
                 │
                 └── Category 2: "Relationship Safety Concern" (#relationship_safety)
                       └── Always routed to ──► Moderator Queue ──► React Admin Review
```

### Key Safety & Privacy Guarantees
- **No Face Photos Publicly**: Identifiable third-party photos are strictly kept private for backend evidence and never published.
- **Strict Anonymity with Abuse Prevention**: Submitter Telegram IDs and usernames are never displayed in channel posts. Telegram IDs are stored as `BigInt` securely in the database solely for rate limiting, moderation, and abuse restriction.
- **Dual Content Storage**: `originalContent` (private) is stored separately from `publicContent` (sanitized). Public endpoints and bot APIs never expose `originalContent`.
- **Hashtags & Disclaimers**: Posts automatically include bilingual disclaimers stating that questions do not imply wrongdoing and that safety accounts represent personal claims rather than verified legal findings.

---

## 2. Monorepo Structure

```
relationship-awareness-platform/
├── apps/
│   ├── api/                     # Node.js + Express REST API
│   │   ├── prisma/              # Prisma schema & seed script
│   │   ├── src/
│   │   │   ├── config/          # Environment configuration
│   │   │   ├── controllers/     # Bot, Admin, Submissions, Publications, Reports, Users
│   │   │   ├── jobs/            # BullMQ publishing queue & pipeline
│   │   │   ├── middleware/      # JWT auth, Bot secret auth, Helmet, Rate limiting, Error handler
│   │   │   ├── routes/          # Express route definitions
│   │   │   ├── services/        # Business logic, Prisma client, Telegram publisher
│   │   │   ├── utils/           # BigInt serialization polyfill
│   │   │   ├── validators/      # Zod validation schemas
│   │   │   ├── app.js           # Express app setup
│   │   │   └── server.js        # Server entry point
│   │   └── test/                # Vitest & Supertest automated API tests
│   │
│   ├── bot/                     # Bilingual Telegraf.js Telegram Bot
│   │   ├── src/
│   │   │   ├── handlers/        # /start, /language, /my_submissions, /report, submissions
│   │   │   ├── keyboards/       # Bilingual inline keyboard builders
│   │   │   ├── services/        # API client for backend communication
│   │   │   ├── sessions/        # Persistent PostgreSQL BotSession store
│   │   │   └── index.js         # Telegraf bot runner
│   │   └── test/                # Telegraf bot handler & session tests
│   │
│   └── admin/                   # React + Vite Admin Dashboard
│       ├── src/
│       │   ├── context/         # AuthContext (JWT) & ThemeContext (Light/Dark mode)
│       │   ├── layouts/         # DashboardLayout with responsive sidebar
│       │   ├── pages/           # Overview, Submissions, Moderation, Publications, Reports, Users, Admins, Analytics, Settings
│       │   ├── services/        # Axios API client
│       │   └── App.jsx          # React Router & TanStack Query configuration
│       └── vite.config.js       # Vite configuration with API proxy
│
├── packages/
│   └── shared/                  # Shared Domain Logic & Validators
│       ├── src/
│       │   ├── constants.js     # Enums, Statuses, Hashtags, Limits
│       │   ├── i18n.js          # Complete Amharic & English dictionaries
│       │   ├── sanitizer.js     # PII detection & text sanitization
│       │   └── validators.js    # Validation & publication post formatters
│       └── test/                # Shared package unit tests
│
├── docker-compose.yml           # PostgreSQL & Redis container definitions
├── .env.example                 # Comprehensive environment template
└── package.json                 # Monorepo root with npm workspaces
```

---

## 3. Technology Stack

- **Backend**: Node.js 22, Express 4, Prisma ORM 6, PostgreSQL 18 (UTF-8), Zod, JWT, bcryptjs, Helmet, express-rate-limit.
- **Telegram**: Telegraf.js 4, Telegram Bot API.
- **Background Jobs**: BullMQ 5, Redis 7 (with graceful fallback to asynchronous execution in development).
- **Frontend Dashboard**: React 18, Vite 6, Tailwind CSS 3, React Router 6, TanStack Query 5, Lucide React icons, Recharts 2.
- **Testing**: Vitest 3, Supertest, Node test runner (30 automated tests passing).

---

## 4. Prerequisites

1. **Node.js**: v18.0.0 or later (v22 LTS recommended).
2. **PostgreSQL**: v15 or later with **UTF-8 database encoding** (required for Amharic script).
3. **Redis**: v7 or later (or Docker Compose).
4. **Telegram Bot Token**: Created via [@BotFather](https://t.me/BotFather).
5. **Telegram Channel**: The bot must be added as an Administrator with *Post Messages* permission.

---

## 5. Quick Start (Local Development)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env` in the root (and in `apps/api/.env` and `apps/bot/.env`):
```bash
cp .env.example .env
```
Update your credentials:
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/relationship_platform?schema=public`)
- `REDIS_URL`: Redis connection string (e.g. `redis://localhost:6379`)
- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot token from BotFather.
- `TELEGRAM_CHANNEL_ID`: Your target Telegram channel ID (e.g. `-1001234567890`).
- `BOT_API_KEY`: Internal secret key used to authenticate bot-to-API requests.
- `JWT_SECRET`: Random 32+ character string for signing admin session tokens.

### Step 3: Start Infrastructure (PostgreSQL & Redis)
Using Docker Compose:
```bash
docker compose up -d postgres redis
```

### Step 4: Run Prisma Migrations & Seed Initial Data
```bash
# Push schema to PostgreSQL
npm --workspace=@taw/api run prisma:generate
npx prisma db push --schema apps/api/prisma/schema.prisma

# Seed categories and Super Admin
npm run prisma:seed
```
*Initial Super Admin credentials created:*
- **Email**: `admin@ethiopia-awareness.org`
- **Password**: `AdminSecurePassword123!`

### Step 5: Start Applications

You can start all three applications simultaneously:
```bash
npm run dev:all
```

Or run them individually in separate terminals:
```bash
# 1. Express API (Port 4000)
npm run dev:api

# 2. Telegram Bot
npm run dev:bot

# 3. React Admin Dashboard (Port 3000)
npm run dev:admin
```

---

## 6. Running Tests

Run the full automated test suite across all packages and apps:
```bash
npm test
```

Or run test suites individually:
```bash
# Test shared library (sanitizer, PII detection, i18n, formatting)
node packages/shared/test/shared.test.js

# Test API security, submissions, RBAC, and moderation
npx vitest run apps/api/test/api.test.js

# Test background publishing pipeline & Telegram channel publisher
npx vitest run apps/api/test/publication.test.js

# Test Telegram bot commands, sessions, and keyboards
npx vitest run apps/bot/test/bot.test.js
```

---

## 7. Telegram Channel & Discussion Group Setup

1. Create a public or private Telegram Channel (e.g., `@EthiopiaRelationshipAwareness`).
2. Add your bot to the Channel as an **Administrator** with:
   - *Post Messages* enabled.
   - *Delete Messages* enabled (for post takedowns / removal upon report).
3. In channel settings, link a **Discussion Group** so community members can comment.
4. Set `TELEGRAM_CHANNEL_ID` and `TELEGRAM_DISCUSSION_GROUP_ID` in your `.env` file.
5. In development or without real channel credentials, the system automatically runs the **Mock Telegram Channel Publisher**, logging formatted posts to the console without sending actual Telegram requests.

---

## 8. Deployment Guide

### A. Backend API & Telegram Bot (Render / Railway)
- **Runtime**: Node.js
- **Build Command**: `npm install && npm run build`
- **Start Command (API)**: `node apps/api/src/server.js`
- **Start Command (Bot)**: `node apps/bot/src/index.js`
- **Environment Variables**: Add all variables from `.env.example`.
- Ensure PostgreSQL has `UTF-8` encoding.

### B. Admin Dashboard (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `apps/admin`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: `VITE_API_BASE_URL=https://your-api-domain.com/api`

---

## 9. Security & Compliance

- **Helmet**: Secures HTTP response headers against clickjacking, sniffing, and XSS.
- **Strict CORS**: Restricted to authorized dashboard domains.
- **Rate Limiting**: Bot API rate limited to 600 req/min; Admin login limited to 15 req/15 min.
- **Password Security**: Bcrypt with 12 salt rounds.
- **Cryptographic Audit Logs**: Every moderation approval, rejection, user block, or post deletion records an immutable entry in the `AuditLog` table with IP, timestamp, and admin ID.
- **BigInt Safety**: Telegram 64-bit integer IDs are serialized using native string polyfills to prevent JavaScript IEEE 754 precision loss.

