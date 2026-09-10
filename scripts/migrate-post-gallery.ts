/**
 * Ensures `post_gallery_image` exists. Safe to run multiple times.
 * Run: npm run db:ensure-post-gallery
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensurePostGalleryTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "post_gallery_image" (
      "id" text PRIMARY KEY NOT NULL,
      "post_id" text NOT NULL REFERENCES "post"("id") ON DELETE CASCADE,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "image" text NOT NULL,
      "alt" text DEFAULT '' NOT NULL,
      "caption" text DEFAULT '' NOT NULL,
      "image_width" integer,
      "image_height" integer,
      "created_at" timestamptz NOT NULL,
      "updated_at" timestamptz NOT NULL
    )
  `);
}

async function main() {
  await ensurePostGalleryTable();
  console.log("Post gallery table ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
