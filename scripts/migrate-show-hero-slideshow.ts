/**
 * Ensures `series.show_hero_slideshow` exists. Safe to run multiple times.
 * Run: npm run db:ensure-show-hero-slideshow
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureShowHeroSlideshowColumn(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE series ADD COLUMN IF NOT EXISTS show_hero_slideshow boolean NOT NULL DEFAULT false;
  `);
}

async function main() {
  await ensureShowHeroSlideshowColumn();
  console.log("Gallery slideshow visibility column ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
