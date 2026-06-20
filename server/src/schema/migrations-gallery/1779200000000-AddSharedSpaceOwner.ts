import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Таблица shared_space_owner — связь пространства с владельцами ассетов
  // Все фото ownerId будут видны участникам пространства
  await sql`
    CREATE TABLE IF NOT EXISTS "shared_space_owner" (
      "spaceId" uuid NOT NULL REFERENCES "shared_space"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "ownerId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "addedById" uuid REFERENCES "user"("id") ON DELETE SET NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      PRIMARY KEY ("spaceId", "ownerId")
    )
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS "shared_space_owner_ownerId_idx" ON "shared_space_owner" ("ownerId")
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS "shared_space_owner"`.execute(db);
}
