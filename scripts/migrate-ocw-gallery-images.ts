/**
 * Oil and Cold Wax gallery uses General-Oil & Cold Wax paintings as its medium listing.
 * Other series keep their own pages and are not listed on the Oil and Cold Wax gallery.
 * Safe to run multiple times.
 */
import { eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { artwork, artworkSeries, series } from "@/db/schema";
import { GENERAL_OIL_COLD_WAX_SLUG, OIL_COLD_WAX_CHILD_SLUGS, OIL_COLD_WAX_PARENT_SLUG } from "@/lib/oilColdWaxSeries";

export async function ensureOilColdWaxGalleryImages(): Promise<void> {
  const db = getDb();
  const parent = await db
    .select({ id: series.id })
    .from(series)
    .where(eq(series.slug, OIL_COLD_WAX_PARENT_SLUG))
    .then((r) => r[0]);
  if (!parent) {
    console.log("Oil and Cold Wax gallery not found; skip medium assignment.");
    return;
  }

  const rows = await db
    .select({ id: series.id, slug: series.slug })
    .from(series)
    .where(inArray(series.slug, [...OIL_COLD_WAX_CHILD_SLUGS]));
  const generalId = rows.find((r) => r.slug === GENERAL_OIL_COLD_WAX_SLUG)?.id;
  if (!generalId) {
    console.log("General-Oil & Cold Wax series not found; skip medium assignment.");
    return;
  }

  const generalMembers = await db
    .select({ artworkId: artworkSeries.artworkId })
    .from(artworkSeries)
    .where(eq(artworkSeries.seriesId, generalId));
  const generalArtworkIds = generalMembers.map((row) => row.artworkId);
  if (generalArtworkIds.length > 0) {
    await db.update(artwork).set({ mediumSeriesId: parent.id }).where(inArray(artwork.id, generalArtworkIds));
  }

  const otherIds = rows.filter((r) => r.slug !== GENERAL_OIL_COLD_WAX_SLUG).map((r) => r.id);
  if (otherIds.length > 0) {
    const otherMembers = await db
      .select({ artworkId: artworkSeries.artworkId })
      .from(artworkSeries)
      .where(inArray(artworkSeries.seriesId, otherIds));
    const generalSet = new Set(generalArtworkIds);
    const toClear = otherMembers.map((row) => row.artworkId).filter((id) => !generalSet.has(id));
    if (toClear.length > 0) {
      await db.update(artwork).set({ mediumSeriesId: null }).where(inArray(artwork.id, toClear));
    }
  }

  console.log(
    `Oil and Cold Wax gallery paintings: ${generalArtworkIds.length}. Other series remain on Series pages only.`,
  );
}

async function main() {
  await ensureOilColdWaxGalleryImages();
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
