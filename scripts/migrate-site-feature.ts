/**
 * Ensures `site_feature` exists. Safe to run multiple times.
 * No rows are written: a missing row means the feature is off (Workshops stay hidden until turned on in admin).
 * Run: npm run db:ensure-site-feature
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureSiteFeatureTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_feature (
      key text PRIMARY KEY NOT NULL,
      enabled boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL
    );
  `);
}

async function main() {
  await ensureSiteFeatureTable();
  console.log("Site feature table ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
