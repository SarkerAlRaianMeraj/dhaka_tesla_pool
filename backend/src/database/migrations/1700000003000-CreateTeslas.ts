import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 schema: the Tesla a driver owns, and its availability.
 *
 * **One Tesla per driver is a database fact, not an application check.** `US-D2`
 * says a second registration is refused. Enforcing that with a query in the
 * service would work right up until two registrations arrived at once, which is
 * the same class of defect D25 removed from cancellation. `uq_teslas_driver` makes
 * the invariant true unconditionally, and the unique-violation is translated back
 * into a 409 in the service so the caller still hears a useful message.
 *
 * **`capacity` is immutable.** `US-D2` fixes it at registration, and Phase 4's
 * capacity guarantee reasons about a number that never moves. Nothing in the
 * product edits it, so there is no update path that could lower it underneath a
 * pool that already holds passengers.
 *
 * **Availability is a column, not a table** (D26). One driver owns exactly one
 * Tesla, so the state has exactly one home. Error E2 — a driver going offline
 * while owing a ride — is a guard applied by the service rather than extra state:
 * the assignment survives, the ride stays ACCEPTED, and the passenger is told the
 * driver is reconnecting.
 *
 * As in Phase 2, the availability vocabulary is duplicated rather than imported, because
 * a migration cannot depend on application code without coupling the schema's
 * history to the code's future.
 */
export class CreateTeslas1700000003000 implements MigrationInterface {
  name = 'CreateTeslas1700000003000';

  private static readonly AVAILABILITIES = ['OFFLINE', 'ONLINE'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const availabilities = CreateTeslas1700000003000.AVAILABILITIES.map(
      (availability) => `'${availability}'`,
    );

    await queryRunner.query(`
      CREATE TABLE "teslas" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "driver_id" uuid NOT NULL,
        "plate" varchar(20) NOT NULL,
        "model" varchar(60) NOT NULL DEFAULT 'Tesla Model 3',
        "capacity" smallint NOT NULL,
        "availability" varchar(20) NOT NULL DEFAULT 'OFFLINE',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "ck_teslas_availability"
          CHECK ("availability" IN (${availabilities.join(', ')})),
        -- 1-3 mirrors ck_ride_requests_seats. The two bounds have to agree, or a
        -- driver could register a Tesla that can seat fewer people than a single
        -- passenger is allowed to ask for.
        CONSTRAINT "ck_teslas_capacity"
          CHECK ("capacity" BETWEEN 1 AND 3),
        -- A Tesla with no plate is not a vehicle the platform can identify, and an
        -- all-whitespace plate is the same failure wearing a disguise.
        CONSTRAINT "ck_teslas_plate_not_blank"
          CHECK (length(btrim("plate")) > 0),
        -- CASCADE: a Tesla has no meaning without the driver who owns it, and the
        -- identity tables own their rows.
        CONSTRAINT "fk_teslas_driver"
          FOREIGN KEY ("driver_id") REFERENCES "users" ("id")
          ON DELETE CASCADE,
        -- US-D2: "the Tesla is created once; registering again is refused".
        CONSTRAINT "uq_teslas_driver" UNIQUE ("driver_id"),
        CONSTRAINT "uq_teslas_plate" UNIQUE ("plate")
      )
    `);

    // Serves the Phase 4 claim transaction and the "who is online" question. The
    // driver is the leading column because every availability read and every
    // capacity check is scoped to one driver.
    await queryRunner.query(`
      CREATE INDEX "idx_teslas_availability" ON "teslas" ("availability")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "teslas"`);
  }
}
