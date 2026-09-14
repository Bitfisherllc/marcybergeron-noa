/**
 * Ensures `price` exists on `post`. Safe to run multiple times.
 * Workshops without a stored price use $350 in the app.
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensurePostPriceColumn(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE post ADD COLUMN IF NOT EXISTS price integer;
  `);
}

async function main() {
  await ensurePostPriceColumn();
  console.log("Post price column ready (workshops default to $350 unless set in admin).");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
