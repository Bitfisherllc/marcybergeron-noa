import { asc, and, count, desc, eq, inArray, isNotNull, notInArray } from "drizzle-orm";
import type { Artwork, Series } from "@/db";
import { artwork, artworkSeries, mailingListSignup, post, series } from "@/db/schema";
import { getDb } from "@/db";
import { toHeroSlide, type HeroSlide } from "@/lib/heroSlides";
import { isMediumGallerySlug, MEDIUM_GALLERY_SLUGS } from "@/lib/mediumGalleries";
import { normalizeRouteSlug } from "@/lib/routeSlug";

export async function listSeries() {
  return getDb().select().from(series).orderBy(asc(series.sortOrder), asc(series.title));
}

/** Medium landing page galleries, in nav order. */
export async function listMediumGalleries(): Promise<Series[]> {
  const all = await listSeries();
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return MEDIUM_GALLERY_SLUGS.map((slug) => bySlug.get(slug)).filter((s): s is Series => Boolean(s));
}

/** @deprecated Thematic portfolio series are no longer managed in admin. */
export async function listPortfolioSeries(): Promise<Series[]> {
  return [];
}

/** Admin artwork membership options — private galleries only. */
export async function listAdminSeriesMembershipOptions(): Promise<Series[]> {
  const all = await listSeries();
  return all
    .filter((s) => s.isPrivate && !isMediumGallerySlug(s.slug))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

export async function getSeriesById(id: string) {
  const rows = await getDb().select().from(series).where(eq(series.id, id));
  return rows[0] ?? null;
}

export async function getSeriesBySlug(slug: string) {
  const normalized = normalizeRouteSlug(slug);
  const rows = await getDb().select().from(series).where(eq(series.slug, normalized));
  return rows[0] ?? null;
}

export async function getSeriesByAccessToken(token: string) {
  const normalized = token.trim();
  if (!normalized) return null;
  const rows = await getDb().select().from(series).where(eq(series.accessToken, normalized));
  return rows[0] ?? null;
}

export async function listPrivateGalleries(): Promise<Series[]> {
  const all = await listSeries();
  return all.filter((s) => s.isPrivate);
}

export async function listArtworksForSeries(seriesId: string) {
  const rows = await getDb()
    .select({ piece: artwork })
    .from(artwork)
    .innerJoin(artworkSeries, eq(artworkSeries.artworkId, artwork.id))
    .where(eq(artworkSeries.seriesId, seriesId))
    .orderBy(asc(artwork.sortOrder), asc(artwork.title));
  return rows.map((r) => r.piece);
}

/** Paintings assigned to a Medium nav gallery via `medium_series_id`. */
export async function listArtworksForMediumGallery(mediumSeriesId: string) {
  return getDb()
    .select()
    .from(artwork)
    .where(eq(artwork.mediumSeriesId, mediumSeriesId))
    .orderBy(asc(artwork.sortOrder), asc(artwork.title));
}

export async function listArtworksForPublicGallery(series: Pick<Series, "id" | "slug">) {
  if (isMediumGallerySlug(series.slug)) {
    return listArtworksForMediumGallery(series.id);
  }
  return listArtworksForSeries(series.id);
}

export async function getArtwork(id: string) {
  const rows = await getDb().select().from(artwork).where(eq(artwork.id, id));
  return rows[0] ?? null;
}

export async function getSeriesNeighbors(slug: string) {
  const normalized = normalizeRouteSlug(slug);
  const all = await listMediumGalleries();
  const idx = all.findIndex((s) => s.slug === normalized);
  if (idx === -1) return { prev: null as null | (typeof all)[number], next: null as null | (typeof all)[number] };
  return {
    prev: idx > 0 ? all[idx - 1]! : null,
    next: idx < all.length - 1 ? all[idx + 1]! : null,
  };
}

export async function featuredHomePieces(): Promise<{ series: Series; piece: Artwork }[]> {
  const sers = await listMediumGalleries();
  const out: { series: Series; piece: Artwork }[] = [];
  for (const s of sers) {
    const arts = await listArtworksForSeries(s.id);
    const first = arts[0];
    if (first) out.push({ series: s, piece: first });
  }
  return out;
}

/** First portfolio series per artwork (for home links and labels). */
export async function getPrimarySeriesForArtworks(artworkIds: string[]): Promise<Map<string, Series>> {
  if (artworkIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ artworkId: artworkSeries.artworkId, ser: series })
    .from(artworkSeries)
    .innerJoin(series, eq(artworkSeries.seriesId, series.id))
    .where(inArray(artworkSeries.artworkId, artworkIds))
    .orderBy(asc(series.sortOrder), asc(series.title));

  const map = new Map<string, Series>();
  for (const row of rows) {
    if (!map.has(row.artworkId)) map.set(row.artworkId, row.ser);
  }
  return map;
}

export type ArtworkGalleryMeta = {
  portfolioSeries: { id: string; slug: string; title: string }[];
  mediumSeries: { id: string; slug: string; title: string } | null;
};

