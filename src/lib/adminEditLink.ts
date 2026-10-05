import { eq } from "drizzle-orm";
import { artwork, post, series } from "@/db/schema";
import { getDb } from "@/db";
import { normalizeAdminPath, resolveLiveViewTargetSync, type AdminEditTarget } from "@/lib/adminEditTarget";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { postPublicHref } from "@/lib/postKind";
import { artSeriesHref } from "@/lib/routeSlug";

export type { AdminEditTarget } from "@/lib/adminEditTarget";
export { resolveLiveViewTargetSync } from "@/lib/adminEditTarget";

function normalizePath(pathname: string): string {
  return normalizeAdminPath(pathname);
}

/** Map a public site path to the best admin screen for editing that page. */
export async function resolveAdminEditTarget(pathname: string): Promise<AdminEditTarget> {
  const path = normalizePath(pathname);

  if (path === "/") return { href: "/admin/home", label: "Edit home page" };
  if (path === "/about") return { href: "/admin/about", label: "Edit about page" };
  if (path === "/art" || path === "/art/all-work" || path === "/medium" || path === "/series") {
    return { href: "/admin/series", label: "Edit galleries" };
  }
  if (path === "/news") return { href: "/admin/posts", label: "Edit posts" };
  if (path === "/workshops") return { href: "/admin/workshops", label: "Edit workshops" };
  if (path === "/mailing-list") return { href: "/admin/mailing-list", label: "View mailing list" };
  if (path === "/contact" || path === "/directions") return { href: "/admin/contact-page", label: "Edit contact page" };

  const workshopInterestMatch = path.match(/^\/workshops\/([^/]+)\/interest$/);
  if (workshopInterestMatch) {
    const slug = decodeURIComponent(workshopInterestMatch[1]!);
    const row = await getDb()
      .select({ id: post.id, title: post.title })
      .from(post)
      .where(eq(post.slug, slug))
      .then((r) => r[0]);
    if (row) return { href: `/admin/workshops/${row.id}`, label: `Edit “${row.title}”` };
    return { href: "/admin/workshops", label: "Edit workshops" };
  }

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

  const workshopMatch = path.match(/^\/workshops\/([^/]+)$/);
  if (workshopMatch) {
    const slug = decodeURIComponent(workshopMatch[1]!);
    const row = await getDb()
      .select({ id: post.id, title: post.title })
      .from(post)
      .where(eq(post.slug, slug))
      .then((r) => r[0]);
    if (row) return { href: `/admin/workshops/${row.id}`, label: `Edit “${row.title}”` };
    return { href: "/admin/workshops", label: "Edit workshops" };
  }

  return { href: "/admin", label: "Admin menu" };
}

/** Map an admin path to the matching public page (preview while editing). */
export async function resolveLiveViewTarget(pathname: string): Promise<AdminEditTarget> {
  const path = normalizePath(pathname);
  const sync = resolveLiveViewTargetSync(path);
  if (sync) return sync;

  const seriesMatch = path.match(/^\/admin\/series\/([^/]+)$/);
  if (seriesMatch) {
    const id = decodeURIComponent(seriesMatch[1]!);
    const row = await getDb()
      .select({ slug: series.slug, title: series.title, parentSeriesId: series.parentSeriesId })
      .from(series)
      .where(eq(series.id, id))
      .then((r) => r[0]);
    if (row) {
      const href =
        isMediumGallerySlug(row.slug) || row.parentSeriesId
          ? artSeriesHref(row.slug)
          : "/medium";
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
    if (row) return { href: postPublicHref("news", row.slug), label: `View “${row.title}”` };
    return { href: "/news", label: "View news" };
  }

  const workshopAdminMatch = path.match(/^\/admin\/workshops\/([^/]+)$/);
  if (workshopAdminMatch) {
    const id = decodeURIComponent(workshopAdminMatch[1]!);
    const row = await getDb()
      .select({ slug: post.slug, title: post.title })
      .from(post)
      .where(eq(post.id, id))
      .then((r) => r[0]);
    if (row) return { href: postPublicHref("workshop", row.slug), label: `View “${row.title}”` };
    return { href: "/workshops", label: "View workshops" };
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

/** Context-aware bar action: edit on the public site, preview on admin screens. */
export async function resolveAdminBarTarget(pathname: string): Promise<AdminEditTarget> {
  const path = normalizePath(pathname);
  if (path.startsWith("/admin")) return resolveLiveViewTarget(path);
  return resolveAdminEditTarget(path);
}
