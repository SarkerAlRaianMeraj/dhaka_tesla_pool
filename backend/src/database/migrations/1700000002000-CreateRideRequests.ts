import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2 schema: ride requests and their append-only status history.
 *
 * Two choices are worth stating outright, because both are constraints that a
 * purely application-level implementation would not have:
 *
 * **`status` is a CHECK-constrained `varchar`, not a Postgres enum.** The lifecycle
 * is fixed by the PRD, but adding a state to a Postgres enum requires an
 * `ALTER TYPE` and cannot be rolled back inside a transaction on older versions.
 * A CHECK can be dropped and recreated, and it reads the same in a schema dump.
 *
 * **The status vocabulary is duplicated here deliberately.** The CHECK list and the
 * `RideStatus` enum must agree, and nothing at the database level enforces that. It
 * is repeated rather than derived because a migration cannot import application
 * code without coupling the schema's history to the code's future.
 */
export class CreateRideRequests1700000002000 implements MigrationInterface {
  name = 'CreateRideRequests1700000002000';

  private static readonly STATUSES = [
    'REQUESTED',
    'MATCHED',
    'ACCEPTED',
    'DRIVER_ARRIVED',
    'STARTED',
    'COMPLETED',
    'CANCELLED',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statuses = CreateRideRequests1700000002000.STATUSES.map(
      (status) => `'${status}'`,
    );

    await queryRunner.query(`
      CREATE TABLE "ride_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "passenger_id" uuid NOT NULL,
        "pickup_zone_id" uuid NOT NULL,
        "destination_zone_id" uuid NOT NULL,
        "seats_requested" smallint NOT NULL,
        "distance_km" numeric(6,2) NOT NULL,
        "fare_estimate_poysha" integer NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'REQUESTED',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "ck_ride_requests_status"
          CHECK ("status" IN (${statuses.join(', ')})),
        -- 1-3 because the only Tesla in the brief is a 3-seater Bullet; Phase 3
        -- replaces this with a real capacity check.
        CONSTRAINT "ck_ride_requests_seats"
          CHECK ("seats_requested" BETWEEN 1 AND 3),
        CONSTRAINT "ck_ride_requests_fare_non_negative"
          CHECK ("fare_estimate_poysha" >= 0),
        -- A ride to where you already are is never a valid request, and the fare
        -- rule would happily price it at the 300 Taka base fare.
        CONSTRAINT "ck_ride_requests_zones_differ"
          CHECK ("pickup_zone_id" <> "destination_zone_id"),
        CONSTRAINT "fk_ride_requests_passenger"
          FOREIGN KEY ("passenger_id") REFERENCES "users" ("id")
          ON DELETE CASCADE,
        -- RESTRICT, not CASCADE: zones are reference data that rides match on, so
        -- deleting one that rides point at must fail rather than erase history.
        CONSTRAINT "fk_ride_requests_pickup_zone"
          FOREIGN KEY ("pickup_zone_id") REFERENCES "zones" ("id")
          ON DELETE RESTRICT,
        CONSTRAINT "fk_ride_requests_destination_zone"
          FOREIGN KEY ("destination_zone_id") REFERENCES "zones" ("id")
          ON DELETE RESTRICT
      )
    `);

    // Serves `GET /rides`, which is always filtered to one passenger and ordered
    // newest first (FR-P5.2). Ascending, because that is what the entity declares —
    // Postgres reads an ascending index backwards for a DESC query just as well,
    // and matching the entity avoids spurious schema drift.
    await queryRunner.query(`
      CREATE INDEX "idx_ride_requests_passenger_created"
        ON "ride_requests" ("passenger_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "ride_status_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ride_request_id" uuid NOT NULL,
        "from_status" varchar(20),
        "to_status" varchar(20) NOT NULL,
        "changed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_ride_status_history_ride"
          FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests" ("id")
          ON DELETE CASCADE,
        -- Nullable, because the first row of every ride is its creation and has no
        -- prior state to record.
        CONSTRAINT "ck_ride_status_history_from_status"
          CHECK ("from_status" IS NULL OR "from_status" IN (${statuses.join(', ')})),
        CONSTRAINT "ck_ride_status_history_to_status"
          CHECK ("to_status" IN (${statuses.join(', ')}))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_ride_status_history_ride_changed"
        ON "ride_status_history" ("ride_request_id", "changed_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // History first: it holds the foreign key into ride_requests.
    await queryRunner.query(`DROP TABLE IF EXISTS "ride_status_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ride_requests"`);
  }
}
