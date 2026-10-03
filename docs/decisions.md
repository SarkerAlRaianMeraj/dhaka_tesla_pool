# Decisions — Dhaka Tesla Pool

**Status:** Phase 1 complete. Each decision records what was chosen, the realistic alternative, why the choice fits a ride-pooling MVP, and what would make us change it. Product-level versions of these rules live in `PRD_Dhaka_Tesla_Pool.md` §6.

The course standards (`backend/rules.md`, `frontend/rules.md`) are the source of truth for day-to-day structure and style. D16–D21 record every place this codebase deliberately departs from them; the README points here rather than restating them, so the list cannot drift.

| # | Decision | Status |
|---|---|---|
| D1 | Geography is a predefined Dhaka zone list, not a routing API | settled (PRD §6.1) |
| D2 | Matching = same pickup zone + intersecting destination corridors | settled (PRD §6.1) |
| D3 | Fare = base + distance − 20% distance-charge discount, integer poysha | settled (PRD §6.2) |
| D4 | Fares recomputed once at `STARTED`, when occupancy is final | settled (PRD §6.2) |
| D5 | Seat claim is a locked transaction with a database-level capacity check | settled (PRD §6.3) |
| D6 | Polling for live status instead of WebSockets | settled (PRD §9.3 A3) |
| D7 | Passengers may join a matchable pool without per-join driver approval | settled (PRD §9.3 A2) |
| D8 | Stack: NestJS 11 + Next.js 16 + PostgreSQL + TypeORM | settled (Phase 1) |
| D9 | `zones` table added beyond the SRS entity list | settled, applied in Phase 1 |
| D10 | `pools.seat_capacity` denormalised to make the capacity check a real constraint | to expand in Phase 4 |
| D11 | TeslaPay balance stored on `users` rather than a separate wallets table | to expand in Phase 6 |
| D12 | One active pool per Tesla, enforced by a partial unique index | settled, applied in Phase 4 |
| D13 | Fixed lock order and a transaction-manager rule for seat claims | settled, applied in Phase 4 |
| D14 | bcrypt via `bcryptjs` instead of the native binding | settled, applied in Phase 1 |
| D15 | JWT delivered as an httpOnly cookie, Bearer header kept as a fallback | settled, applied in Phase 1 |
| D16 | UUID primary keys instead of incrementing integers | settled, applied in Phase 1 |
| D17 | Migrations instead of `synchronize: true` | settled, applied in Phase 0 |
| D18 | No `express-session`; the JWT cookie is the session | settled, applied in Phase 1 |
| D19 | Tailwind 4 CSS-first configuration, no `tailwind.config.ts` | settled, applied in Phase 1 |
| D20 | The web app runs on port 3001, not the standard 3000 | settled, applied in Phase 1 |
| D21 | Identity is owned by the auth module, so `src/user/` holds only the entity | settled, applied in Phase 1 |
| D22 | Ride zones are UUID foreign keys, not code strings | settled, applied in Phase 2 |
| D23 | The sharing discount floors to whole poysha | settled, applied in Phase 2 |

## Why the obvious alternatives were rejected

### D5 — Seat capacity
- **Redis seat counter:** faster, but capacity would live outside the transactional database, and a cache eviction during the race would silently overbook. Rejected: the guarantee must survive the cache being wrong (NFR-2).
- **Optimistic retry loop:** correct only if the retry loop is bounded and re-reads under a constraint; more code paths for the same guarantee. Rejected in favour of one pessimistic lock — one code path is easier to explain and to test.
- **Serialisable transaction:** also correct, but aborts under contention rather than waiting. Rejected for now; revisit if p99 latency becomes a problem.

### D6 — Live status
- **WebSockets:** the "right" answer for a production ride-hailing product, and the first thing to reach for in an interview. Rejected for the MVP because it adds a second transport, a reconnect strategy, and an infrastructure decision — none of which the brief asks for (NFR-7). Revisit when wait times make polling visibly janky.

### D8 — Framework versions
- NestJS, Express, Fastify, and plain Node were all candidates. NestJS wins on guard/pipe/module conventions that make authorization reviewable and consistent, which is what the "backend design" criterion actually rewards. Versions are pinned to a stable major rather than the newest release; a stable, documented API beats a fresh major for a submission that must run reproducibly on an evaluator's machine.

### D9 — A `zones` reference table, beyond the SRS entity list
The SRS entity list has no geography, but FR-M1 requires matching by pickup zone and destination corridor, and the fare rule is defined over zone distance. Both are impossible without somewhere to put the eight Dhaka zones.

