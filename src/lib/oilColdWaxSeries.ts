/**
 * The original Oil and Cold Wax series, used by import and migration scripts.
 * Which medium a series belongs to at runtime comes from `series.parent_series_id`.
 */
import { artSeriesHref } from "@/lib/routeSlug";

export const OIL_COLD_WAX_PARENT_SLUG = "Oil and Cold Wax" as const;
/** Retired series; old URLs redirect to the Oil and Cold Wax portfolio gallery. */
export const GENERAL_OIL_COLD_WAX_SLUG = "general-oil-and-cold-wax" as const;
/** Series live on the Oil and Cold Wax portfolio page. `/series` redirects here. */
export const SERIES_INDEX_HREF = artSeriesHref(OIL_COLD_WAX_PARENT_SLUG);

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
] as const;

export type OilColdWaxChildSlug = (typeof OIL_COLD_WAX_CHILDREN)[number]["slug"];

export const OIL_COLD_WAX_CHILD_SLUGS: readonly OilColdWaxChildSlug[] = OIL_COLD_WAX_CHILDREN.map(
  (c) => c.slug,
);

/** After general Oil and Cold Wax gallery works, append these series in this order. */
export const OIL_COLD_WAX_GALLERY_SERIES_ORDER = [
  "mexico-as-muse",
  "born-in-france",
  "standing-tall-as-trees",
] as const satisfies readonly OilColdWaxChildSlug[];

const childSlugSet = new Set<string>(OIL_COLD_WAX_CHILD_SLUGS);

export function isOilColdWaxParentSlug(slug: string): boolean {
  return slug === OIL_COLD_WAX_PARENT_SLUG;
}

export function isOilColdWaxChildSlug(slug: string): slug is OilColdWaxChildSlug {
  return childSlugSet.has(slug);
}

export function isGeneralOilColdWaxSlug(slug: string): boolean {
  return slug === GENERAL_OIL_COLD_WAX_SLUG || slug === "General-Oil & Cold Wax";
}

/** Old General-Oil & Cold Wax URLs → Oil and Cold Wax portfolio gallery. */
export function retiredSeriesRedirect(slug: string): string | null {
  return isGeneralOilColdWaxSlug(slug) ? OIL_COLD_WAX_PARENT_SLUG : null;
}

export function oilColdWaxChildUploadFolder(slug: string): string | null {
  const row = OIL_COLD_WAX_CHILDREN.find((c) => c.slug === slug);
  return row?.uploadFolder ?? null;
}
