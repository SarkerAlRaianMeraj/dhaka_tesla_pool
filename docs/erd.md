# Entity-relationship diagram

Generated from the live database after `npm run migration:run`, so it reflects the
migrations rather than a hand-maintained copy. Phase 2 covers `users`, `zones`,
`corridors`, `zone_corridors`, `ride_requests`, and `ride_status_history`; the
Phase 3-6 tables are listed at the end as not yet created.

Every primary key is a UUID (D16) and the schema is built from versioned migrations
rather than `synchronize` (D17).

## Relationships

```
users (1) ──────< (n) ride_requests          passenger_id, ON DELETE CASCADE
zones (1) ──────< (n) ride_requests          pickup_zone_id, ON DELETE RESTRICT
zones (1) ──────< (n) ride_requests          destination_zone_id, ON DELETE RESTRICT
ride_requests (1) ──< (n) ride_status_history   ride_request_id, ON DELETE CASCADE
zones (n) ──────< (n) >────── corridors       zone_corridors (join table)
```

## users

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid | no | gen_random_uuid() |
| name | varchar(120) | no | |
| email | varchar(180) | no | |
| password_hash | varchar(255) | no | |
| role | varchar(20) | no | |
| tesla_pay_balance_poysha | integer | no | 0 |
| created_at | timestamptz | no | now() |
| updated_at | timestamptz | no | now() |

- PK `users_pkey`
- UNIQUE `uq_users_email (email)`
- CHECK `ck_users_role`: `role IN ('passenger','driver')`
- CHECK `ck_users_balance_non_negative`: `tesla_pay_balance_poysha >= 0`

## zones

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid | no | gen_random_uuid() |
| code | varchar(40) | no | |
| name | varchar(60) | no | |
| x_km | numeric(6,2) | no | |
| y_km | numeric(6,2) | no | |

- PK `zones_pkey`
- UNIQUE `uq_zones_code (code)`
- INDEX `idx_zones_coordinates (x_km, y_km)`

`x_km` and `y_km` are a published grid in kilometres, not map coordinates. The fare
is Manhattan distance on this grid, so any fare can be checked by hand
(`backend/src/ride/fare.ts`).

## corridors

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid | no | gen_random_uuid() |
| code | varchar(60) | no | |
| name | varchar(120) | no | |

- PK `corridors_pkey`
- UNIQUE `uq_corridors_code (code)`

## zone_corridors

| Column | Type | Null | Default |
|---|---|---|---|
| zone_id | uuid | no | |
| corridor_id | uuid | no | |

- PK `zone_corridors_pkey (zone_id, corridor_id)`
- FK `zone_id -> zones.id` ON DELETE CASCADE
- FK `corridor_id -> corridors.id` ON DELETE CASCADE
- INDEX `idx_zone_corridors_corridor (corridor_id)`

## ride_requests

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid | no | gen_random_uuid() |
| passenger_id | uuid | no | |
| pickup_zone_id | uuid | no | |
| destination_zone_id | uuid | no | |
| seats_requested | smallint | no | |
| distance_km | numeric(6,2) | no | |
| fare_estimate_poysha | integer | no | |
| status | varchar(20) | no | 'REQUESTED' |
| created_at | timestamptz | no | now() |
| updated_at | timestamptz | no | now() |

- PK `ride_requests_pkey`
- FK `passenger_id -> users.id` ON DELETE CASCADE
- FK `pickup_zone_id -> zones.id` ON DELETE RESTRICT
- FK `destination_zone_id -> zones.id` ON DELETE RESTRICT
- CHECK `ck_ride_requests_status`: the seven PRD states
- CHECK `ck_ride_requests_seats`: `1 <= seats_requested <= 3`
- CHECK `ck_ride_requests_fare_non_negative`: `fare_estimate_poysha >= 0`
- CHECK `ck_ride_requests_zones_differ`: `pickup_zone_id <> destination_zone_id`
- INDEX `idx_ride_requests_passenger_created (passenger_id, created_at)`

Zones are foreign keys rather than strings (D22), because FR-DB1 asks for real
relationships and a string cannot enforce that a zone exists. The API accepts zone
*codes*; the service resolves them.

`seats_requested` is capped at 3 because the only Tesla in the brief is a 3-seater
Bullet. Phase 3 replaces that bound with a check against the matched vehicle.

## ride_status_history

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid | no | gen_random_uuid() |
| ride_request_id | uuid | no | |
| from_status | varchar(20) | **yes** | |
| to_status | varchar(20) | no | |
| changed_at | timestamptz | no | now() |

- PK `ride_status_history_pkey`
- FK `ride_request_id -> ride_requests.id` ON DELETE CASCADE
- CHECK `ck_ride_status_history_from_status`: nullable, or one of the seven states
- CHECK `ck_ride_status_history_to_status`: one of the seven states
- INDEX `idx_ride_status_history_ride_changed (ride_request_id, changed_at)`

Append-only. The current status also lives on `ride_requests` because every read
needs it; this table exists so the *path* is not lost. A ride that went
REQUESTED → MATCHED → CANCELLED and one that was never matched are indistinguishable
from `status` alone.

`from_status` is nullable because the first row of every ride is its creation.

## Not yet created

`vehicles`, `pools`, `pool_members`, `payments`, and `ratings` arrive in Phases 3-6,
per SRS §4.3. `pool_members` is where capacity is enforced; see
`docs/architecture.md` §4.

## Reproducing

```bash
cd backend
npm run migration:run        # applies 1700000001000 and 1700000002000
```

`migrations` is TypeORM's own bookkeeping table and is not part of the domain model.