- **Chosen:** `zones` with a coordinate grid (`x_km`, `y_km`), a `corridors` table, and a `zone_corridors` join table. Manhattan distance on the grid is the fare input; corridor intersection is half the matching rule.
- **Alternative considered:** deriving geography from coordinates embedded in each ride request. Rejected — the zones would drift out of agreement between requests, "Banani" would stop being the same place, and the fare would stop being verifiable by hand (FR-F1).
- **Cost:** zone data is now schema the application depends on, so it is seeded by migration rather than left empty. Real road routing stays out of scope either way (assumption A5).

### D12 — One active pool per Tesla
Seat assignment locks a pool row and checks capacity against it. That guarantee is only as good as the assumption that a Tesla has exactly one active pool. If the pool row were created lazily on first acceptance, two concurrent accepts could each create a pool, leaving Bullet with 2 + 1 seats instead of 3 — capacity respected, but the product broken: two pools for one vehicle, and the demo story of a single shared Tesla impossible to reproduce.

- **Fix:** a partial unique index, `UNIQUE (tesla_id) WHERE status IN ('FORMING','ACTIVE')`. The database then guarantees the invariant; a losing insert fails and the claim retries against the existing pool.
- **Alternative considered:** creating the pool at acceptance of the first request inside the same locked transaction. Still racy, because two transactions can both observe "no active pool" before either inserts.
- **Cost:** a completed pool must leave the index range before a new one can open, so pool status transitions have to be written carefully. This is acceptable: the trip is over before a new pool starts.

### D13 — Fixed lock order, and every claim read inside the transaction
A row lock protects only the rows it is taken on, inside the transaction that took it. Two ways to quietly break D5: reading the pool through the default entity manager instead of the transaction manager (the read is served outside the transaction, so it can be stale), and taking locks in a different order in two code paths (classic deadlock, which the database resolves by aborting one transaction — turning a capacity guarantee into a user-visible error).

- **Fix, both parts:** seat claims go through a single function; every read and write in it uses the transaction manager; and locks are always acquired **pool row first, then ride request** — one global order, so no cycle can form.
- **Alternative considered:** `SERIALIZABLE` isolation for the claim transaction, letting the database abort conflicts instead of waiting. Correct, but it converts contention into failed requests that must be retried. Revisit if p99 latency under load becomes a problem.

### D14 — Password hashing: bcrypt, in the pure-JavaScript build
`backend/rules.md` specifies bcrypt. `bcryptjs` implements the same algorithm in JavaScript rather than as a native addon, because the submission has to build and run on a machine with nothing but Node installed — a native `bcrypt` needs a compiler toolchain and a rebuild after every Node upgrade. The hashes are identical in format and strength; only the implementation differs.

- **Cost:** `bcryptjs` is roughly 30-40% slower than the native binding at 10 rounds. That is irrelevant at MVP traffic and irrelevant to correctness.
- **Note:** bcrypt reads at most 72 bytes of a password, so the DTO caps the length at 72 characters. Silently ignoring the rest would make two different long passwords interchangeable.

### D15 — The JWT is an httpOnly cookie, with `Authorization: Bearer` kept as a fallback
An earlier draft kept the token in `localStorage` and accepted the XSS exposure. `frontend/rules.md` requires an httpOnly cookie that client JavaScript never reads, and it is also the better design: a token that script cannot read cannot be exfiltrated by a script injection bug. The login response therefore carries no token at all — only the user and the lifetime — and the browser holds it in `access_token` (`httpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/`).

- **CSRF:** `SameSite=Lax` already blocks the browser from attaching this cookie to a cross-site `POST`, and the API only accepts JSON bodies with an explicit content type, so no separate CSRF token is needed for this MVP. Documented rather than assumed.
- **CORS:** the browser will only store and send the cookie if the response carries `Access-Control-Allow-Credentials`, so the client sets `withCredentials: true` and the API keeps an explicit origin list. `origin: true` was rejected because it reflects any origin *and* pairs it with credentials.
- **Scripts keep working:** the guard accepts `Authorization: Bearer <token>` when no cookie is present, so `curl`, Postman, and the demonstration scripts work without a cookie jar. When both are present the cookie wins.
- **Cost:** SSR cannot call authenticated endpoints, because the browser's cookie is not available to the Next.js server. Authenticated pages are therefore client-rendered, which also matches the rendering-strategy table in `frontend/rules.md` (dashboards are CSR).

## Departures from the course standards

Each of these contradicts a specific line in `backend/rules.md` or `frontend/rules.md`. They are decisions, not accidents: the standard is followed everywhere it does not conflict with a requirement of this brief.

