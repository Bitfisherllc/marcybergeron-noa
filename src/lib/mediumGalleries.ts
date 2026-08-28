/** Portfolio galleries — slug matches the public name and URL (`/art/[slug]`). */
import type { Series } from "@/db";
import { artSeriesHref } from "@/lib/routeSlug";

export const MEDIUM_GALLERY_SLUGS = [
  "Oil and Cold Wax",
  "Encaustic Paintings on Panel",
  "Wax Based Collage on Panel",
  "Encaustic Monotypes",
  "Sculpture",
  "The Studio",
] as const;

export type MediumGallerySlug = (typeof MEDIUM_GALLERY_SLUGS)[number];

/** Old slugs → current portfolio URL slug (permanent redirects). */
export const LEGACY_MEDIUM_GALLERY_SLUG_REDIRECTS: Record<string, MediumGallerySlug> = {
  "Oil and Cold Wax Medium": "Oil and Cold Wax",
  "Works on Paper": "Encaustic Paintings on Panel",
  Encaustic: "Encaustic Monotypes",
};

/** Folder names under `import/` for bulk uploads. */
export const MEDIUM_GALLERY_IMPORT_FOLDERS: Record<MediumGallerySlug, string> = {
  "Oil and Cold Wax": "oil-and-cold-wax",
  "Encaustic Paintings on Panel": "encaustic-paintings-on-panel",
  "Wax Based Collage on Panel": "wax-based-collage-on-panel",
  "Encaustic Monotypes": "encaustic-monotypes",
  Sculpture: "sculpture",
  "The Studio": "the-studio",
};

export function mediumGalleryImportFolder(slug: MediumGallerySlug): string {
  return MEDIUM_GALLERY_IMPORT_FOLDERS[slug];
}

export function mediumGalleryUploadFolder(slug: string): string | null {
  if (isMediumGallerySlug(slug)) return MEDIUM_GALLERY_IMPORT_FOLDERS[slug];
  return null;
}

export function legacyMediumGalleryRedirect(slug: string): MediumGallerySlug | null {
  return LEGACY_MEDIUM_GALLERY_SLUG_REDIRECTS[slug] ?? null;
}

/** If the canonical slug was renamed in the DB, find the row under the old slug (or vice versa). */
export function legacySlugForCanonical(slug: string): string | undefined {
  for (const [legacy, canonical] of Object.entries(LEGACY_MEDIUM_GALLERY_SLUG_REDIRECTS)) {
    if (canonical === slug) return legacy;
  }
  return undefined;
}

export function resolveMediumGalleryRow(
  slug: MediumGallerySlug,
  bySlug: Map<string, Series>,
): Series | undefined {
  const direct = bySlug.get(slug);
  if (direct) return direct;
  const renamed = LEGACY_MEDIUM_GALLERY_SLUG_REDIRECTS[slug];
  if (renamed) {
    const row = bySlug.get(renamed);
    if (row) return row;
  }
  const legacy = legacySlugForCanonical(slug);
  if (legacy) return bySlug.get(legacy);
  return undefined;
}

export function mediumGalleryTitle(series: Pick<Series, "slug" | "title">): string {
  if (!isMediumGallerySlug(series.slug)) return series.title;
  return series.title;
}

export function withMediumGalleryTitle<T extends Series>(series: T): T {
  return series;
}

const mediumSlugSet = new Set<string>(MEDIUM_GALLERY_SLUGS);

export function isMediumGallerySlug(slug: string): slug is MediumGallerySlug {
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
  const seriesSlug = portfolioSeries?.slug;
  if (
    portfolioSeries &&
    seriesSlug &&
    (isMediumGallerySlug(seriesSlug) || legacyMediumGalleryRedirect(seriesSlug)) &&
    portfolioSeries.id === piece.seriesId
  ) {
    return piece.seriesId;
  }
  return null;
}
