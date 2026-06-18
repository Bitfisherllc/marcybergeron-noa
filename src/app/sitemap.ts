import type { MetadataRoute } from "next";
import { listPublishedPosts, listSeries } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let series: Awaited<ReturnType<typeof listSeries>> = [];
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    series = await listSeries();
    posts = await listPublishedPosts();
  } catch {
    /* Build or deploy without reachable DB — emit static URLs only. */
  }

  return [
    { url: `${SITE_URL}/`, lastModified: new Date() },
    { url: `${SITE_URL}/art`, lastModified: new Date() },
    { url: `${SITE_URL}/art/all-work`, lastModified: new Date() },
    { url: `${SITE_URL}/medium`, lastModified: new Date() },
    ...series
      .filter((s) => !s.isPrivate)
      .map((s) => ({
      url: `${SITE_URL}/art/${s.slug}`,
      lastModified: s.updatedAt,
    })),
    { url: `${SITE_URL}/about`, lastModified: new Date() },
    { url: `${SITE_URL}/news`, lastModified: new Date() },
    ...posts.map((p) => ({
      url: `${SITE_URL}/news/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    { url: `${SITE_URL}/contact`, lastModified: new Date() },
    { url: `${SITE_URL}/directions`, lastModified: new Date() },
    { url: `${SITE_URL}/mailing-list`, lastModified: new Date() },
  ];
}
