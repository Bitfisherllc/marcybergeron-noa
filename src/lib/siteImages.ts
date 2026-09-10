import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { artwork, artworkSeries, aboutPortrait, homeSlideshow, post, postGalleryImage, series, seriesHeroSlide } from "@/db/schema";
import { getDb } from "@/db";
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

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif)$/i;

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

function galleryFromUploadFolder(folderName: string): string | undefined {
  if (folderName === "the-studio") return STUDIO_GALLERY_SLUG;
  return undefined;
}

async function walkPublicDir(
  absDir: string,
  publicPrefix: string,
  urls: Map<string, ImageEntry>,
  gallery?: string,
) {
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const name = String(entry.name);
    const abs = path.join(absDir, name);
    if (entry.isDirectory()) {
      const nextGallery = gallery ?? galleryFromUploadFolder(name);
      await walkPublicDir(abs, `${publicPrefix}/${name}`, urls, nextGallery);
      continue;
    }
    if (!IMAGE_EXT.test(name)) continue;
    addImage(urls, `${publicPrefix}/${name}`, gallery ? `${name} — ${gallery}` : name, gallery);
  }
}

/** All distinct images used on the site (database + local public/uploads and public/images). */
export async function listSiteImages(): Promise<SiteImageOption[]> {
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

  const publicRoot = path.join(process.cwd(), "public");
  await walkPublicDir(path.join(publicRoot, "uploads"), "/uploads", urls);
  await walkPublicDir(path.join(publicRoot, "images"), "/images", urls);

  return [...urls.entries()]
    .map(([src, entry]) => ({
      src,
      label: entry.label,
      galleries: [...entry.galleries],
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}
