import { nanoid } from "nanoid";
import type { Series } from "@/db";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { isAllWorkSlug } from "@/lib/portfolioGalleries";
import { SITE_URL } from "@/lib/site";

export function isPrivateGallery(series: Pick<Series, "isPrivate">): boolean {
  return series.isPrivate;
}

/** Portfolio series shown on the public site (excludes medium, all-work, and private). */
export function isPublicPortfolioSeries(series: Pick<Series, "slug" | "isPrivate">): boolean {
  return !isMediumGallerySlug(series.slug) && !isAllWorkSlug(series.slug) && !series.isPrivate;
}

export function generatePrivateGalleryAccessToken(): string {
  return nanoid(24);
}

export function privateGalleryHref(accessToken: string): string {
  return `/private/${accessToken}`;
}

export function privateGalleryAbsoluteUrl(accessToken: string): string {
  return `${SITE_URL}${privateGalleryHref(accessToken)}`;
}
