import { eq } from "drizzle-orm";
import { artwork, artworkSeries } from "@/db/schema";
import { getDb } from "@/db";

/** Copy existing `artwork.series_id` into `artwork_series` for every painting. */
async function main() {
  const db = getDb();
  const pieces = await db.select({ id: artwork.id, seriesId: artwork.seriesId }).from(artwork);

  let inserted = 0;
  for (const piece of pieces) {
    const existing = await db
      .select({ seriesId: artworkSeries.seriesId })
      .from(artworkSeries)
      .where(eq(artworkSeries.artworkId, piece.id));
    if (existing.some((r) => r.seriesId === piece.seriesId)) continue;
    await db.insert(artworkSeries).values({ artworkId: piece.id, seriesId: piece.seriesId });
    inserted++;
  }

  console.log(`Backfill complete. Added ${inserted} artwork_series row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
