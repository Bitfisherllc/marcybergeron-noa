/** Thematic series shown under the Series tab (formerly nested under Oil and Cold Wax). */
import { artSeriesHref } from "@/lib/routeSlug";

export const OIL_COLD_WAX_PARENT_SLUG = "Oil and Cold Wax" as const;
export const GENERAL_OIL_COLD_WAX_SLUG = "general-oil-and-cold-wax" as const;
export const SERIES_INDEX_HREF = "/series";

export const OIL_COLD_WAX_CHILDREN = [
  {
    slug: "standing-tall-as-trees",
    title: "Standing Tall As Trees",
    uploadFolder: "standing-tall-as-trees",
    sortOrder: 1,
  },
  {
    slug: "born-in-france",
    title: "Born in France",
    uploadFolder: "born-in-france",
    sortOrder: 2,
  },
  {
    slug: "mexico-as-muse",
    title: "Mexico as Muse",
    uploadFolder: "mexico-as-muse",
    sortOrder: 3,
  },
  {
    slug: "general-oil-and-cold-wax",
    title: "General-Oil & Cold Wax",
    uploadFolder: "general-oil-and-cold-wax",
    sortOrder: 4,
  },
] as const;

export type OilColdWaxChildSlug = (typeof OIL_COLD_WAX_CHILDREN)[number]["slug"];

export const OIL_COLD_WAX_CHILD_SLUGS: readonly OilColdWaxChildSlug[] = OIL_COLD_WAX_CHILDREN.map(
  (c) => c.slug,
);

const childSlugSet = new Set<string>(OIL_COLD_WAX_CHILD_SLUGS);

export function isOilColdWaxParentSlug(slug: string): boolean {
  return slug === OIL_COLD_WAX_PARENT_SLUG;
}

export function isOilColdWaxChildSlug(slug: string): slug is OilColdWaxChildSlug {
  return childSlugSet.has(slug);
}

export const isSeriesGallerySlug = isOilColdWaxChildSlug;

export function isGeneralOilColdWaxSlug(slug: string): boolean {
  return slug === GENERAL_OIL_COLD_WAX_SLUG;
}

export function oilColdWaxChildUploadFolder(slug: string): string | null {
  const row = OIL_COLD_WAX_CHILDREN.find((c) => c.slug === slug);
  return row?.uploadFolder ?? null;
}

export function oilColdWaxChildTitle(slug: string): string | null {
  const row = OIL_COLD_WAX_CHILDREN.find((c) => c.slug === slug);
  return row?.title ?? null;
}

export function seriesNavDropdownItems(galleries: { slug: string; title: string }[]): { href: string; label: string }[] {
  return galleries.map((s) => ({ href: artSeriesHref(s.slug), label: s.title }));
}
