import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Extend shared_space_person_alias with override fields
  await sql`ALTER TABLE "shared_space_person_alias" ADD COLUMN "isHidden" boolean NOT NULL DEFAULT false`.execute(db);
  await sql`ALTER TABLE "shared_space_person_alias" ADD COLUMN "birthDate" date`.execute(db);
  await sql`ALTER TABLE "shared_space_person_alias" ADD COLUMN "description" text`.execute(db);
  await sql`ALTER TABLE "shared_space_person_alias" ADD COLUMN "representativeFaceId" uuid REFERENCES "asset_face"("id") ON DELETE SET NULL`.execute(db);

  // 2. Create shared_space_tag table
  await sql`
    CREATE TABLE "shared_space_tag" (
      "spaceId" uuid NOT NULL REFERENCES "shared_space"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "tagId" uuid NOT NULL REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      PRIMARY KEY ("spaceId", "tagId")
    )
  `.execute(db);

  // 3. Create shared_space_tag_override table
  await sql`
    CREATE TABLE "shared_space_tag_override" (
      "spaceId" uuid NOT NULL REFERENCES "shared_space"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "tagId" uuid NOT NULL REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "isHidden" boolean NOT NULL DEFAULT false,
      "color" character varying,
      "alias" character varying,
      PRIMARY KEY ("spaceId", "tagId", "userId")
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS "shared_space_tag_override"`.execute(db);
  await sql`DROP TABLE IF EXISTS "shared_space_tag"`.execute(db);

  await sql`ALTER TABLE "shared_space_person_alias" DROP COLUMN IF EXISTS "representativeFaceId"`.execute(db);
  await sql`ALTER TABLE "shared_space_person_alias" DROP COLUMN IF EXISTS "description"`.execute(db);
  await sql`ALTER TABLE "shared_space_person_alias" DROP COLUMN IF EXISTS "birthDate"`.execute(db);
  await sql`ALTER TABLE "shared_space_person_alias" DROP COLUMN IF EXISTS "isHidden"`.execute(db);
}
