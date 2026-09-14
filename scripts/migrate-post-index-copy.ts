/**
 * Ensures `post_index_copy` exists for news and workshop listing intros.
 * Safe to run multiple times.
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensurePostIndexCopyTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "post_index_copy" (
      "kind" text PRIMARY KEY NOT NULL,
      "eyebrow" text DEFAULT '' NOT NULL,
      "title" text DEFAULT '' NOT NULL,
      "intro" text DEFAULT '' NOT NULL,
      "updated_at" timestamptz NOT NULL
    )
  `);
}

async function main() {
  await ensurePostIndexCopyTable();
  console.log("Post index copy table ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
