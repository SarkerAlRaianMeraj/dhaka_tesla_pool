# Architecture — Dhaka Tesla Pool

**Status:** Phase 1 complete — identity, session, and the zone reference data are built. This document grows as the system is built; the implementation must match what is documented here, and this file is updated when the architecture changes.

## 1. System view

```
Browser
  └── Next.js App Router web app (role-aware: one app, not two)
        │  HTTPS · JSON · httpOnly session cookie
        │  (Authorization: Bearer accepted as a fallback for scripts)
        ▼
NestJS REST API  /api/v1
  guards ── validation ── services ── TypeORM ── PostgreSQL
        ▼
PostgreSQL (the only source of truth for capacity)
```

Three tiers, one process each for the MVP. No message queue, no cache, no microservice split — see `docs/decisions.md` for why each omission is a deliberate call rather than a missing feature.

The web app listens on 3001 because the API owns 3000 (D20). The session is a signed JWT in an httpOnly cookie rather than a server-side session (D15, D18), which is why every authenticated screen is client-rendered: the browser holds the cookie, not the Next.js server.

## 2. Module map (backend)

Each feature is a folder directly under `src`, holding its module, controller, service, and entities — the shape `backend/rules.md` prescribes.

| Folder | Responsibility | Phase |
|---|---|---|
| `config` | Environment validation, typed configuration | 0 |
| `common/middleware` | Request-id propagation for log correlation | 0 |
| `common/guards`, `common/decorators` | JWT authentication and the role guard | 0, 1 |
| `health` | Liveness/readiness probe, including a database ping | 0 |
| `database` | Shared DataSource options, migration runner, seeds | 0+ |
| `auth` | Register, login, logout, profile; JWT issuance; password hashing | 1 |
| `user` | The `User` entity only — identity endpoints belong to `auth` (D21) | 1 |
| `zone` | Zones, corridors, and the cached zone reference read | 1 |
| `ride` | Ride requests, fare estimate, status lifecycle | 2, 5 |
| `vehicle` | Tesla registration, capacity, driver availability | 3 |
| `pool` | Pool creation, seat assignment, capacity enforcement | 4 |
| `payment` / `rating` | Cash and TeslaPay settlement, driver rating | 6 |

Business rules that need no I/O — the fare model, the matching rule, and the ride state machine — live with the service that owns them rather than in a separate layer. Each is exported as a pure function or a lookup table so it can be read, hand-checked against FR-F1, and lifted into its own module in Phase 9 without being rewritten. There is no `src/domain` folder: the course standard does not define one, and a rule that is never reused outside its service does not need a home of its own.

## 3. Data model

The entity set follows SRS §4.3: User, Tesla/Vehicle, RideRequest, Pool, PoolMembership, StatusHistory, Payment, Rating, plus the `zones`, `corridors`, and `zone_corridors` reference tables required by FR-M1 (D9). Every primary key is a UUID (D16) and the schema is built from versioned migrations rather than `synchronize` (D17).

Phase 1 has created: `users`, `zones`, `corridors`, `zone_corridors` — the first migration, `1700000001000-CreateIdentitySchema.ts`, which also seeds the eight zones and four corridors. Migrations and the ERD are produced with the schema; the authoritative column-level diagram is generated from the entities and kept in step with them.

## 4. Capacity enforcement

Seat assignment is a single database transaction: the pool row is locked, occupancy is re-read under the lock, and the capacity check and occupancy write happen together. A database `CHECK` constraint refuses to store occupancy above capacity, so the guarantee survives any future code path that forgets the check. See `docs/decisions.md` for the full trade-off.

## 5. Diagrams

- Architecture: this document, §1
- ERD: `docs/erd.md` (produced with the migrations, Phase 2)
- Ride/pool lifecycle: `docs/decisions.md` §5 (produced Phase 5)