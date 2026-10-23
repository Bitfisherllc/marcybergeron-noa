/**
 * Ensures `hidden` exists on `artwork`. Safe to run multiple times.
 * Hidden paintings stay in admin and can be shown again. They are left off the public site.
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensureArtworkHiddenColumn(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE artwork ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
  `);
}

async function main() {
  await ensureArtworkHiddenColumn();
  console.log("Artwork hidden column ready (hidden paintings stay available in admin).");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
