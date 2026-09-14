/**
 * Ensures workshop date/materials columns and the inquiry table exist.
 * Safe to run multiple times.
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureWorkshopInquirySchema(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE post ADD COLUMN IF NOT EXISTS session_dates text NOT NULL DEFAULT '';
  `);
  await db.execute(sql`
    ALTER TABLE post ADD COLUMN IF NOT EXISTS materials_note text NOT NULL DEFAULT '';
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "workshop_inquiry" (
      "id" text PRIMARY KEY NOT NULL,
      "workshop_id" text REFERENCES "post"("id") ON DELETE SET NULL,
      "workshop_slug" text DEFAULT '' NOT NULL,
      "workshop_title" text NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "phone" text DEFAULT '' NOT NULL,
      "format" text NOT NULL,
      "other_workshops" text DEFAULT '' NOT NULL,
      "group_dates" text DEFAULT '' NOT NULL,
      "solo_date" text DEFAULT '' NOT NULL,
      "notes" text DEFAULT '' NOT NULL,
      "created_at" timestamptz NOT NULL,
      "read_at" timestamptz
    )
  `);
}

async function main() {
  await ensureWorkshopInquirySchema();
  console.log("Workshop dates, materials note, and inquiry table ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
