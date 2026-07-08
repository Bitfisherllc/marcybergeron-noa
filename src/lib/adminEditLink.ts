import { eq } from "drizzle-orm";
import { artwork, post, series } from "@/db/schema";
import { getDb } from "@/db";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { artSeriesHref } from "@/lib/routeSlug";

export type AdminEditTarget = {
  href: string;
  label: string;
};

function normalizePath(pathname: string): string {
  return (pathname.split("?")[0] || "/").replace(/\/$/, "") || "/";
}

/** Map a public site path to the best admin screen for editing that page. */
export async function resolveAdminEditTarget(pathname: string): Promise<AdminEditTarget> {
  const path = normalizePath(pathname);

  if (path === "/") return { href: "/admin/home", label: "Edit home page" };
  if (path === "/about") return { href: "/admin/about", label: "Edit about page" };
  if (path === "/art" || path === "/art/all-work" || path === "/medium") {
    return { href: "/admin/series", label: "Edit galleries" };
  }
  if (path === "/news") return { href: "/admin/posts", label: "Edit posts" };
  if (path === "/mailing-list") return { href: "/admin/mailing-list", label: "View mailing list" };

  const artMatch = path.match(/^\/art\/([^/]+)$/);
  if (artMatch) {
    const slug = decodeURIComponent(artMatch[1]!);
    const row = await getDb()
      .select({ id: series.id, title: series.title })
      .from(series)
      .where(eq(series.slug, slug))
      .then((r) => r[0]);
    if (row) return { href: `/admin/series/${row.id}`, label: `Edit “${row.title}”` };
    return { href: "/admin/series", label: "Edit galleries" };
  }

  const newsMatch = path.match(/^\/news\/([^/]+)$/);
  if (newsMatch) {
    const slug = decodeURIComponent(newsMatch[1]!);
    const row = await getDb()
      .select({ id: post.id, title: post.title })
      .from(post)
      .where(eq(post.slug, slug))
      .then((r) => r[0]);
    if (row) return { href: `/admin/posts/${row.id}`, label: `Edit “${row.title}”` };
    return { href: "/admin/posts", label: "Edit posts" };
  }

  return { href: "/admin", label: "Admin menu" };
}

/** Map an admin path to the matching public page (preview while editing). */
export async function resolveLiveViewTarget(pathname: string): Promise<AdminEditTarget> {
  const path = normalizePath(pathname);

  if (path === "/admin" || path === "/admin/home") return { href: "/", label: "View home page" };
  if (path === "/admin/about") return { href: "/about", label: "View about page" };
  if (path === "/admin/series" || path === "/admin/series/new") return { href: "/medium", label: "View portfolio" };
  if (path === "/admin/artworks/new") return { href: "/medium", label: "View portfolio" };
  if (path === "/admin/posts" || path === "/admin/posts/new") return { href: "/news", label: "View news" };
  if (path === "/admin/mailing-list") return { href: "/mailing-list", label: "View signup page" };

  const seriesMatch = path.match(/^\/admin\/series\/([^/]+)$/);
  if (seriesMatch) {
    const id = decodeURIComponent(seriesMatch[1]!);
    const row = await getDb()
      .select({ slug: series.slug, title: series.title })
      .from(series)
      .where(eq(series.id, id))
      .then((r) => r[0]);
    if (row) {
      const href = isMediumGallerySlug(row.slug) ? artSeriesHref(row.slug) : "/medium";
      return { href, label: `View “${row.title}”` };
    }
    return { href: "/medium", label: "View portfolio" };
  }

  const postMatch = path.match(/^\/admin\/posts\/([^/]+)$/);
  if (postMatch) {
    const id = decodeURIComponent(postMatch[1]!);
    const row = await getDb()
      .select({ slug: post.slug, title: post.title })
      .from(post)
      .where(eq(post.id, id))
      .then((r) => r[0]);
    if (row) return { href: `/news/${row.slug}`, label: `View “${row.title}”` };
    return { href: "/news", label: "View news" };
  }

  const artworkMatch = path.match(/^\/admin\/artworks\/([^/]+)$/);
  if (artworkMatch) {
    const id = decodeURIComponent(artworkMatch[1]!);
    const row = await getDb()
      .select({ title: artwork.title, slug: series.slug, seriesTitle: series.title, mediumSeriesId: artwork.mediumSeriesId })
      .from(artwork)
      .innerJoin(series, eq(artwork.seriesId, series.id))
      .where(eq(artwork.id, id))
      .then((r) => r[0]);
    if (row) {
      const href = row.mediumSeriesId ? artSeriesHref(row.slug) : "/medium";
      return { href, label: `View “${row.seriesTitle}”` };
    }
    return { href: "/medium", label: "View portfolio" };
  }

  return { href: "/", label: "View live site" };
}

/** Map the current path to the best “add artwork” admin screen. */
export async function resolveAdminAddArtTarget(pathname: string): Promise<AdminEditTarget> {
  const path = normalizePath(pathname);

  const seriesMatch = path.match(/^\/admin\/series\/([^/]+)$/);
  if (seriesMatch && seriesMatch[1] !== "new") {
    const id = decodeURIComponent(seriesMatch[1]!);
    return { href: `/admin/artworks/new?gallery=${encodeURIComponent(id)}`, label: "Add art" };
  }

  const artMatch = path.match(/^\/art\/([^/]+)$/);
  if (artMatch) {
    const slug = decodeURIComponent(artMatch[1]!);
    const row = await getDb()
      .select({ id: series.id, title: series.title })
      .from(series)
      .where(eq(series.slug, slug))
      .then((r) => r[0]);
    if (row) {
      return { href: `/admin/artworks/new?gallery=${encodeURIComponent(row.id)}`, label: "Add art" };
    }
  }

  return { href: "/admin/artworks/new", label: "Add art" };
}

/** Context-aware bar action: edit on the public site, preview on admin screens. */
export async function resolveAdminBarTarget(pathname: string): Promise<AdminEditTarget> {
  const path = normalizePath(pathname);
  if (path.startsWith("/admin")) return resolveLiveViewTarget(path);
  return resolveAdminEditTarget(path);
}
