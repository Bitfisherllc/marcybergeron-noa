/**
 * Ensures `site_favicon` exists. Safe to run multiple times.
 * Run: npm run db:ensure-site-favicon
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureSiteFaviconTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_favicon (
      id text PRIMARY KEY NOT NULL,
      image text NOT NULL,
      updated_at timestamptz NOT NULL
    );
  `);
}

async function main() {
  await ensureSiteFaviconTable();
  console.log("Site favicon table ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
