import { eq } from "drizzle-orm";
import { artwork, artworkSeries, series } from "@/db/schema";
import { getDb } from "@/db";
import { getArtworkPortfolioOnlySeriesIds, setArtworkPortfolioSeriesIds } from "@/lib/artworkMembership";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { getSeriesById } from "@/lib/queries";

export type SeriesDeleteArtworkRef = { id: string; title: string };

export type SeriesDeleteImpact = {
  seriesId: string;
  title: string;
  isMediumGallery: boolean;
  /** Would be permanently deleted unless reassigned (primary `series_id`). */
  primaryArtworks: SeriesDeleteArtworkRef[];
  /** Would only lose this gallery from portfolio checkboxes; remain on site elsewhere. */
  membershipOnlyArtworks: SeriesDeleteArtworkRef[];
  /** Would lose medium listing when deleting a medium gallery (`medium_series_id`). */
  mediumAssignments: SeriesDeleteArtworkRef[];
  /** True when every at-risk primary painting belongs to at least one other portfolio. */
  canReassignPrimaryToMediumOnly: boolean;
};

function uniqueArtworks(rows: SeriesDeleteArtworkRef[]): SeriesDeleteArtworkRef[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

async function artworkHasOtherPortfolio(artworkId: string, excludeSeriesId: string): Promise<boolean> {
  const portfolioIds = (await getArtworkPortfolioOnlySeriesIds(artworkId)).filter((id) => id !== excludeSeriesId);
  return portfolioIds.length > 0;
}

export async function getSeriesDeleteImpact(seriesId: string): Promise<SeriesDeleteImpact | null> {
  const ser = await getSeriesById(seriesId);
  if (!ser) return null;

  const db = getDb();
  const isMediumGallery = isMediumGallerySlug(ser.slug);

  const primaryRows = await db
    .select({ id: artwork.id, title: artwork.title })
    .from(artwork)
    .where(eq(artwork.seriesId, seriesId));

  const membershipRows = await db
    .select({ id: artwork.id, title: artwork.title, seriesId: artwork.seriesId })
    .from(artwork)
    .innerJoin(artworkSeries, eq(artworkSeries.artworkId, artwork.id))
    .where(eq(artworkSeries.seriesId, seriesId));

  const membershipOnlyArtworks = uniqueArtworks(
    membershipRows.filter((row) => row.seriesId !== seriesId).map(({ id, title }) => ({ id, title })),
  );

  const mediumRows = isMediumGallery
    ? await db
        .select({ id: artwork.id, title: artwork.title })
        .from(artwork)
        .where(eq(artwork.mediumSeriesId, seriesId))
    : [];

  const primaryIds = new Set(primaryRows.map((row) => row.id));
  const mediumAssignments = uniqueArtworks(
    mediumRows.filter((row) => !primaryIds.has(row.id)).map(({ id, title }) => ({ id, title })),
  );

  const primaryArtworks = primaryRows.map(({ id, title }) => ({ id, title }));
  const canReassignPrimaryToMediumOnly = isMediumGallery
    ? true
    : primaryArtworks.length === 0 ||
      (await Promise.all(primaryArtworks.map((piece) => artworkHasOtherPortfolio(piece.id, seriesId)))).every(Boolean);

  return {
    seriesId,
    title: ser.title,
    isMediumGallery,
    primaryArtworks,
    membershipOnlyArtworks,
    mediumAssignments,
    canReassignPrimaryToMediumOnly,
  };
}

export type SeriesDeleteReassignType = "portfolio" | "medium" | "none";

export async function reassignArtworksBeforeSeriesDelete(
  deletedSeriesId: string,
  reassignType: SeriesDeleteReassignType,
  targetId: string | null,
): Promise<void> {
  const impact = await getSeriesDeleteImpact(deletedSeriesId);
  if (!impact) throw new Error("Gallery not found");

  const db = getDb();
  const t = new Date();

  if (impact.primaryArtworks.length > 0) {
    if (reassignType === "none" || !targetId) {
      throw new Error("Reassignment required before deleting this gallery.");
    }
    if (reassignType === "medium" && !impact.canReassignPrimaryToMediumOnly) {
      throw new Error("These paintings need another portfolio before they can be reassigned to a medium only.");
    }

    const target = await getSeriesById(targetId);
    if (!target) throw new Error("Reassignment target not found.");

    if (reassignType === "portfolio") {
      if (isMediumGallerySlug(target.slug)) throw new Error("Choose a portfolio gallery, not a medium gallery.");
    } else if (!isMediumGallerySlug(target.slug)) {
      throw new Error("Choose a medium gallery.");
    }

    for (const piece of impact.primaryArtworks) {
      const portfolioIds = (await getArtworkPortfolioOnlySeriesIds(piece.id)).filter((id) => id !== deletedSeriesId);

      if (reassignType === "portfolio") {
        const nextPortfolioIds = [...new Set([...portfolioIds, targetId])];
        await db
          .update(artwork)
          .set({ seriesId: targetId, updatedAt: t })
          .where(eq(artwork.id, piece.id));
        await setArtworkPortfolioSeriesIds(piece.id, nextPortfolioIds);
      } else if (portfolioIds.length === 0) {
        await db
          .update(artwork)
          .set({ seriesId: targetId, mediumSeriesId: targetId, updatedAt: t })
          .where(eq(artwork.id, piece.id));
      } else {
        const fallbackPortfolioId = portfolioIds[0]!;
        await db
          .update(artwork)
          .set({ seriesId: fallbackPortfolioId, mediumSeriesId: targetId, updatedAt: t })
          .where(eq(artwork.id, piece.id));
        await setArtworkPortfolioSeriesIds(piece.id, portfolioIds);
      }
    }
  } else if (
    impact.isMediumGallery &&
    impact.mediumAssignments.length > 0 &&
    reassignType === "medium" &&
    targetId
  ) {
    const target = await getSeriesById(targetId);
    if (!target || !isMediumGallerySlug(target.slug)) throw new Error("Choose a medium gallery.");

    await db
      .update(artwork)
      .set({ mediumSeriesId: targetId, updatedAt: t })
      .where(eq(artwork.mediumSeriesId, deletedSeriesId));
  }
}
