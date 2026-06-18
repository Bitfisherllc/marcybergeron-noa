import { eq, inArray } from "drizzle-orm";
import { artwork, artworkSeries, series } from "@/db/schema";
import { getDb } from "@/db";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";

export type ResolvedArtworkAssignment = {
  portfolioSeriesIds: string[];
  mediumSeriesId: string | null;
  /** Stored on `artwork.series_id` — primary portfolio, or medium when medium-only. */
  storageSeriesId: string;
  uploadSlug: string;
};

export async function getArtworkPortfolioSeriesIds(artworkId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ seriesId: artworkSeries.seriesId })
    .from(artworkSeries)
    .where(eq(artworkSeries.artworkId, artworkId));
  return rows.map((r) => r.seriesId);
}

/** Portfolio series ids only (excludes medium gallery rows in `artwork_series`). */
export async function getArtworkPortfolioOnlySeriesIds(artworkId: string): Promise<string[]> {
  const ids = await getArtworkPortfolioSeriesIds(artworkId);
  if (ids.length === 0) return [];

  const rows = await getDb()
    .select({ id: series.id, slug: series.slug })
    .from(series)
    .where(inArray(series.id, ids));

  return rows.filter((row) => !isMediumGallerySlug(row.slug)).map((row) => row.id);
}

export async function isArtworkMediumOnly(artworkId: string): Promise<boolean> {
  const row = await getDb()
    .select({ mediumSeriesId: artwork.mediumSeriesId })
    .from(artwork)
    .where(eq(artwork.id, artworkId))
    .then((r) => r[0]);
  if (!row?.mediumSeriesId) return false;
  return (await getArtworkPortfolioOnlySeriesIds(artworkId)).length === 0;
}

export async function resolveArtworkAssignment(
  portfolioSeriesIds: string[],
  mediumSeriesId: string | null,
): Promise<ResolvedArtworkAssignment | null> {
  const portfolios = [...new Set(portfolioSeriesIds)];

  if (portfolios.length > 0) {
    const primary = await getDb()
      .select({ id: series.id, slug: series.slug })
      .from(series)
      .where(eq(series.id, portfolios[0]!))
      .then((r) => r[0]);
    if (!primary || isMediumGallerySlug(primary.slug)) return null;
    return {
      portfolioSeriesIds: portfolios,
      mediumSeriesId,
      storageSeriesId: primary.id,
      uploadSlug: primary.slug,
    };
  }

  if (!mediumSeriesId) return null;

  const medium = await getDb()
    .select({ id: series.id, slug: series.slug })
    .from(series)
    .where(eq(series.id, mediumSeriesId))
    .then((r) => r[0]);
  if (!medium || !isMediumGallerySlug(medium.slug)) return null;

  return {
    portfolioSeriesIds: [],
    mediumSeriesId,
    storageSeriesId: medium.id,
    uploadSlug: medium.slug,
  };
}

export async function setArtworkPortfolioSeriesIds(artworkId: string, seriesIds: string[]): Promise<void> {
  const db = getDb();
  const unique = [...new Set(seriesIds)];
  await db.delete(artworkSeries).where(eq(artworkSeries.artworkId, artworkId));
  if (unique.length === 0) return;
  await db.insert(artworkSeries).values(unique.map((seriesId) => ({ artworkId, seriesId })));
}

/** Read checkbox values; only portfolio (non-medium) series ids are kept. */
export async function parsePortfolioSeriesIdsFromForm(formData: FormData): Promise<string[]> {
  const raw = formData.getAll("seriesIds").map((v) => String(v).trim()).filter(Boolean);
  const unique = [...new Set(raw)];
  if (unique.length === 0) return [];

  const rows = await getDb()
    .select({ id: series.id, slug: series.slug })
    .from(series)
    .where(inArray(series.id, unique));

  return rows.filter((r) => !isMediumGallerySlug(r.slug)).map((r) => r.id);
}
