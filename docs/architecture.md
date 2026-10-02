# Architecture — Dhaka Tesla Pool

**Status:** Phase 0 skeleton. This document grows as the system is built; the implementation must match what is documented here, and this file is updated when the architecture changes.

## 1. System view

```
Browser
  ├── Passenger app (Next.js App Router)
  └── Driver app (Next.js App Router)
        │  HTTPS · JSON · JWT Bearer (role claim: passenger | driver)
        ▼
NestJS REST API  /api/v1
  guards ── validation ── services ── TypeORM ── PostgreSQL
        ▼
PostgreSQL (the only source of truth for capacity)
```

Three tiers, one process each for the MVP. No message queue, no cache, no microservice split — see `docs/decisions.md` for why each omission is a deliberate call rather than a missing feature.

## 2. Module map (backend)

| Module | Responsibility | Phase |
|---|---|---|
| `config` | Environment validation, typed configuration | 0 |
| `common/middleware` | Request-id propagation for log correlation | 0 |
| `health` | Liveness/readiness probe, including a database ping | 0 |
| `database` | Shared DataSource options, migration runner, seeds | 0+ |
| `auth` | Register, login, JWT issuance, role claim | 1 |
| `users` / `zones` | Identity records and the Dhaka zone reference data | 1 |
| `rides` | Ride requests, fare estimate, status lifecycle | 2, 5 |
| `vehicles` | Tesla registration, capacity, driver availability | 3 |
| `pools` | Pool creation, seat assignment, capacity enforcement | 4 |
| `payments` / `ratings` | Cash and TeslaPay settlement, driver rating | 6 |

Pure business rules live in `src/domain` with no I/O — the fare model, the matching rule, and the ride state machine — so each can be unit-tested and explained in isolation.

## 3. Data model

The entity set follows SRS §4.3: User, Tesla/Vehicle, RideRequest, Pool, PoolMembership, StatusHistory, Payment, Rating, plus a `zones` reference table required by FR-M1. Migrations and the ERD are produced with the schema; the authoritative column-level diagram is generated from the entities and kept in step with them.

## 4. Capacity enforcement

Seat assignment is a single database transaction: the pool row is locked, occupancy is re-read under the lock, and the capacity check and occupancy write happen together. A database `CHECK` constraint refuses to store occupancy above capacity, so the guarantee survives any future code path that forgets the check. See `docs/decisions.md` for the full trade-off.

## 5. Diagrams

- Architecture: this document, §1
- ERD: `docs/erd.md` (produced with the migrations, Phase 2)
- Ride/pool lifecycle: `docs/decisions.md` §5 (produced Phase 5)