### D16 — UUID primary keys instead of incrementing integers
`backend/rules.md:131` shows a bare `@PrimaryGeneratedColumn()`, which in PostgreSQL means an auto-incrementing integer. Every entity here uses `@PrimaryGeneratedColumn('uuid')`.

- **Why:** a pooled ride exposes its identifiers to two strangers and appears in URLs, logs, and audit records. Sequential integers let anyone who registers after Nusrat infer how many accounts exist, and let someone enumerate a ride by counting up. UUIDs remove that inference for free.
- **Cost:** 16 bytes instead of 4, no clustered insert locality, and indices grow faster. Irrelevant at MVP volume; it becomes a real consideration only past the scale the reasoning in Phase 10 addresses.
- **Alternative considered:** integer keys with an opaque public id per ride. Rejected — two identifiers for one row is more state to keep consistent than one identifier that is safe to expose.

### D17 — Migrations instead of `synchronize: true`
`backend/rules.md:436` sets `synchronize: true` in the TypeORM connection options. This project runs versioned migrations from `backend/src/database/migrations/` and never enables it.

- **Why:** `synchronize` derives the schema from the entity classes at boot. That means a half-finished refactor silently changes production data, there is no record of what the schema was at any past commit, and rolling back is impossible. The brief (§6, §12) requires a reproducible install from migrations, and asks for a seed that reviewers can run — neither is reproducible if the database rebuilds itself from whatever the current entities happen to say.
- **Cost:** every schema change needs a migration written by hand, and an entity change that forgets its migration is a runtime error rather than a silent fix.
- **Alternative considered:** `synchronize` in development and migrations in production. Rejected — the two would drift, and the environment where a bug appears would never be the environment where it was found.

### D18 — No `express-session`; the JWT cookie is the session
`backend/rules.md:332` sets up `express-session` with a cookie. This project stores nothing in a server-side session store; the signed JWT *is* the session, delivered in the httpOnly cookie described in D15.

- **Why:** a server-side session needs somewhere to keep sessions. That is either a shared store — which breaks the moment the API is run as more than one instance — or an in-process `MemoryStore`, which silently drops every session on restart and is explicitly not for production. The brief's NFR-5 asks for a stack reproducible with `docker compose up` on a machine that only has Docker, and adding a session store is exactly the kind of "advanced technology" the brief rules out (NFR-7).
- **Cost:** the token cannot be revoked before it expires. Logout clears the cookie client-side and server-side, but a stolen token stays valid until its lifetime ends. The mitigation is a short expiry plus D15's rule that the client cannot read the token to begin with.
- **Alternative considered:** `express-session` plus a database-backed store. Correct for a conventional app, and the wrong shape for an MVP whose entire state model already lives in PostgreSQL.

### D19 — Tailwind 4 CSS-first configuration, no `tailwind.config.ts`
`frontend/rules.md:47` lists `tailwind.config.ts` with `plugins: [require("daisyui")]` (lines 284–290). This project has no Tailwind config file at all: `frontend/app/globals.css` contains `@import "tailwindcss"` and `@plugin "daisyui"`.

- **Why:** Tailwind 4 moved configuration into CSS. A `tailwind.config.ts` would need the `@config` directive to be loaded at all, so keeping one would mean writing the file in a compatibility mode that the installed major version no longer recommends. The dependency is already declared in `package.json` either way.
- **Cost:** a reader expecting the familiar config file has to look in `globals.css` instead. The theme choice is now a `@plugin "daisyui" { themes: … }` block rather than a `daisyui.themes` array.

### D20 — The web app runs on port 3001, not the standard 3000
`frontend/rules.md:21-22` runs the web app on `localhost:3000` and suggests changing the port in `package.json`. This project runs the API on 3000 (it is a `/api/v1` service the standard assumes already exists) and the web app on 3001, set in `frontend/package.json` and mapped by `WEB_PORT` in `docker-compose.yml`.

- **Why:** two processes cannot both bind 3000 on a development machine. Moving the API instead would break the standard's own assumption that the NestJS backend is the thing already on 3000.
- **Cost:** the URLs in the README and in the demo video differ from the standard's. The variable is declared in one place per app, so changing it back is a one-line edit.

### D21 — Identity is owned by the auth module, so `src/user/` holds only the entity
`backend/rules.md:32` shows each module folder holding a module, controller, service, entity, and `dto/` files. `backend/src/user/` contains only `user.entity.ts`, because registration, login, and profile are all auth endpoints (US-P1) and live in `backend/src/auth/`.

