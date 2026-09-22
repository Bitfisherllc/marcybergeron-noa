/**
 * Ensures `home_slideshow.href` exists. Safe to run multiple times.
 * Run: npm run db:ensure-home-slideshow-href
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureHomeSlideshowHrefColumn(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE home_slideshow ADD COLUMN IF NOT EXISTS href text NOT NULL DEFAULT '';
  `);
}

async function main() {
  await ensureHomeSlideshowHrefColumn();
  console.log("Home slideshow link column ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
