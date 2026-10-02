# Decisions — Dhaka Tesla Pool

**Status:** Phase 0 skeleton. Each decision records what was chosen, the realistic alternative, why the choice fits a ride-pooling MVP, and what would make us change it. Product-level versions of these rules live in `PRD_Dhaka_Tesla_Pool.md` §6.

| # | Decision | Status |
|---|---|---|
| D1 | Geography is a predefined Dhaka zone list, not a routing API | settled (PRD §6.1) |
| D2 | Matching = same pickup zone + intersecting destination corridors | settled (PRD §6.1) |
| D3 | Fare = base + distance − 20% distance-charge discount, integer poysha | settled (PRD §6.2) |
| D4 | Fares recomputed once at `STARTED`, when occupancy is final | settled (PRD §6.2) |
| D5 | Seat claim is a locked transaction with a database-level capacity check | settled (PRD §6.3) |
| D6 | Polling for live status instead of WebSockets | settled (PRD §9.3 A3) |
| D7 | Passengers may join a matchable pool without per-join driver approval | settled (PRD §9.3 A2) |
| D8 | Stack: NestJS 11 + Next.js 16 + PostgreSQL + TypeORM | in progress (Phase 0/1) |
| D9 | `zones` table added beyond the SRS entity list | to expand in Phase 1 |
| D10 | `pools.seat_capacity` denormalised to make the capacity check a real constraint | to expand in Phase 4 |
| D11 | TeslaPay balance stored on `users` rather than a separate wallets table | to expand in Phase 6 |
| D12 | One active pool per Tesla, enforced by a partial unique index | settled, applied in Phase 4 |
| D13 | Fixed lock order and a transaction-manager rule for seat claims | settled, applied in Phase 4 |
| D14 | bcrypt via `bcryptjs` instead of the native binding | settled, applied in Phase 1 |
| D15 | JWT delivered as an httpOnly cookie, Bearer header kept as a fallback | settled, applied in Phase 1 |

## Why the obvious alternatives were rejected

### D5 — Seat capacity
- **Redis seat counter:** faster, but capacity would live outside the transactional database, and a cache eviction during the race would silently overbook. Rejected: the guarantee must survive the cache being wrong (NFR-2).
- **Optimistic retry loop:** correct only if the retry loop is bounded and re-reads under a constraint; more code paths for the same guarantee. Rejected in favour of one pessimistic lock — one code path is easier to explain and to test.
- **Serialisable transaction:** also correct, but aborts under contention rather than waiting. Rejected for now; revisit if p99 latency becomes a problem.

### D6 — Live status
- **WebSockets:** the "right" answer for a production ride-hailing product, and the first thing to reach for in an interview. Rejected for the MVP because it adds a second transport, a reconnect strategy, and an infrastructure decision — none of which the brief asks for (NFR-7). Revisit when wait times make polling visibly janky.

### D8 — Framework versions
- NestJS, Express, Fastify, and plain Node were all candidates. NestJS wins on guard/pipe/module conventions that make authorization reviewable and consistent, which is what the "backend design" criterion actually rewards. Versions are pinned to a stable major rather than the newest release; a stable, documented API beats a fresh major for a submission that must run reproducibly on an evaluator's machine.

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

## Trade-offs we are knowingly accepting

1. **Denormalised pool capacity (D10):** occupancy can drift from the Tesla's current capacity if a capacity were ever editable. It is fixed at registration, so the drift cannot occur today; a trigger would remove the assumption if that ever changes.
2. **Single-instance deployment:** correctness of seat assignment depends on one database, not on one API instance — the API can be replicated horizontally today. Only migrations are single-flight, enforced by the compose topology.
3. **Polling:** trades latency for simplicity. Documented as assumption A3.
4. **Money in integer poysha:** no fractional poysha exist, so rounding rules are explicit and testable, at the cost of not supporting sub-unit pricing.