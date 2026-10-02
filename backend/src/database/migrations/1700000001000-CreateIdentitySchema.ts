import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 1 schema: identity plus the Dhaka reference data the rest of the product
 * depends on. Everything here is reference or identity data, so the migration
 * also seeds the eight zones and four corridors — the fare engine and matching
 * rule are unusable without them, and shipping them inside the migration keeps
 * the demo reproducible from an empty database (brief §12).
 */
export class CreateIdentitySchema1700000001000 implements MigrationInterface {
  name = 'CreateIdentitySchema1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "email" varchar(180) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" varchar(20) NOT NULL,
        "tesla_pay_balance_poysha" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "ck_users_role" CHECK ("role" IN ('passenger', 'driver')),
        CONSTRAINT "ck_users_balance_non_negative" CHECK ("tesla_pay_balance_poysha" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "corridors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(60) NOT NULL,
        "name" varchar(120) NOT NULL,
        CONSTRAINT "uq_corridors_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "zones" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL,
        "name" varchar(60) NOT NULL,
        "x_km" numeric(6,2) NOT NULL,
        "y_km" numeric(6,2) NOT NULL,
        CONSTRAINT "uq_zones_code" UNIQUE ("code")
      )
    `);

    // Distance is measured on the zone grid, so the coordinates are the first
    // thing any fare query touches.
    await queryRunner.query(
      `CREATE INDEX "idx_zones_coordinates" ON "zones" ("x_km", "y_km")`,
    );

    await queryRunner.query(`
      CREATE TABLE "zone_corridors" (
        "zone_id" uuid NOT NULL REFERENCES "zones"("id") ON DELETE CASCADE,
        "corridor_id" uuid NOT NULL REFERENCES "corridors"("id") ON DELETE CASCADE,
        PRIMARY KEY ("zone_id", "corridor_id")
      )
    `);

    // Matching reads corridors by destination zone; without this it degrades to a
    // sequential scan of every pairing on each candidate request.
    await queryRunner.query(
      `CREATE INDEX "idx_zone_corridors_corridor" ON "zone_corridors" ("corridor_id")`,
    );

    await this.seedReferenceData(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "zone_corridors"`);
    await queryRunner.query(`DROP TABLE "zones"`);
    await queryRunner.query(`DROP TABLE "corridors"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }

  /**
   * The eight zones and four corridors from the brief, with the grid coordinates
   * the fare model measures on. `x_km`/`y_km` are a flat published grid, not real
   * projection coordinates — chosen so a human can verify any fare by hand.
   */
  private async seedReferenceData(queryRunner: QueryRunner): Promise<void> {
    const corridors: [string, string][] = [
      ['banani_gulshan', 'Banani - Gulshan 1 - Mohakhali'],
      ['dhanmondi_farmgate', 'Dhanmondi - Farmgate - Mohakhali'],
      ['mirpur_uttara', 'Mirpur - Uttara'],
      ['bashundhara_east', 'Bashundhara - Dhanmondi - Farmgate'],
    ];
    for (const [code, name] of corridors) {
      await queryRunner.query(
        `INSERT INTO "corridors" ("code", "name") VALUES ($1, $2)`,
        [code, name],
      );
    }

    const zones: [string, string, number, number][] = [
      ['banani', 'Banani', 0, 0],
      ['gulshan_1', 'Gulshan 1', 1.5, 0.5],
      ['mohakhali', 'Mohakhali', 3.0, 0.8],
      ['dhanmondi', 'Dhanmondi', 5.0, 0.3],
      ['farmgate', 'Farmgate', 6.5, 0.2],
      ['bashundhara', 'Bashundhara', 7.5, 1.5],
      ['mirpur', 'Mirpur', 7, 5],
      ['uttara', 'Uttara', 4, 9],
    ];
    for (const [code, name, xKm, yKm] of zones) {
      await queryRunner.query(
        `INSERT INTO "zones" ("code", "name", "x_km", "y_km") VALUES ($1, $2, $3, $4)`,
        [code, name, xKm, yKm],
      );
    }

    const memberships: [string, string][] = [
      ['banani', 'banani_gulshan'],
      ['gulshan_1', 'banani_gulshan'],
      ['mohakhali', 'banani_gulshan'],
      ['mohakhali', 'dhanmondi_farmgate'],
      ['dhanmondi', 'dhanmondi_farmgate'],
      ['farmgate', 'dhanmondi_farmgate'],
      ['mirpur', 'mirpur_uttara'],
      ['uttara', 'mirpur_uttara'],
      ['bashundhara', 'bashundhara_east'],
      ['dhanmondi', 'bashundhara_east'],
      ['farmgate', 'bashundhara_east'],
    ];
    for (const [zoneCode, corridorCode] of memberships) {
      await queryRunner.query(
        `INSERT INTO "zone_corridors" ("zone_id", "corridor_id")
         SELECT z."id", c."id" FROM "zones" z, "corridors" c
         WHERE z."code" = $1 AND c."code" = $2`,
        [zoneCode, corridorCode],
      );
    }
  }
}
