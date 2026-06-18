import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Add isSystemSpace to shared_space
  await sql`ALTER TABLE "shared_space" ADD COLUMN "isSystemSpace" boolean NOT NULL DEFAULT false`.execute(db);
  await sql`CREATE UNIQUE INDEX "shared_space_system_unique" ON "shared_space" ("isSystemSpace") WHERE "isSystemSpace" = true`.execute(db);

  // 2. Add member preference columns to shared_space_member
  await sql`ALTER TABLE "shared_space_member" ADD COLUMN "inheritPeople" boolean NOT NULL DEFAULT true`.execute(db);
  await sql`ALTER TABLE "shared_space_member" ADD COLUMN "inheritTags" boolean NOT NULL DEFAULT true`.execute(db);
  await sql`ALTER TABLE "shared_space_member" ADD COLUMN "showInMap" boolean NOT NULL DEFAULT true`.execute(db);
  await sql`ALTER TABLE "shared_space_member" ADD COLUMN "showInMemories" boolean NOT NULL DEFAULT true`.execute(db);

  // 3. Create user_asset_override table
  await sql`
    CREATE TABLE "user_asset_override" (
      "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "assetId" uuid NOT NULL REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "isHidden" boolean NOT NULL DEFAULT false,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      PRIMARY KEY ("userId", "assetId")
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS "user_asset_override"`.execute(db);
  
  await sql`ALTER TABLE "shared_space_member" DROP COLUMN IF EXISTS "showInMemories"`.execute(db);
  await sql`ALTER TABLE "shared_space_member" DROP COLUMN IF EXISTS "showInMap"`.execute(db);
  await sql`ALTER TABLE "shared_space_member" DROP COLUMN IF EXISTS "inheritTags"`.execute(db);
  await sql`ALTER TABLE "shared_space_member" DROP COLUMN IF EXISTS "inheritPeople"`.execute(db);
  
  await sql`DROP INDEX IF EXISTS "shared_space_system_unique"`.execute(db);
  await sql`ALTER TABLE "shared_space" DROP COLUMN IF EXISTS "isSystemSpace"`.execute(db);
}
