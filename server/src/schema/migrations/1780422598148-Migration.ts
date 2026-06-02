import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "saved_location" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "userId" uuid NOT NULL,
  "name" character varying NOT NULL,
  "label" character varying NOT NULL,
  "description" text,
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "isFavorite" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "saved_location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "saved_location_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "saved_location_userId_idx" ON "saved_location" ("userId");`.execute(db);
  await sql`CREATE INDEX "saved_location_updateId_idx" ON "saved_location" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "saved_location_updatedAt"
  BEFORE UPDATE ON "saved_location"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_saved_location_updatedAt', '{"type":"trigger","name":"saved_location_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"saved_location_updatedAt\\"\\n  BEFORE UPDATE ON \\"saved_location\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "saved_location";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_saved_location_updatedAt';`.execute(db);
}
