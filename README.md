# Project LOOP — AI Customer Feedback Intelligence Platform

## 🌐 Live Deployment & Demo Access

The application is deployed on Vercel with automated CI/CD and Neon PostgreSQL:

🔗 **Production URL:** [https://loop-ai-feedback-platform-six.vercel.app/](https://loop-ai-feedback-platform-six.vercel.app/)

### Demo Accounts (`password123`):
| Role | Email | Access Level |
|---|---|---|
| **Admin** | `admin@demo.com` | Full administrative & workspace management access |
| **Analyst** | `analyst@demo.com` | Ingestion, AI reclassification, and report generation |
| **Viewer** | `viewer@demo.com` | Read-only dashboards, trends, and Ask LOOP |


Project LOOP is an enterprise-grade customer feedback intelligence platform that aggregates, auto-classifies, and analyzes multi-channel user feedback in real time. It enables product and engineering teams to track sentiment trends, identify emerging theme spikes, query feedback via retrieval-grounded semantic Q&A (Ask LOOP), and generate automated Voice-of-Customer executive reports with strict multi-tenant isolation and role-based access control.

---

## Tech Stack

- **Framework:** Next.js 16.3.1 (App Router, Server-side Route Handlers)
- **UI & Frontend:** React 19.2.8, Tailwind CSS 4
- **Language:** TypeScript 5
- **Database:** PostgreSQL (Neon Serverless) with `pgvector` extension & HNSW indexing
- **ORM & Data Layer:** Prisma ORM 7 (`@prisma/adapter-pg` driver adapter)
- **Authentication & RBAC:** NextAuth.js v4 (JWT Session strategy, bcryptjs password hashing)
- **AI Classification & Narrative:** Anthropic Claude (`@anthropic-ai/sdk`, Claude 3.5 Haiku)
- **Semantic Vector Embeddings:** Google Gemini (`@google/genai`, `gemini-embedding-001` 768-D)
- **Data Validation:** Zod 4 (Strict schema validation across all API routes)
- **CSV Ingestion:** PapaParse

---

## Architecture & Request Flow

Project LOOP employs a hardened multi-tenant architecture where every feedback item, theme, report, and vector embedding is strictly scoped to the authenticated user's workspace. Authorization is enforced server-side before executing any database or AI operations.

```
Browser / Client
      │
      ▼
Next.js App Router Route Handlers (/api/*)
      │
      ▼
Server-side Authentication & RBAC Layer (requireAuth / requirePermission)
      │
      ├──────────────────────────────┬──────────────────────────────┐
      ▼                              ▼                              ▼
Prisma ORM & PostgreSQL         Google Gemini Embeddings     Anthropic Claude
(Data CRUD & pgvector HNSW)    (gemini-embedding-001)       (Classification / Q&A)
      │                              │                              │
      └──────────────────────────────┴──────────────────────────────┘
                                     │
                                     ▼
                     Strict Tenant-Isolated Response
```

---

## Local Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Jatins01/loop-ai-feedback-platform.git
cd loop-ai-feedback-platform
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and provide your credentials:
```bash
cp .env.example .env.local
```

### 3. Initialize Database & Generate Prisma Client
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Seed Demo Data
Populates the demo workspace with seed users, themes, and 120 demo feedback entries:
```bash
npx ts-node prisma/seed.ts
```

### 5. Run Development Server or Build
```bash
# Start local development server
npm run dev

# Or create production build
npm run build
npm start
```

---

## Environment Variables

| Variable | Description | Required |
| :--- | :--- | :---: |
| `DATABASE_URL` | PostgreSQL connection string (with `sslmode=require`) | Yes |
| `NEXTAUTH_SECRET` | NextAuth JWT encryption secret (min 32 characters) | Yes |
| `NEXTAUTH_URL` | Application root URL (`http://localhost:3000` in dev) | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude classification & narrative generation | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for 768-dimensional vector embeddings | Yes |

*Note: Real secrets must never be committed to Git. In production, configure these variables directly in your hosting provider's dashboard (e.g. Vercel Project Settings).*

---

## Demo Credentials (Seeded Demo Workspace)

All seeded users belong to the **Demo Company** workspace (`password123`):

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | Full permissions (Create/Import/Update/Delete Feedback, Manage Themes, Generate Reports, Manage Users/Workspace) |
| **Analyst** | `analyst@demo.com` | Create/Import/Update Feedback, Reclassify Feedback, Manage Themes, Generate & View Reports |
| **Viewer** | `viewer@demo.com` | Read-only permissions (View Feedback, View Themes, View Reports) — mutating routes return `403 Forbidden` |

---

## API Overview

### Core Feedback
- `POST /api/feedback` — Ingest single feedback entry with automatic Claude sentiment/theme classification & vector embedding.
- `GET /api/feedback` — List, filter (channel, sentiment, status, date range, search query `q`, theme), and paginate feedback.
- `PATCH /api/feedback/[id]` — Update feedback status (`NEW` $\to$ `REVIEWED` $\to$ `ACTIONED`).
- `POST /api/feedback/import` — Multipart CSV batch import with automated validation, classification, and embedding.
- `POST /api/feedback/[id]/reclassify` — Trigger on-demand AI reclassification and atomic theme reassignment.

### Themes & Trends
- `GET /api/themes` — List workspace themes with feedback count aggregation.
- `POST /api/themes` — Create custom workspace theme with duplicate detection.
- `GET /api/themes/trends` — Calculate period volume trends (`7d` \| `30d`) and spike detection (`> 50%` growth).
- `GET /api/themes/[id]/feedback` — Drill down into paginated feedback linked to a specific theme.

### Intelligence & Reports
- `GET /api/insights/dashboard` — Aggregated metrics (total volume, negative sentiment %, new this week, volume over time, top themes).
- `POST /api/insights/ask` — Ask LOOP semantic Q&A using Google Gemini embeddings, pgvector cosine similarity search, and Claude grounded context with prompt-injection defense.
- `POST /api/reports` — Generate Voice-of-Customer executive reports from pre-computed database statistics and real quotes.
- `GET /api/reports` — List paginated historical reports.
- `GET /api/reports/[id]` — Retrieve full report details and narrative.
