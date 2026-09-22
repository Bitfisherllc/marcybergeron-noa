import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { artwork, artworkSeries, aboutPortrait, homeSlideshow, post, postGalleryImage, series, seriesHeroSlide, siteFavicon } from "@/db/schema";
import { getDb } from "@/db";
import { CACHE_TAGS, SITE_REVALIDATE_SECONDS } from "@/lib/cacheConfig";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import { isMediumGallerySlug, STUDIO_GALLERY_SLUG } from "@/lib/mediumGalleries";

function filterGalleryName(slug: string | null | undefined, title: string | null | undefined): string | undefined {
  if (!slug || !isMediumGallerySlug(slug)) return undefined;
  return slug === STUDIO_GALLERY_SLUG ? STUDIO_GALLERY_SLUG : (title || slug);
}

export type SiteImageOption = {
  src: string;
  label: string;
  galleries: string[];
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif|ico)$/i;

type ImageEntry = { label: string; galleries: Set<string> };

/** Paths and blob URLs safe to reuse from admin forms. */
export function isAllowedSiteImage(src: string): boolean {
  const s = src.trim();
  if (!s || s === GALLERY_PLACEHOLDER_IMAGE) return false;
  if (s.startsWith("/uploads/") || s.startsWith("/images/")) return true;
  if (s.startsWith("https://") && IMAGE_EXT.test(s)) return true;
  return false;
}

function addImage(urls: Map<string, ImageEntry>, src: string | null | undefined, label: string, gallery?: string) {
  const s = (src ?? "").trim();
  if (!isAllowedSiteImage(s)) return;
  const existing = urls.get(s);
  if (!existing) {
    urls.set(s, { label, galleries: new Set(gallery ? [gallery] : []) });
    return;
  }
  if (gallery) existing.galleries.add(gallery);
  if (label.length > existing.label.length) existing.label = label;
}

/** Distinct images already used on the site (from the database). */
async function listSiteImagesUncached(): Promise<SiteImageOption[]> {
  const db = getDb();
  const urls = new Map<string, ImageEntry>();

  const [
    seriesRows,
    artworkMediumRows,
    artworkMembershipRows,
    postRows,
    postGalleryRows,
    slideRows,
    portraitRows,
    galleryHeroRows,
    faviconRows,
  ] = await Promise.all([
    db.select({ image: series.featuredImage, title: series.title, slug: series.slug }).from(series),
    db
      .select({
        image: artwork.image,
        title: artwork.title,
        gallery: series.title,
        gallerySlug: series.slug,
      })
      .from(artwork)
      .leftJoin(series, eq(artwork.mediumSeriesId, series.id)),
    db
      .select({
        image: artwork.image,
        title: artwork.title,
        gallery: series.title,
        gallerySlug: series.slug,
      })
      .from(artwork)
      .innerJoin(artworkSeries, eq(artworkSeries.artworkId, artwork.id))
      .innerJoin(series, eq(artworkSeries.seriesId, series.id)),
    db.select({ image: post.featuredImage, title: post.title }).from(post),
    db.select({ image: postGalleryImage.image, caption: postGalleryImage.caption }).from(postGalleryImage),
    db.select({ image: homeSlideshow.image, title: homeSlideshow.title }).from(homeSlideshow),
    db.select({ image: aboutPortrait.image }).from(aboutPortrait),
    db.select({ image: seriesHeroSlide.image }).from(seriesHeroSlide),
    db.select({ image: siteFavicon.image }).from(siteFavicon),
  ]);

  for (const row of seriesRows) {
    addImage(urls, row.image, `${row.title} — featured`, filterGalleryName(row.slug, row.title));
  }
  for (const row of artworkMediumRows) {
    const gallery = filterGalleryName(row.gallerySlug, row.gallery);
    addImage(urls, row.image, gallery ? `${row.title} — ${gallery}` : row.title, gallery);
  }
  for (const row of artworkMembershipRows) {
    const gallery = filterGalleryName(row.gallerySlug, row.gallery);
    addImage(urls, row.image, gallery ? `${row.title} — ${gallery}` : `${row.title} — ${row.gallery}`, gallery);
  }
  for (const row of postRows) addImage(urls, row.image, row.title ? `${row.title} — post` : "Post image");
  for (const row of postGalleryRows) {
    addImage(urls, row.image, row.caption ? `${row.caption} — post gallery` : "Post gallery");
  }
  for (const row of slideRows) {
    addImage(urls, row.image, row.title ? `${row.title} — slideshow` : "Home slideshow");
  }
  for (const row of portraitRows) addImage(urls, row.image, "About portrait");
  for (const row of galleryHeroRows) addImage(urls, row.image, "Gallery slideshow");
  for (const row of faviconRows) addImage(urls, row.image, "Site icon");

  // Skip walking public/uploads on network volumes — that directory is huge and already
  // represented by the database rows above. Local leftover files are still uploadable.

  return [...urls.entries()]
    .map(([src, entry]) => ({
      src,
      label: entry.label,
      galleries: [...entry.galleries],
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

export const listSiteImages = unstable_cache(listSiteImagesUncached, ["site-images", "v2"], {
  revalidate: SITE_REVALIDATE_SECONDS,
  tags: [CACHE_TAGS.artwork, CACHE_TAGS.series, CACHE_TAGS.posts, CACHE_TAGS.home, CACHE_TAGS.site],
});