- **Why:** creating a `UserController` and `UserService` with no endpoints of their own would be scaffolding written to satisfy a folder shape rather than to serve a requirement. `auth.service.ts` is where a user is actually created and read.
- **Cost:** a reader looking for user endpoints under `src/user/` will not find them; the answer is one hop away in `src/auth/`, which `auth.module.ts` imports by entity path.
- **Alternative considered:** a real `user` module owning `GET /users/me`. Rejected for now — it would split identity across two modules for one endpoint, and Phase 6 (TeslaPay balance, rating history) is the point at which a user module earns its existence.

### D22 — Ride zones are UUID foreign keys, not code strings
The SRS conceptual model shows `RIDE_REQUEST.pickupZone` and `destinationZone` as strings. The schema stores two `uuid` columns with foreign keys to `zones`.

- **Why:** FR-DB1 requires proper relationships, constraints, and indexes throughout, and a string column cannot enforce that a zone exists. The SRS itself notes the physical schema is an implementation deliverable rather than something it fixes. Foreign keys also make "Banani" a single row that cannot drift in spelling between two requests.
- **Cost:** every read of a ride needs the zone relation loaded, or a join. The alternative — a denormalised copy of the zone name for display — would reintroduce the drift this avoids.
- **Note:** the API still *accepts* zone codes, because that is what a client has; the service resolves a code to a row and the request stores the row's id.

### D23 — The sharing discount floors to whole poysha
The 20% discount is `distanceCharge / 5`. When the distance charge is not divisible by 5, the PRD does not say which way to round, and the two obvious answers genuinely disagree: for a charge of 3 poysha, `Math.floor` gives 0 and `Math.round` gives 1.

- **Chosen:** `Math.floor`. The discount is something taken *off* a passenger's fare, so rounding it down never overcharges, and the result stays exactly reproducible by hand — which is the property FR-F1 and NFR-6 actually ask for.
- **Alternative considered:** `Math.round`, which is marginally more generous on average. Rejected because "we round in the passenger's favour here" is a sentence nobody should have to defend in a viva.
- **Scope of the edge case:** for the published one-decimal zone grid every charge is a multiple of 100 and therefore divisible by 5, so this never actually triggers today. It is specified now so that changing a zone's coordinates later cannot silently change the rounding behaviour.

### D24 — Production refuses the published JWT secret instead of trusting the operator
`backend/src/config/env.validation.ts` gives `JWT_SECRET` a built-in default so a fresh clone boots with no configuration. That default is a literal in this repository, so a deployment started with the variable unset would sign and verify every session with a key any reader already has, and could mint a valid `access_token` cookie for an arbitrary user id. The default is also long enough to satisfy a minimum-length rule, which is why length alone would never have caught it.

- **Chosen:** the default remains available to development and test, and is refused **by identity** when `NODE_ENV=production`, together with the `.env.example` placeholder and any secret shorter than 32 characters. `main.ts` logs a warning whenever the built-in secret is in use.
- **Why keep a default at all:** removing it would make the API refuse to boot on a fresh clone, converting a security control into an onboarding tax. The exposure is specific to production, so the rule is specific to production.
- **Why identity and not just length:** both published values are longer than 32 characters, so a minimum-length check waves them straight through. Only comparing against the known values distinguishes a placeholder from a real secret.
- **Cost:** the two published strings must be kept in step between `env.validation.ts` and `.env.example`. A renamed default silently stops being refused.
- **Note on Compose:** `docker-compose.yml` already uses `${JWT_SECRET:?...}`, but that form refuses only an *absent* value, so it happily accepts a copied-but-unedited `.env.example`. The application-level check is the one that actually holds. Compose also defaults `NODE_ENV` to `development`, so a container only exercises this rule once the operator sets `NODE_ENV=production` — deliberate, because the production cookie sets `Secure` and would not be stored over the plain-HTTP local setup.

## Trade-offs we are knowingly accepting

1. **Denormalised pool capacity (D10):** occupancy can drift from the Tesla's current capacity if a capacity were ever editable. It is fixed at registration, so the drift cannot occur today; a trigger would remove the assumption if that ever changes.
2. **Single-instance deployment:** correctness of seat assignment depends on one database, not on one API instance — the API can be replicated horizontally today. Only migrations are single-flight, enforced by the compose topology.
3. **Polling:** trades latency for simplicity. Documented as assumption A3.
4. **Money in integer poysha:** no fractional poysha exist, so rounding rules are explicit and testable, at the cost of not supporting sub-unit pricing.