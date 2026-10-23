/**
 * Ensures `price_guide` exists and seeds the original password once.
 * Safe to run multiple times. Later saves in admin are left alone.
 * Run: npm run db:ensure-price-guide
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensurePriceGuide(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS price_guide (
      id text PRIMARY KEY NOT NULL,
      password text NOT NULL,
      updated_at timestamptz NOT NULL
    );
  `);
  await db.execute(sql`
    INSERT INTO price_guide (id, password, updated_at)
    VALUES ('default', 'letmein', now())
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function main() {
  await ensurePriceGuide();
  console.log("Price guide password ready (change it on the Exhibitions admin page).");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
