# Dhaka Tesla Pool

**Share a seat. Split the fare. Survive Dhaka traffic.**

A ride-pooling MVP: passengers request multi-seat rides, a driver's Tesla can serve several passengers on compatible routes at once, and each passenger sees only their own fare and status.

> **Repository authorship.** The first 23 commits, up to and including the Phase 1 course-standards merge, were authored under a second GitHub account (`sania1234567890`) used during early development. Every commit from this point on is authored by `SarkerAlRaianMeraj`. History was deliberately not rewritten, because re-authoring would have invalidated every existing commit hash and the merge structure for no benefit to the code.

> **Project status — Phase 3 of 10 complete (Tesla and the matchable feed).** Sign up, sign in, and land on a role-aware home screen; the eight Dhaka zones are served by the API. A passenger can price a journey, request a ride, list their rides, open one, and cancel it. A driver can now register the Tesla they drive, toggle its availability, and watch the open requests that their Tesla could serve. Pooling itself — claiming a seat, splitting one request across several Teslas — lands in the following phases. See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the phase-by-phase delivery plan and its acceptance gates.
>
> *How Phase 2 was verified:* both apps build and lint clean; the three fares PRD §6.2 publishes are produced exactly from the seeded zone coordinates (35700, 33000, and 37950 poysha, with 34560 pooled); `POST /rides/quote` was confirmed against the database to write no rows, repeatedly; the schema's constraints were confirmed behaviourally rather than by reading `CREATE TABLE`, so an unknown status, a same-zone request, and 9 seats are all refused by PostgreSQL itself; another passenger's ride returns 404 rather than 403, and cancelling twice returns 409. The interactive browser pass — register → sign in → dashboard → price → request → list → detail → cancel → sign out — was run in headless Chrome and every screen, fare, and status was confirmed against the rendered DOM, including that the session cookie is not readable by scripts.
>
> *How Phase 3 was verified:* both apps build and lint clean. The matching rule in PRD §6.1 was transcribed into a pure predicate and exercised against the Mohakhali/Dhanmondi case the PRD names, plus its opposites; the seven cases pass as `backend/src/tesla/matching.spec.ts`, the one test file in Phases 1–8, kept because PRD §5.4 traces user story D3 to a matching unit (see `AI_USAGE.md`). The `teslas` table's constraints were confirmed behaviourally rather than by reading `CREATE TABLE`: eight simultaneous registrations from one driver yield exactly one row, a duplicate plate from a second driver is refused, capacity outside 1–3 and an unknown availability are both refused by PostgreSQL itself. Over the live API, registration trims and upper-cases the plate, defaults capacity to 3 and availability to `OFFLINE`, refuses a second Tesla with 409 in words rather than a constraint error, and lets the driver move availability both ways; every Tesla endpoint answers 403 to a passenger and 401 to an anonymous caller; and the feed lists only `REQUESTED` rides, exposes no passenger identity, and labels both zones on every row. The interactive browser pass — anonymous redirect to sign in → sign in → dashboard → open the Tesla card → register → toggle online → read the feed → full reload → passenger redirected away — was run in headless Chrome against the production build, and every screen was confirmed against the rendered DOM, including that the Tesla survives a reload as server state and that the two `401`s in the console are the expected anonymous session probe rather than faults.
>
> *Not yet verified:* Docker Compose, which cannot run on this machine and is deferred to Phase 8; and Phase 3's half of E2, the guard that only lets a Tesla whose zones overlap a request's corridors take it, which cannot be exercised until Phase 4 assigns rides to a Tesla (D26).
>
> *Security review after Phase 2:* Phases 0–2 were audited once Phase 2 had merged. Three findings were accepted and fixed — the API would start under `NODE_ENV=production` using this repository's placeholder `JWT_SECRET` (D24), the passenger-only role guard had been written but never applied to any endpoint, and two simultaneous cancellations could both succeed and leave duplicate rows in the status history (D25). Each was reproduced against the running system before and after the fix; the cancellation defect was confirmed by firing eight concurrent requests and then by reverting the fix and watching it fail. A global error envelope and rate limiting were considered and deliberately left to Phase 7, and an open-ride cap plus ride-list pagination were deferred because they need a product decision the PRD does not contain. See `AI_USAGE.md`.

### Phase 1, for the record

> *How Phase 1 was verified:* both apps build and lint clean; the session cookie flow is exercised end to end against a live API (login sets the cookie, `/auth/me` answers while it is held, logout revokes it, a bad `Authorization` header is refused); every route returns its expected status and the custom 404 renders inside the app shell; and the built client bundle is confirmed to call `/auth/login`, `/auth/me`, `/auth/logout`, and `/zones` with credentials. The interactive browser pass of the sign-up → sign-in → dashboard path was left to be recorded by hand, and was later completed as part of the Phase 2 browser run.

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

The API refuses to boot when `NODE_ENV=production` and `JWT_SECRET` is still the
`.env.example` placeholder or is shorter than 32 characters. Both of those values
are published in this repository, so neither can safely sign a real session
cookie (D24).

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
- Passenger dashboard design source — [`frontend/dhaka-tesla-pool-frontend-spec.md`](frontend/dhaka-tesla-pool-frontend-spec.md)

## The passenger dashboard

`/dashboard` for a passenger is a rebuild from the design specification above, and
every figure on it comes from the API:

| On screen | Comes from |
|---|---|
| The eight pickup and drop-off locations | `GET /zones` |
| The fare | `POST /rides/quote` — never calculated in the browser |
| The TeslaPay balance and the greeting | the session (`GET /auth/me`) |
| The progress track and last ride | `GET /rides` |
| Requesting a ride | `POST /rides`, then a redirect to `/rides/{id}` |

The route-intelligence map is the one illustrative part: this product has no
geospatial data, no driver locations and no telemetry, so the grid, radar sweep and
vehicles are CSS and SVG, and the panel says "illustrative, not live tracking" on
its face. Driver, ETA, fleet-count and charge figures read as unavailable because
`Ride` carries no driver until Phase 4 assigns one — see
[`docs/decisions.md`](docs/decisions.md) D29 and PRD §9.3 A6–A8.

Figtree and Outfit are committed as variable `.woff2` files under
`frontend/public/fonts/` and loaded with `next/font/local`, so a build never
depends on reaching Google Fonts.

Verified by a real browser against the running API: the rendered fare matches the
server's quote for the selected zones, both selectors are populated from
`GET /zones`, the navbar and footer are withheld on this route, the rail is 88px
above 700px and absent below it, there is no horizontal overflow at 1280, 900 or
390, and requesting a ride lands on the created ride's page.

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