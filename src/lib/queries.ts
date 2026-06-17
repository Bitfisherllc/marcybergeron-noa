import { asc, desc, eq } from "drizzle-orm";
import type { Artwork, Series } from "@/db";
import { artwork, contactMessage, mailingListSignup, post, series } from "@/db/schema";
import { getDb } from "@/db";
import { toHeroSlide, type HeroSlide } from "@/lib/heroSlides";

export async function listSeries() {
  return getDb().select().from(series).orderBy(asc(series.sortOrder), asc(series.title));
}

export async function getSeriesById(id: string) {
  const rows = await getDb().select().from(series).where(eq(series.id, id));
  return rows[0] ?? null;
}

export async function getSeriesBySlug(slug: string) {
  const rows = await getDb().select().from(series).where(eq(series.slug, slug));
  return rows[0] ?? null;
}

export async function listArtworksForSeries(seriesId: string) {
  return getDb()
    .select()
    .from(artwork)
    .where(eq(artwork.seriesId, seriesId))
    .orderBy(asc(artwork.sortOrder), asc(artwork.title));
}

export async function getArtwork(id: string) {
  const rows = await getDb().select().from(artwork).where(eq(artwork.id, id));
  return rows[0] ?? null;
}

export async function getSeriesNeighbors(slug: string) {
  const all = await listSeries();
  const idx = all.findIndex((s) => s.slug === slug);
  if (idx === -1) return { prev: null as null | (typeof all)[number], next: null as null | (typeof all)[number] };
  return {
    prev: idx > 0 ? all[idx - 1]! : null,
    next: idx < all.length - 1 ? all[idx + 1]! : null,
  };
}

export async function featuredHomePieces(): Promise<{ series: Series; piece: Artwork }[]> {
  const sers = await listSeries();
  const out: { series: Series; piece: Artwork }[] = [];
  for (const s of sers) {
    const arts = await listArtworksForSeries(s.id);
    const first = arts[0];
    if (first) out.push({ series: s, piece: first });
  }
  return out;
}

/** Unique images for the home hero slideshow (featured + first-in-series works). */
export async function heroHomeSlides(): Promise<HeroSlide[]> {
  const seen = new Set<string>();
  const out: HeroSlide[] = [];

  const push = (src: string, title: string, subtitle = "") => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push(toHeroSlide(src, title, subtitle));
  };

  const wf = await getSeriesBySlug("wayfinding");
  if (wf?.featuredImage) {
    push(wf.featuredImage, "Wayfinding", "Featured series");
  }

  const sers = await listSeries();
  for (const s of sers) {
    push(s.featuredImage, s.title, "Featured artwork");
  }

  const picks = await featuredHomePieces();
  for (const { series: s, piece } of picks) {
    const subtitle = [piece.medium, piece.size, piece.year].filter(Boolean).join(" · ");
    push(piece.image, piece.title, subtitle || s.title);
    if (out.length >= 7) break;
  }

  return out.slice(0, 7);
}

export async function listPublishedPosts() {
  return getDb()
    .select()
    .from(post)
    .where(eq(post.published, true))
    .orderBy(desc(post.updatedAt));
}

/** Next post in journal order (same sequence as `/news`): newer posts first, so "next" is the following row. */
export async function getPublishedPostNext(slug: string) {
  const posts = await listPublishedPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1 || idx >= posts.length - 1) return null;
  return posts[idx + 1]!;
}

export async function getPostBySlug(slug: string) {
  const rows = await getDb().select().from(post).where(eq(post.slug, slug));
  return rows[0] ?? null;
}

export async function listAllPostsAdmin() {
  return getDb().select().from(post).orderBy(desc(post.updatedAt));
}

export async function listMailingListSignups() {
  return getDb().select().from(mailingListSignup).orderBy(desc(mailingListSignup.createdAt));
}

export async function listContactMessages() {
  return getDb().select().from(contactMessage).orderBy(desc(contactMessage.createdAt));
}

/** Admin home picker: artworks with series title for labels. */
export async function listArtworksWithSeriesForPicker() {
  const rows = await getDb()
    .select({ piece: artwork, ser: series })
    .from(artwork)
    .innerJoin(series, eq(artwork.seriesId, series.id))
    .orderBy(asc(series.sortOrder), asc(series.title), asc(artwork.sortOrder), asc(artwork.title));
  return rows.map(({ piece, ser }) => ({
    id: piece.id,
    label: `${piece.title} — ${ser.title}`,
    image: piece.image,
    alt: piece.alt,
  }));
}

/** Series list for admin with artwork counts per gallery. */
export async function listSeriesAdminOverview() {
  const rows = await listSeries();
  const pieces = await getDb().select({ seriesId: artwork.seriesId }).from(artwork);
  const counts = new Map<string, number>();
  for (const p of pieces) counts.set(p.seriesId, (counts.get(p.seriesId) ?? 0) + 1);
  return rows.map((s) => ({ ...s, artworkCount: counts.get(s.id) ?? 0 }));
}
