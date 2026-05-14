/**
 * One-time copy from local `data/site.db` (SQLite) into PostgreSQL (`DATABASE_URL`).
 *
 *   export DATABASE_URL="postgresql://..."
 *   npx tsx scripts/migrate-sqlite-to-postgres.ts
 *
 * Requires tables on Postgres (run `npm run db:push` once against the same DATABASE_URL).
 */
import path from "node:path";
import Database from "better-sqlite3";
import { asc, sql } from "drizzle-orm";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { closeDb, getDb } from "../src/db/index";
import * as pg from "../src/db/schema";
import * as sq from "./schema-sqlite-legacy";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Set DATABASE_URL to your Railway (or other) Postgres connection string.");
    process.exit(1);
  }

  const dbPath = path.join(process.cwd(), "data", "site.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  const sdb = drizzleSqlite(sqlite, { schema: sq });
  const pdb = getDb();

  await pdb.execute(
    sql.raw(`TRUNCATE TABLE
      home_selected_artwork_slot,
      home_featured_post_slot,
      home_featured_series_slot,
      home_slideshow,
      home_section,
      artwork,
      post,
      series,
      contact_message,
      mailing_list_signup
    RESTART IDENTITY CASCADE`),
  );

  const seriesRows = await sdb.select().from(sq.series).orderBy(asc(sq.series.sortOrder));
  if (seriesRows.length === 0) {
    console.error("No rows in SQLite series — populate data/site.db first, then run again.");
    process.exit(1);
  }
  await pdb.insert(pg.series).values(seriesRows);

  const artworkRows = await sdb.select().from(sq.artwork);
  await pdb.insert(pg.artwork).values(artworkRows);

  const postRows = await sdb.select().from(sq.post);
  await pdb.insert(pg.post).values(postRows);

  const cm = await sdb.select().from(sq.contactMessage);
  if (cm.length) await pdb.insert(pg.contactMessage).values(cm);

  const ml = await sdb.select().from(sq.mailingListSignup);
  if (ml.length) await pdb.insert(pg.mailingListSignup).values(ml);

  const hs = await sdb.select().from(sq.homeSection);
  if (hs.length) await pdb.insert(pg.homeSection).values(hs);

  const hslide = await sdb.select().from(sq.homeSlideshow);
  if (hslide.length) await pdb.insert(pg.homeSlideshow).values(hslide);

  const hfss = await sdb.select().from(sq.homeFeaturedSeriesSlot);
  if (hfss.length) await pdb.insert(pg.homeFeaturedSeriesSlot).values(hfss);

  const hfps = await sdb.select().from(sq.homeFeaturedPostSlot);
  if (hfps.length) await pdb.insert(pg.homeFeaturedPostSlot).values(hfps);

  const hasw = await sdb.select().from(sq.homeSelectedArtworkSlot);
  if (hasw.length) await pdb.insert(pg.homeSelectedArtworkSlot).values(hasw);

  sqlite.close();
  await closeDb();
  console.log("Migration complete:", {
    series: seriesRows.length,
    artwork: artworkRows.length,
    posts: postRows.length,
  });
}

main().catch(async (e) => {
  console.error(e);
  await closeDb().catch(() => {});
  process.exit(1);
});
