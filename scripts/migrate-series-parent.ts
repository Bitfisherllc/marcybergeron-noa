/**
 * Ensures `series.parent_series_id` exists and links the original Oil and Cold Wax series to their medium.
 * Safe to run multiple times.
 * Run: npm run db:ensure-series-parent
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { OIL_COLD_WAX_CHILD_SLUGS, OIL_COLD_WAX_PARENT_SLUG } from "@/lib/oilColdWaxSeries";

export async function ensureSeriesParentColumn(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE series ADD COLUMN IF NOT EXISTS parent_series_id text REFERENCES series(id) ON DELETE SET NULL;
  `);
  await db.execute(sql`
    UPDATE series AS child
    SET parent_series_id = parent.id
    FROM series AS parent
    WHERE parent.slug = ${OIL_COLD_WAX_PARENT_SLUG}
      AND child.parent_series_id IS NULL
      AND child.slug IN (${sql.join(
        OIL_COLD_WAX_CHILD_SLUGS.map((slug) => sql`${slug}`),
        sql`, `,
      )});
  `);
}

async function main() {
  await ensureSeriesParentColumn();
  console.log("Series parent column ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
