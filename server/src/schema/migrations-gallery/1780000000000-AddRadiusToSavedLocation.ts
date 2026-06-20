import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "saved_location" ADD "radius" integer NOT NULL DEFAULT 50`.execute(db);
  await sql`CREATE INDEX "IDX_saved_location_gist_earthcoord" ON "saved_location" USING gist (ll_to_earth_public(latitude, longitude))`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_saved_location_gist_earthcoord"`.execute(db);
  await sql`ALTER TABLE "saved_location" DROP COLUMN "radius"`.execute(db);
}
