/**
 * Ensures `home_section.visible` exists. Safe to run multiple times.
 * Hero and artist words stay on; featured series, journal, and selected works stay off
 * until someone turns them on in admin.
 * Run: npm run db:ensure-home-section-visible
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureHomeSectionVisibleColumn(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE home_section ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT false;
  `);
  await db.execute(sql`
    UPDATE home_section
    SET visible = true
    WHERE section IN ('hero', 'artist_words') AND visible = false;
  `);
}

async function main() {
  await ensureHomeSectionVisibleColumn();
  console.log("Home section visibility column ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
