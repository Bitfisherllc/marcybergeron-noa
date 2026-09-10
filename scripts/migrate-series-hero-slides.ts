/**
 * Ensures `series_hero_slide` exists and can store an uploaded/library image
 * without requiring a painting. Safe to run multiple times.
 * Run: npm run db:ensure-series-hero-slides
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureSeriesHeroSlideTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "series_hero_slide" (
      "series_id" text NOT NULL REFERENCES "series"("id") ON DELETE CASCADE,
      "slot" integer NOT NULL,
      "artwork_id" text REFERENCES "artwork"("id") ON DELETE CASCADE,
      "image" text,
      PRIMARY KEY ("series_id", "slot")
    )
  `);
  await db.execute(sql`
    ALTER TABLE "series_hero_slide" ALTER COLUMN "artwork_id" DROP NOT NULL
  `);
  await db.execute(sql`
    ALTER TABLE "series_hero_slide" ADD COLUMN IF NOT EXISTS "image" text
  `);
  await db.execute(sql`
    UPDATE "series_hero_slide" AS slide
    SET "image" = piece."image"
    FROM "artwork" AS piece
    WHERE slide."artwork_id" = piece."id"
      AND (slide."image" IS NULL OR slide."image" = '')
  `);
}

async function main() {
  await ensureSeriesHeroSlideTable();
  console.log("Series hero slideshow table ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
