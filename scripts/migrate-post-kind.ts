/**
 * Ensures `kind` exists on `post` and `post_category`, then moves former
 * News → Workshops category entries into the workshop section.
 * Safe to run multiple times.
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";

export async function ensurePostKindColumns(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE post ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'news';
  `);
  await db.execute(sql`
    ALTER TABLE post_category ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'news';
  `);

  await db.execute(sql`
    UPDATE post
    SET kind = 'workshop',
        category = 'Upcoming'
    WHERE lower(btrim(category)) = 'workshops'
  `);

  await db.execute(sql`
    UPDATE post_category
    SET kind = 'workshop',
        name = 'Upcoming',
        slug = 'upcoming'
    WHERE slug = 'workshops'
      AND NOT EXISTS (SELECT 1 FROM post_category WHERE slug = 'upcoming')
  `);

  await db.execute(sql`
    DELETE FROM post_category
    WHERE slug = 'workshops'
      AND kind = 'news'
  `);

  await db.execute(sql`
    UPDATE post_category SET sort_order = 0 WHERE slug = 'upcoming' AND kind = 'workshop';
  `);
  await db.execute(sql`
    UPDATE post_category SET sort_order = 1 WHERE slug = 'past' AND kind = 'workshop';
  `);
}

async function main() {
  await ensurePostKindColumns();
  console.log("Post kind columns ready (news vs workshop).");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
