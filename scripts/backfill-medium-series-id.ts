import { eq, isNull } from "drizzle-orm";
import { artwork, series } from "@/db/schema";
import { getDb } from "@/db";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";

/** One-time helper: set `medium_series_id` for paintings already stored inside medium galleries. */
async function main() {
  const db = getDb();
  const rows = await db
    .select({ piece: artwork, ser: series })
    .from(artwork)
    .innerJoin(series, eq(artwork.seriesId, series.id));

  let updated = 0;
  for (const { piece, ser } of rows) {
    if (!isMediumGallerySlug(ser.slug)) continue;
    if (piece.mediumSeriesId) continue;
    await db.update(artwork).set({ mediumSeriesId: ser.id }).where(eq(artwork.id, piece.id));
    updated++;
  }

  const orphaned = await db
    .select({ id: artwork.id })
    .from(artwork)
    .where(isNull(artwork.mediumSeriesId));
  console.log(`Backfill complete. Updated ${updated} artwork row(s). ${orphaned.length} still without medium_series_id.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
