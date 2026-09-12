/**
 * Removes the retired General-Oil & Cold Wax series.
 * Paintings stay on the Oil and Cold Wax portfolio gallery.
 * Safe to run multiple times.
 */
import { eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { artwork, artworkSeries, series, seriesHeroSlide } from "@/db/schema";
import { GENERAL_OIL_COLD_WAX_SLUG, OIL_COLD_WAX_PARENT_SLUG } from "@/lib/oilColdWaxSeries";

export async function removeGeneralOilColdWaxSeries(): Promise<void> {
  const db = getDb();
  const general = await db
    .select({ id: series.id })
    .from(series)
    .where(eq(series.slug, GENERAL_OIL_COLD_WAX_SLUG))
    .then((r) => r[0]);
  if (!general) {
    console.log("General-Oil & Cold Wax already removed.");
    return;
  }

  const parent = await db
    .select({ id: series.id })
    .from(series)
    .where(eq(series.slug, OIL_COLD_WAX_PARENT_SLUG))
    .then((r) => r[0]);
  if (!parent) {
    throw new Error("Oil and Cold Wax gallery not found; cannot reassign paintings.");
  }

  const now = new Date();
  await db
    .update(artwork)
    .set({ seriesId: parent.id, mediumSeriesId: parent.id, updatedAt: now })
    .where(eq(artwork.seriesId, general.id));

  const members = await db
    .select({ artworkId: artworkSeries.artworkId })
    .from(artworkSeries)
    .where(eq(artworkSeries.seriesId, general.id));
  const memberIds = members.map((row) => row.artworkId);
  if (memberIds.length > 0) {
    await db.update(artwork).set({ mediumSeriesId: parent.id, updatedAt: now }).where(inArray(artwork.id, memberIds));
  }

  await db.delete(artworkSeries).where(eq(artworkSeries.seriesId, general.id));
  await db.delete(seriesHeroSlide).where(eq(seriesHeroSlide.seriesId, general.id));
  await db.delete(series).where(eq(series.id, general.id));
  console.log("Removed General-Oil & Cold Wax. Paintings remain on Oil and Cold Wax.");
}

async function main() {
  await removeGeneralOilColdWaxSeries();
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
