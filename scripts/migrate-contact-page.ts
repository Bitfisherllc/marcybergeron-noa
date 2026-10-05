/**
 * Ensures `contact_page` exists. Safe to run multiple times.
 * Run: npm run db:ensure-contact-page
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureContactPageTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS contact_page (
      id text PRIMARY KEY NOT NULL,
      eyebrow text NOT NULL DEFAULT '',
      title text NOT NULL DEFAULT '',
      intro text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      studio_lines text NOT NULL DEFAULT '',
      social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
      directions_eyebrow text NOT NULL DEFAULT '',
      directions_title text NOT NULL DEFAULT '',
      directions_intro text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL
    );
  `);
}

async function main() {
  await ensureContactPageTable();
  console.log("Contact page table ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
