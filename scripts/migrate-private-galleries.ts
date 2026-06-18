/**
 * Ensures private gallery columns exist on `series`. Safe to run multiple times.
 * Run: npm run db:ensure-private-galleries
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensurePrivateGalleryColumns(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE series ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
  `);
  await db.execute(sql`
    ALTER TABLE series ADD COLUMN IF NOT EXISTS access_token text;
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS series_access_token_unique ON series (access_token)
    WHERE access_token IS NOT NULL;
  `);
}

async function main() {
  await ensurePrivateGalleryColumns();
  console.log("Private gallery columns ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
