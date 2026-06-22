# Cloud Readiness Challenge

A playful, multi-department team challenge that makes the move from **SAP ECC → S/4HANA Cloud** feel approachable. Every department plays a few light actions (quiz / swipe / scripted chatbot), earns **readiness points**, and the **company Readiness Score is the arithmetic mean of all departments' readiness** — so you're only "ready" when everyone joins in.

This is the prototype skeleton: the engine, scoring, realtime, and screen flow are in place. The actual quiz/chatbot content is data-driven (JSON) and gets imported into the same modular system.

---

## Stack

| Layer | Choice |
|---|---|
| App + API | Next.js 14 (App Router) + TypeScript |
| Realtime | Socket.IO, hosted by a custom server (`server.ts`) alongside Next |
| Data | PostgreSQL + Prisma |
| UI | Tailwind CSS + Framer Motion (custom playful brand) |
| Content | Validated JSON in `/content` |
| Deploy | Docker Compose (web + Postgres + Caddy) on a VPS |

## How it fits together

```
content/*.json ──► validated by src/lib/content.ts ──► action engine + scoring
                                                          │
players' phones ── Socket.IO ──► server.ts ──► Postgres (sessions, players, completions)
CEO dashboard  ─────────────────┘   live "score:update" broadcasts
```

- **Scoring** (`src/lib/scoring.ts`): `companyReadiness = mean(departmentReadiness)`, where `departmentReadiness = average of each member's readiness` (a member's readiness = their points ÷ the department's max). So full readiness needs every member to finish everything. Scores are always derived from `action_completions`, never stored counters.
- **Avatars**: every player gets a random DiceBear avatar on join (no onboarding step); tap your avatar to edit it. Stored as JSON on the player, rendered offline in 3D "clay" medallions.
- **Leaderboard**: the live snapshot includes every employee ranked by points company-wide (shown on the dashboard).
- **Action engine** (`src/components/actions/`): a registry maps `type → component`. Add content = edit JSON; add a new *kind* of action = one component + one registry line.
- **Roles**: SAP sets up a challenge per company at **`/admin`** (gated by `ADMIN_KEY`) and hands out the join code. Employees only ever use the join flow.
- **Login**: no credentials. Enter a session code → pick a department → pick your name (or add a new one).

## Project layout

```
content/            roles.json, actions.json   ← all game content lives here
prisma/             schema.prisma, seed.ts
server.ts           custom server: Next + Socket.IO
src/
  app/              pages (/, /play, /dashboard) + API routes
  components/       ui kit, Dashboard, actions/ (Quiz, Swipe, Chatbot, registry)
  lib/              content, scoring, prisma, socket + client hooks
  server/           socket handlers
```

---

## Run locally

Requires Node 20+ and a Postgres (the quickest is the docker-compose one).

```bash
# 1. install
npm install

# 2. start just the database
docker compose up -d db

# 3. configure env
cp .env.example .env        # default DATABASE_URL points at the docker db

# 4. create the schema (+ optional demo session with code "DEMO")
npm run prisma:migrate
npm run db:seed

# 5. dev server (Next + Socket.IO on http://localhost:3000)
npm run dev
```

Then:
- **SAP setup** — open `/admin` to create a company challenge and get its join code (or use the seeded `DEMO` code).
- **Employees** — open `/` and join with the code, or watch the live `/dashboard`.

Open two browser windows: join with code `DEMO` on one (play), open `/dashboard` on the other (watch the score move live).

## Deploy to the VPS

```bash
cp .env.example .env        # set DOMAIN=your.domain.tld and a strong POSTGRES_PASSWORD
docker compose up -d --build
```

Caddy terminates TLS automatically for `DOMAIN` and proxies to the app (WebSockets included). Migrations run on container start.

## Adding content later

Drop new questions/dialogues into `content/actions.json` (and roles into `content/roles.json`). They're validated on load — a malformed import fails loudly at startup rather than mid-game. See `src/lib/content-schema.ts` for the exact shapes of `quiz`, `swipe`, and `chatbot` payloads.
