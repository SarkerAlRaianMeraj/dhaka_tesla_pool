# Dhaka Tesla Pool

**Share a seat. Split the fare. Survive Dhaka traffic.**

A ride-pooling MVP: passengers request multi-seat rides, a driver's Tesla can serve several passengers on compatible routes at once, and each passenger sees only their own fare and status.

> **Repository authorship.** The first 23 commits, up to and including the Phase 1 course-standards merge, were authored under a second GitHub account (`sania1234567890`) used during early development. Every commit from this point on is authored by `SarkerAlRaianMeraj`. History was deliberately not rewritten, because re-authoring would have invalidated every existing commit hash and the merge structure for no benefit to the code.

> **Project status — Phase 1 of 10 complete (identity and zones).** Sign up, sign in, and land on a role-aware home screen; the eight Dhaka zones are served by the API. Ride requests, pooling, and the driver's Tesla registration land in the following phases. See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the phase-by-phase delivery plan and its acceptance gates.
>
> *How Phase 1 was verified:* both apps build and lint clean; the session cookie flow is exercised end to end against a live API (login sets the cookie, `/auth/me` answers while it is held, logout revokes it, a bad `Authorization` header is refused); every route returns its expected status and the custom 404 renders inside the app shell; and the built client bundle is confirmed to call `/auth/login`, `/auth/me`, `/auth/logout`, and `/zones` with credentials. The interactive browser pass of the sign-up → sign-in → dashboard path is still to be recorded by hand.

## Repository layout

| Path | Contents |
|---|---|
| `backend/` | NestJS + TypeScript REST API (`/api/v1`), TypeORM, Jest unit and e2e tests, migrations |
| `frontend/` | Next.js App Router web app with role-aware screens, Tailwind CSS + daisyUI |
| `docs/` | Architecture, decisions, ERD, scaling reasoning |
| `docs/source/` | The original challenge brief and SRS, kept as the inputs of record |
| `PRD_Dhaka_Tesla_Pool.md` | Product requirements: personas, journeys, traced user stories, business rules |
| `PROJECT_PLAN.md` | Phased delivery plan with requirement coverage and merge gates |
| `AI_USAGE.md` | Disclosed AI usage, including accepted and rejected suggestions |

## Prerequisites

- Node.js 22+ (developed on 24)
- PostgreSQL 14+ (developed on 18)
- Docker, only if you want to run the whole stack with containers

## Run it locally (without Docker)

```bash
# 1. database
createdb dhaka_tesla_pool

# 2. API  (http://localhost:3000/api/v1)
cd backend
cp .env.example .env          # fill in your database password
npm install
npm run migration:run
npm run start:dev

# 3. web app, second terminal  (http://localhost:3001)
cd frontend
cp .env.example .env          # points the browser at the API above
npm install
npm run dev
```

The web app runs on **3001** because the API owns 3000; `frontend/package.json` and
`WEB_PORT` in `docker-compose.yml` are the only two places that port is written
down (D20).

## Run it with Docker

```bash
cp .env.example .env          # fill in POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build
```

The stack brings up PostgreSQL, runs migrations as a one-shot service, then starts the API and the web app. API: `http://localhost:3000/api/v1` · Web: `http://localhost:3001`.

## Common commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start API and web app together |
| `npm run build` | Production build of both apps |
| `npm run lint` | Lint both apps |
| `npm test` | Backend unit tests |
| `npm run test:e2e` | Backend end-to-end tests (needs a reachable test database) |
| `npm run migration:run` | Apply pending migrations |

## Documentation

- Product requirements — [`PRD_Dhaka_Tesla_Pool.md`](PRD_Dhaka_Tesla_Pool.md)
- Delivery plan — [`PROJECT_PLAN.md`](PROJECT_PLAN.md)
- Architecture — [`docs/architecture.md`](docs/architecture.md)
- Decisions and trade-offs — [`docs/decisions.md`](docs/decisions.md)
- AI usage disclosure — [`AI_USAGE.md`](AI_USAGE.md)

## Coding standards

Every file written in this repository follows the course standards, which are the
source of truth for structure, naming, and style:

- [`backend/rules.md`](backend/rules.md) — NestJS 3-tier layering, module and DTO layout, TypeORM entities, guards, JWT, bcrypt, exceptions.
- [`frontend/rules.md`](frontend/rules.md) — Next.js App Router with no `src/` directory, axios as the only HTTP client, Zod-only form validation, Tailwind CSS + daisyUI, httpOnly cookie authentication.

Where this codebase departs from those standards, the departure and its reason are
written down in [`docs/decisions.md`](docs/decisions.md) as D16–D21: UUID primary
keys (D16), migrations instead of `synchronize` (D17), no `express-session` (D18),
Tailwind 4's CSS-first config (D19), the web app on 3001 (D20), and identity owned
by the auth module (D21). Deviations are decisions, not accidents.

Demo credentials, screenshots, API overview, deployment link, and the demonstration video are added as the phases land; the README checklist in the brief §7.5 is satisfied before `release/v1.0.0` is cut.