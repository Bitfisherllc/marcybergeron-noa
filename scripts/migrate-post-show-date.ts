/**
 * Ensures `show_date` exists on `post`. Safe to run multiple times.
 * Run: npm run db:ensure-post-show-date
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensurePostShowDateColumn(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE post ADD COLUMN IF NOT EXISTS show_date boolean NOT NULL DEFAULT false;
  `);
}

async function main() {
  await ensurePostShowDateColumn();
  console.log("Post show_date column ready (all posts default to hidden dates).");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
