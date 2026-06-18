import type { Series } from "@/db";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { isPublicPortfolioSeries } from "@/lib/privateGalleries";
import { artSeriesHref } from "@/lib/routeSlug";

export const ALL_WORK_SLUG = "all-work";
export const ALL_WORK_TITLE = "All Work";
export const ALL_WORK_HREF = `/art/${ALL_WORK_SLUG}`;
export const ALL_WORK_EXCERPT =
  "Every painting across the portfolio—browse the full archive in one place.";

export function isAllWorkSlug(slug: string): boolean {
  return slug === ALL_WORK_SLUG;
}

/** Portfolio nav and cards: thematic series only (excludes medium galleries). */
export function seriesForPortfolioNav(series: Series[]): Series[] {
  const thematic = series.filter((s) => isPublicPortfolioSeries(s));
  const nw = thematic.find((s) => s.slug === "new-work");
  const rest = thematic
    .filter((s) => s.slug !== "new-work")
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  return nw ? [nw, ...rest] : rest;
}

/** Portfolio dropdown: New Work, All Work, then remaining series A–Z. */
export function portfolioDropdownItems(series: Series[]): { href: string; label: string }[] {
  const thematic = seriesForPortfolioNav(series);
  const newWork = thematic.find((s) => s.slug === "new-work");
  const rest = thematic.filter((s) => s.slug !== "new-work");

  const items: { href: string; label: string }[] = [];
  if (newWork) {
    items.push({ href: artSeriesHref(newWork.slug), label: newWork.title });
  }
  items.push({ href: ALL_WORK_HREF, label: ALL_WORK_TITLE });
  for (const s of rest) {
    items.push({ href: artSeriesHref(s.slug), label: s.title });
  }
  return items;
}
