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

## Why the obvious alternatives were rejected

### D5 — Seat capacity
- **Redis seat counter:** faster, but capacity would live outside the transactional database, and a cache eviction during the race would silently overbook. Rejected: the guarantee must survive the cache being wrong (NFR-2).
- **Optimistic retry loop:** correct only if the retry loop is bounded and re-reads under a constraint; more code paths for the same guarantee. Rejected in favour of one pessimistic lock — one code path is easier to explain and to test.
- **Serialisable transaction:** also correct, but aborts under contention rather than waiting. Rejected for now; revisit if p99 latency becomes a problem.

### D6 — Live status
- **WebSockets:** the "right" answer for a production ride-hailing product, and the first thing to reach for in an interview. Rejected for the MVP because it adds a second transport, a reconnect strategy, and an infrastructure decision — none of which the brief asks for (NFR-7). Revisit when wait times make polling visibly janky.

### D8 — Framework versions
- NestJS, Express, Fastify, and plain Node were all candidates. NestJS wins on guard/pipe/module conventions that make authorization reviewable and consistent, which is what the "backend design" criterion actually rewards. Versions are pinned to a stable major rather than the newest release; a stable, documented API beats a fresh major for a submission that must run reproducibly on an evaluator's machine.

## Trade-offs we are knowingly accepting

1. **Denormalised pool capacity (D10):** occupancy can drift from the Tesla's current capacity if a capacity were ever editable. It is fixed at registration, so the drift cannot occur today; a trigger would remove the assumption if that ever changes.
2. **Single-instance deployment:** correctness of seat assignment depends on one database, not on one API instance — the API can be replicated horizontally today. Only migrations are single-flight, enforced by the compose topology.
3. **Polling:** trades latency for simplicity. Documented as assumption A3.
4. **Money in integer poysha:** no fractional poysha exist, so rounding rules are explicit and testable, at the cost of not supporting sub-unit pricing.