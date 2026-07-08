/** Portfolio galleries (formerly “Medium” nav) — order matches primary navigation. */
import type { Series } from "@/db";
import { artSeriesHref } from "@/lib/routeSlug";

export const MEDIUM_GALLERY_SLUGS = [
  "Oil and Cold Wax Medium",
  "Works on Paper",
  "Encaustic",
  "Mixed Medium-Collage",
  "Sculpture",
  "3 Dimensional Works",
] as const;

export type MediumGallerySlug = (typeof MEDIUM_GALLERY_SLUGS)[number];

const mediumSlugSet = new Set<string>(MEDIUM_GALLERY_SLUGS);

export function isMediumGallerySlug(slug: string): boolean {
  return mediumSlugSet.has(slug);
}

/** @deprecated alias — portfolio nav uses medium gallery rows. */
export const isPortfolioGallerySlug = isMediumGallerySlug;

export function portfolioNavDropdownItems(galleries: Series[]): { href: string; label: string }[] {
  return galleries.map((s) => ({ href: artSeriesHref(s.slug), label: s.title }));
}

/** Resolve stored medium assignment, including legacy rows that only used `series_id`. */
export function resolveMediumSeriesId(
  piece: { mediumSeriesId: string | null; seriesId: string },
  portfolioSeries: Pick<Series, "id" | "slug"> | null | undefined,
): string | null {
  if (piece.mediumSeriesId) return piece.mediumSeriesId;
  if (portfolioSeries && isMediumGallerySlug(portfolioSeries.slug) && portfolioSeries.id === piece.seriesId) {
    return piece.seriesId;
  }
  return null;
}
