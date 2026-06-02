import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "saved_location" ADD COLUMN "icon" text DEFAULT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "saved_location" DROP COLUMN "icon";`.execute(db);
}
