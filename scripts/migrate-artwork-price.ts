/**
 * Ensures `price` exists on `artwork`. Safe to run multiple times.
 * Null means the painting has no public price. Prices show on exhibition pages only.
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureArtworkPriceColumn(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE artwork ADD COLUMN IF NOT EXISTS price integer;
  `);
}

async function main() {
  await ensureArtworkPriceColumn();
  console.log("Artwork price column ready (shown on exhibition pages only).");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