/** Portfolio series links and medium gallery per artwork (for gallery captions). */
export async function getArtworkGalleryMeta(artworkIds: string[]): Promise<Map<string, ArtworkGalleryMeta>> {
  if (artworkIds.length === 0) return new Map();

  const db = getDb();
  const empty = (): ArtworkGalleryMeta => ({ portfolioSeries: [], mediumSeries: null });
  const map = new Map(artworkIds.map((id) => [id, empty()]));

  const portfolioRows = await db
    .select({ artworkId: artworkSeries.artworkId, ser: series })
    .from(artworkSeries)
    .innerJoin(series, eq(artworkSeries.seriesId, series.id))
    .where(inArray(artworkSeries.artworkId, artworkIds))
    .orderBy(asc(series.sortOrder), asc(series.title));

  for (const row of portfolioRows) {
    if (isMediumGallerySlug(row.ser.slug) || row.ser.isPrivate) continue;
    map.get(row.artworkId)!.portfolioSeries.push({ id: row.ser.id, slug: row.ser.slug, title: row.ser.title });
  }

  const pieces = await db
    .select({ id: artwork.id, mediumSeriesId: artwork.mediumSeriesId })
    .from(artwork)
    .where(inArray(artwork.id, artworkIds));

  const mediumIds = [...new Set(pieces.map((p) => p.mediumSeriesId).filter(Boolean))] as string[];
  const mediumRows =
    mediumIds.length > 0 ? await db.select().from(series).where(inArray(series.id, mediumIds)) : [];
  const mediumById = new Map(mediumRows.map((s) => [s.id, { id: s.id, slug: s.slug, title: s.title }]));

  for (const piece of pieces) {
    if (!piece.mediumSeriesId) continue;
    const m = mediumById.get(piece.mediumSeriesId);
    if (m) map.get(piece.id)!.mediumSeries = m;
  }

  return map;
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
    const subtitle = [piece.medium, piece.size].filter(Boolean).join(" · ");
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

export { listContactMessages } from "@/lib/contactMessages";

/** Admin home picker: artworks with series title for labels. */
export async function listArtworksWithSeriesForPicker() {
  const rows = await listAllArtworksWithSeries();
  const seen = new Set<string>();
  const out: { id: string; label: string; image: string; alt: string }[] = [];
  for (const { piece, ser } of rows) {
    if (seen.has(piece.id)) continue;
    seen.add(piece.id);
    out.push({
      id: piece.id,
      label: `${piece.title} — ${ser.title}`,
      image: piece.image,
      alt: piece.alt,
    });
  }
  return out;
}

/** All artworks grouped for All Work — portfolio memberships plus medium-only pieces. */
export async function listAllArtworksWithSeries() {
  const portfolioRows = await getDb()
    .select({ piece: artwork, ser: series })
    .from(artwork)
    .innerJoin(artworkSeries, eq(artworkSeries.artworkId, artwork.id))
    .innerJoin(series, eq(artworkSeries.seriesId, series.id))
    .where(and(notInArray(series.slug, [...MEDIUM_GALLERY_SLUGS]), eq(series.isPrivate, false)))
    .orderBy(asc(series.sortOrder), asc(series.title), asc(artwork.sortOrder), asc(artwork.title));

  const portfolioArtworkIds = new Set(portfolioRows.map((row) => row.piece.id));

  const mediumOnlyRows = await getDb()
    .select({ piece: artwork, ser: series })
    .from(artwork)
    .innerJoin(series, eq(artwork.mediumSeriesId, series.id))
    .where(inArray(series.slug, [...MEDIUM_GALLERY_SLUGS]))
    .orderBy(asc(series.sortOrder), asc(series.title), asc(artwork.sortOrder), asc(artwork.title));

  const mediumOnlyFiltered = mediumOnlyRows.filter((row) => !portfolioArtworkIds.has(row.piece.id));

  return [...portfolioRows, ...mediumOnlyFiltered].sort((a, b) => {
    const seriesOrder = a.ser.sortOrder - b.ser.sortOrder || a.ser.title.localeCompare(b.ser.title);
    if (seriesOrder !== 0) return seriesOrder;
    return a.piece.sortOrder - b.piece.sortOrder || a.piece.title.localeCompare(b.piece.title);
  });
}

/** Series list for admin with artwork counts per gallery. */
export async function listSeriesAdminOverview() {
  const rows = await getDb()
    .select({
      id: series.id,
      slug: series.slug,
      title: series.title,
      excerpt: series.excerpt,
      content: series.content,
      featuredImage: series.featuredImage,
      sortOrder: series.sortOrder,
      isPrivate: series.isPrivate,
      accessToken: series.accessToken,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      artworkCount: count(artwork.id),
    })
    .from(series)
    .leftJoin(artworkSeries, eq(artworkSeries.seriesId, series.id))
    .leftJoin(artwork, eq(artworkSeries.artworkId, artwork.id))
    .groupBy(series.id)
    .orderBy(asc(series.sortOrder), asc(series.title));

  const mediumCounts = await getDb()
    .select({ mediumSeriesId: artwork.mediumSeriesId, artworkCount: count() })
    .from(artwork)
    .where(isNotNull(artwork.mediumSeriesId))
    .groupBy(artwork.mediumSeriesId);

  const mediumMap = new Map(
    mediumCounts.map((r) => [r.mediumSeriesId!, Number(r.artworkCount)]),
  );

  return rows.map((row) =>
    isMediumGallerySlug(row.slug) ? { ...row, artworkCount: mediumMap.get(row.id) ?? 0 } : row,
  );
}
