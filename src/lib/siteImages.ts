import fs from "node:fs/promises";
import path from "node:path";
import { artwork, aboutPortrait, homeSlideshow, post, series } from "@/db/schema";
import { getDb } from "@/db";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";

export type SiteImageOption = {
  src: string;
  label: string;
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif)$/i;

/** Paths and blob URLs safe to reuse from admin forms. */
export function isAllowedSiteImage(src: string): boolean {
  const s = src.trim();
  if (!s || s === GALLERY_PLACEHOLDER_IMAGE) return false;
  if (s.startsWith("/uploads/") || s.startsWith("/images/")) return true;
  if (s.startsWith("https://") && IMAGE_EXT.test(s)) return true;
  return false;
}

function addImage(urls: Map<string, string>, src: string | null | undefined, label: string) {
  const s = (src ?? "").trim();
  if (!isAllowedSiteImage(s)) return;
  if (!urls.has(s)) urls.set(s, label);
}

async function walkPublicDir(absDir: string, publicPrefix: string, urls: Map<string, string>) {
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
      await walkPublicDir(abs, `${publicPrefix}/${name}`, urls);
      continue;
    }
    if (!IMAGE_EXT.test(name)) continue;
    addImage(urls, `${publicPrefix}/${name}`, name);
  }
}

/** All distinct images used on the site (database + local public/uploads and public/images). */
export async function listSiteImages(): Promise<SiteImageOption[]> {
  const db = getDb();
  const urls = new Map<string, string>();

  const [seriesRows, artworkRows, postRows, slideRows, portraitRows] = await Promise.all([
    db.select({ image: series.featuredImage, title: series.title }).from(series),
    db.select({ image: artwork.image, title: artwork.title }).from(artwork),
    db.select({ image: post.featuredImage, title: post.title }).from(post),
    db.select({ image: homeSlideshow.image, title: homeSlideshow.title }).from(homeSlideshow),
    db.select({ image: aboutPortrait.image }).from(aboutPortrait),
  ]);

  for (const row of seriesRows) addImage(urls, row.image, `${row.title} — featured`);
  for (const row of artworkRows) addImage(urls, row.image, row.title);
  for (const row of postRows) addImage(urls, row.image, row.title ? `${row.title} — post` : "Post image");
  for (const row of slideRows) {
    addImage(urls, row.image, row.title ? `${row.title} — slideshow` : "Home slideshow");
  }
  for (const row of portraitRows) addImage(urls, row.image, "About portrait");

  const publicRoot = path.join(process.cwd(), "public");
  await walkPublicDir(path.join(publicRoot, "uploads"), "/uploads", urls);
  await walkPublicDir(path.join(publicRoot, "images"), "/images", urls);

  return [...urls.entries()]
    .map(([src, label]) => ({ src, label }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}
