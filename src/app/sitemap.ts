import type { MetadataRoute } from "next";
import { listMediumGalleries, listPublishedPosts, listSeriesGalleries } from "@/lib/queries";
import { postPublicHref } from "@/lib/postKind";
import { SERIES_INDEX_HREF } from "@/lib/oilColdWaxSeries";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let galleries: Awaited<ReturnType<typeof listMediumGalleries>> = [];
  let seriesGalleries: Awaited<ReturnType<typeof listSeriesGalleries>> = [];
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  let workshops: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    galleries = await listMediumGalleries();
    seriesGalleries = await listSeriesGalleries();
    posts = await listPublishedPosts("news");
    workshops = await listPublishedPosts("workshop");
  } catch {
    /* Build or deploy without reachable DB — emit static URLs only. */
  }

  return [
    { url: `${SITE_URL}/`, lastModified: new Date() },
    { url: `${SITE_URL}/medium`, lastModified: new Date() },
    { url: `${SITE_URL}${SERIES_INDEX_HREF}`, lastModified: new Date() },
    ...galleries.map((s) => ({
      url: `${SITE_URL}/art/${s.slug}`,
      lastModified: s.updatedAt,
    })),
    ...seriesGalleries.map((s) => ({
      url: `${SITE_URL}/art/${s.slug}`,
      lastModified: s.updatedAt,
    })),
    { url: `${SITE_URL}/about`, lastModified: new Date() },
    { url: `${SITE_URL}/workshops`, lastModified: new Date() },
    ...workshops.map((p) => ({
      url: `${SITE_URL}${postPublicHref("workshop", p.slug)}`,
      lastModified: p.updatedAt,
    })),
    { url: `${SITE_URL}/news`, lastModified: new Date() },
    ...posts.map((p) => ({
      url: `${SITE_URL}${postPublicHref("news", p.slug)}`,
      lastModified: p.updatedAt,
    })),
    { url: `${SITE_URL}/contact`, lastModified: new Date() },
    { url: `${SITE_URL}/directions`, lastModified: new Date() },
    { url: `${SITE_URL}/mailing-list`, lastModified: new Date() },
    { url: `${SITE_URL}/privacy`, lastModified: new Date() },
  ];
}
