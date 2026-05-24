import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ADD "description" text`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD "description" text`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "description"`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "description"`.execute(db);
}
