/**
 * Ensures statement featured-artwork columns exist on `series`. Safe to run multiple times.
 * Run: npm run db:ensure-featured-artwork
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureFeaturedArtworkColumns(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE series ADD COLUMN IF NOT EXISTS featured_artwork_mode text NOT NULL DEFAULT 'random';
  `);
  await db.execute(sql`
    ALTER TABLE series ADD COLUMN IF NOT EXISTS featured_artwork_id text REFERENCES artwork(id) ON DELETE SET NULL;
  `);
}

async function main() {
  await ensureFeaturedArtworkColumns();
  console.log("Featured artwork columns ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
