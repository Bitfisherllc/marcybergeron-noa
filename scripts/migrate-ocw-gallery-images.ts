/**
 * Oil and Cold Wax gallery lists paintings via medium_series_id.
 * General (non-series) works come first. Then the same paintings that live on
 * the Series pages, in this order: Mexico as Muse, Born in France, Standing Tall As Trees.
 * Series membership is unchanged — these are the same records, not copies.
 * Safe to run multiple times.
 */
import { asc, eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { artwork, artworkSeries, series } from "@/db/schema";
import {
  OIL_COLD_WAX_GALLERY_SERIES_ORDER,
  OIL_COLD_WAX_PARENT_SLUG,
} from "@/lib/oilColdWaxSeries";

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

  const childRows = await db
    .select({ id: series.id, slug: series.slug })
    .from(series)
    .where(inArray(series.slug, [...OIL_COLD_WAX_GALLERY_SERIES_ORDER]));
  const childBySlug = new Map(childRows.map((row) => [row.slug, row.id]));
  const childIds = childRows.map((row) => row.id);

  const seriesMembers =
    childIds.length > 0
      ? await db
          .select({ artworkId: artworkSeries.artworkId, seriesId: artworkSeries.seriesId })
          .from(artworkSeries)
          .where(inArray(artworkSeries.seriesId, childIds))
      : [];
  const seriesArtworkIds = new Set(seriesMembers.map((row) => row.artworkId));

  const ocwPieces = await db
    .select({
      id: artwork.id,
      title: artwork.title,
      sortOrder: artwork.sortOrder,
      mediumSeriesId: artwork.mediumSeriesId,
    })
    .from(artwork)
    .where(eq(artwork.mediumSeriesId, parent.id))
    .orderBy(asc(artwork.sortOrder), asc(artwork.title));

  const general = ocwPieces
    .filter((piece) => !seriesArtworkIds.has(piece.id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

  const ordered: { id: string; title: string; sortOrder: number; mediumSeriesId: string | null }[] = [...general];
  const seen = new Set(ordered.map((piece) => piece.id));

  for (const slug of OIL_COLD_WAX_GALLERY_SERIES_ORDER) {
    const seriesId = childBySlug.get(slug);
    if (!seriesId) continue;
    const members = await db
      .select({
        id: artwork.id,
        title: artwork.title,
        sortOrder: artwork.sortOrder,
        mediumSeriesId: artwork.mediumSeriesId,
      })
      .from(artwork)
      .innerJoin(artworkSeries, eq(artworkSeries.artworkId, artwork.id))
      .where(eq(artworkSeries.seriesId, seriesId))
      .orderBy(asc(artwork.sortOrder), asc(artwork.title));
    for (const piece of members) {
      if (seen.has(piece.id)) continue;
      seen.add(piece.id);
      ordered.push(piece);
    }
  }

  const now = new Date();
  let sortOrder = 100;
  let updated = 0;
  for (const piece of ordered) {
    if (piece.mediumSeriesId !== parent.id || piece.sortOrder !== sortOrder) {
      await db
        .update(artwork)
        .set({ mediumSeriesId: parent.id, sortOrder, updatedAt: now })
        .where(eq(artwork.id, piece.id));
      updated += 1;
    }
    sortOrder += 100;
  }

  console.log(
    `Oil and Cold Wax gallery: ${general.length} general + ${ordered.length - general.length} series works (${updated} updated).`,
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
