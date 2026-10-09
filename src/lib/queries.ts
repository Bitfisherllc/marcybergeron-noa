import { asc, and, count, desc, eq, inArray, isNotNull, notInArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { unstable_cache } from "next/cache";
import type { Artwork, Series } from "@/db";
import { artwork, artworkSeries, mailingListSignup, post, postCategory, postGalleryImage, series, seriesHeroSlide } from "@/db/schema";
import { getDb } from "@/db";
import { CACHE_TAGS, SITE_REVALIDATE_SECONDS } from "@/lib/cacheConfig";
import {
  listingCardPiece,
  parseFeaturedArtworkMode,
  resolveStatementArtwork,
  usesUploadedCover,
  type HeroSlideshowSlot,
} from "@/lib/featuredArtwork";
import { toHeroSlide, type HeroSlide } from "@/lib/heroSlides";
import {
  isMediumGallerySlug,
  isStudioGallerySlug,
  MEDIUM_GALLERY_SLUGS,
  publicPortfolioGalleries,
  resolveMediumGalleryRow,
  withMediumGalleryTitle,
} from "@/lib/mediumGalleries";
import type { PostKind } from "@/lib/postKind";
import { artSeriesHref, normalizeRouteSlug } from "@/lib/routeSlug";

async function listSeriesUncached() {
  return getDb().select().from(series).orderBy(asc(series.sortOrder), asc(series.title));
}

export const listSeries = unstable_cache(listSeriesUncached, ["list-series"], {
  revalidate: SITE_REVALIDATE_SECONDS,
  tags: [CACHE_TAGS.series],
});

/** Medium landing page galleries, in nav order. */
export async function listMediumGalleries(): Promise<Series[]> {
  const all = await listSeries();
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return MEDIUM_GALLERY_SLUGS.map((slug) => resolveMediumGalleryRow(slug, bySlug))
    .filter((s): s is Series => Boolean(s))
    .map(withMediumGalleryTitle);
}

/** @deprecated Thematic portfolio series are no longer managed in admin. */
export async function listPortfolioSeries(): Promise<Series[]> {
  return [];
}

/** Admin artwork membership options — series and private galleries. */
export async function listAdminSeriesMembershipOptions(): Promise<Series[]> {
  const all = await listSeries();
  return all
    .filter((s) => (s.isPrivate || s.parentSeriesId) && !isMediumGallerySlug(s.slug))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

export async function getSeriesById(id: string) {
  const rows = await getDb().select().from(series).where(eq(series.id, id));
  const row = rows[0];
  return row ? withMediumGalleryTitle(row) : null;
}

export async function getSeriesBySlug(slug: string) {
  const normalized = normalizeRouteSlug(slug);
  if (!normalized) return null;
  const rows = await getDb().select().from(series).where(eq(series.slug, normalized));
  const row = rows[0];
  return row ? withMediumGalleryTitle(row) : null;
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

/**
 * Public series (galleries with a parent medium), ordered by medium nav order, then sort order.
 * Pass a medium id to list only that medium's series.
 */
export async function listChildSeries(parentSeriesId?: string): Promise<Series[]> {
  const [all, mediums] = await Promise.all([listSeries(), listMediumGalleries()]);
  const mediumOrder = new Map(mediums.map((m, i) => [m.id, i]));
  return all
    .filter(
      (s) =>
        s.parentSeriesId &&
        !s.isPrivate &&
        mediumOrder.has(s.parentSeriesId) &&
        (!parentSeriesId || s.parentSeriesId === parentSeriesId),
    )
    .sort((a, b) => mediumOrder.get(a.parentSeriesId!)! - mediumOrder.get(b.parentSeriesId!)!);
}

/** Series cards shown under a medium gallery. */
export async function listSeriesIndexCards(parentSeriesId: string) {
  const galleries = await listChildSeries(parentSeriesId);
  return Promise.all(
    galleries.map(async (s) => {
      const pieces = await listArtworksForSeries(s.id);
      const featured = resolveStatementArtwork(s, pieces);
      return {
        id: s.id,
        href: artSeriesHref(s.slug),
        title: s.title,
        excerpt: s.excerpt,
        image: featured.image,
        alt: featured.alt,
        imageWidth: featured.artwork?.imageWidth,
        imageHeight: featured.artwork?.imageHeight,
      };
    }),
  );
}

/** One round trip: artworks per medium gallery for `/medium` card picks. */
export async function listArtworksGroupedForMediumGalleries(galleries: Series[]): Promise<Map<string, Artwork[]>> {
  const grouped = new Map<string, Artwork[]>(galleries.map((g) => [g.id, []]));
  if (galleries.length === 0) return grouped;

  const db = getDb();
  const needsPiece = galleries.filter((gallery) => !usesUploadedCover(gallery));
  if (needsPiece.length === 0) return grouped;
  const staticArtworkIds = needsPiece
    .filter((gallery) => parseFeaturedArtworkMode(gallery.featuredArtworkMode) === "static")
    .map((gallery) => gallery.featuredArtworkId)
    .filter((id): id is string => Boolean(id));
  const mediumIds = needsPiece.map((gallery) => gallery.id);

  const [staticPieces, firstPieces] = await Promise.all([
    staticArtworkIds.length > 0
      ? db.select().from(artwork).where(inArray(artwork.id, staticArtworkIds))
      : Promise.resolve([] as Artwork[]),
    db
      .select()
      .from(artwork)
      .where(
        sql`${artwork.id} IN (
          SELECT DISTINCT ON (${artwork.mediumSeriesId}) ${artwork.id}
          FROM ${artwork}
          WHERE ${artwork.mediumSeriesId} IN ${mediumIds}
          ORDER BY ${artwork.mediumSeriesId}, ${artwork.sortOrder}, ${artwork.title}
        )`,
      ),
  ]);

  for (const gallery of needsPiece) {
    const inGallery = [...firstPieces, ...staticPieces].filter((piece) => piece.mediumSeriesId === gallery.id);
    const piece = listingCardPiece(gallery, inGallery);
    if (piece) grouped.set(gallery.id, [piece]);
  }

  return grouped;
}

/** Previous / next series within the same medium. */
export async function getChildSeriesNeighbors(s: Pick<Series, "slug" | "parentSeriesId">) {
  const all = s.parentSeriesId ? await listChildSeries(s.parentSeriesId) : [];
  const idx = all.findIndex((row) => row.slug === s.slug);
  if (idx === -1) return { prev: null as null | Series, next: null as null | Series };
  return {
    prev: idx > 0 ? all[idx - 1]! : null,
    next: idx < all.length - 1 ? all[idx + 1]! : null,
  };
}

async function listArtworksForSeriesUncached(seriesId: string) {
  const rows = await getDb()
    .select({ piece: artwork })
    .from(artwork)
    .innerJoin(artworkSeries, eq(artworkSeries.artworkId, artwork.id))
    .where(eq(artworkSeries.seriesId, seriesId))
    .orderBy(asc(artwork.sortOrder), asc(artwork.title));
  return rows.map((r) => r.piece);
}

export const listArtworksForSeries = unstable_cache(listArtworksForSeriesUncached, ["list-artworks-for-series", "v2"], {
  revalidate: SITE_REVALIDATE_SECONDS,
  tags: [CACHE_TAGS.artwork],
});

async function listArtworksForMediumGalleryUncached(mediumSeriesId: string) {
  return getDb()
    .select()
    .from(artwork)
    .where(eq(artwork.mediumSeriesId, mediumSeriesId))
    .orderBy(asc(artwork.sortOrder), asc(artwork.title));
}

/** Paintings assigned to a Medium nav gallery via `medium_series_id`. */
export const listArtworksForMediumGallery = unstable_cache(
  listArtworksForMediumGalleryUncached,
  ["list-artworks-medium-gallery", "v3"],
  { revalidate: SITE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.artwork] },
);

export async function listArtworksForPublicGallery(series: Pick<Series, "id" | "slug" | "parentSeriesId">) {
  if (series.parentSeriesId) return listArtworksForSeries(series.id);
  if (isMediumGallerySlug(series.slug)) return listArtworksForMediumGallery(series.id);
  return listArtworksForSeries(series.id);
}

/** Paintings available for the gallery-page slideshow and listing-card pick. */
export async function listArtworksForHeroPicks(series: Pick<Series, "id" | "slug" | "parentSeriesId">) {
  return listArtworksForPublicGallery(series);
}

export async function listHeroSlideshowSlots(seriesId: string): Promise<HeroSlideshowSlot[]> {
  const rows = await getDb()
    .select({
      artworkId: seriesHeroSlide.artworkId,
      image: seriesHeroSlide.image,
    })
    .from(seriesHeroSlide)
    .where(eq(seriesHeroSlide.seriesId, seriesId))
    .orderBy(asc(seriesHeroSlide.slot));
  return rows.map((row) => ({
    artworkId: row.artworkId,
    image: row.image,
  }));
}

export async function getArtwork(id: string) {
  const rows = await getDb().select().from(artwork).where(eq(artwork.id, id));
  return rows[0] ?? null;
}

export async function getSeriesNeighbors(slug: string) {
  const normalized = normalizeRouteSlug(slug);
  const all = publicPortfolioGalleries(await listMediumGalleries());
  const idx = all.findIndex((s) => s.slug === normalized);
  if (idx === -1) return { prev: null as null | (typeof all)[number], next: null as null | (typeof all)[number] };
  return {
    prev: idx > 0 ? all[idx - 1]! : null,
    next: idx < all.length - 1 ? all[idx + 1]! : null,
  };
}

export async function featuredHomePieces(): Promise<{ series: Series; piece: Artwork }[]> {
  const sers = await listMediumGalleries();
  const mediumIds = sers.map((s) => s.id);
  if (mediumIds.length === 0) return [];

  const rows = await getDb()
    .select()
    .from(artwork)
    .where(inArray(artwork.mediumSeriesId, mediumIds))
    .orderBy(asc(artwork.sortOrder), asc(artwork.title));

  const firstByMedium = new Map<string, Artwork>();
  for (const piece of rows) {
    if (piece.mediumSeriesId && !firstByMedium.has(piece.mediumSeriesId)) {
      firstByMedium.set(piece.mediumSeriesId, piece);
    }
  }

  const out: { series: Series; piece: Artwork }[] = [];
  for (const s of sers) {
    const piece = firstByMedium.get(s.id);
    if (piece) out.push({ series: s, piece });
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

async function listPublishedPostsUncached(kind: PostKind) {
  return getDb()
    .select()
    .from(post)
    .where(and(eq(post.published, true), eq(post.kind, kind)))
    .orderBy(desc(post.updatedAt));
}

const listPublishedNews = unstable_cache(() => listPublishedPostsUncached("news"), ["list-published-posts", "v7", "news"], {
  revalidate: SITE_REVALIDATE_SECONDS,
  tags: [CACHE_TAGS.posts],
});

const listPublishedWorkshops = unstable_cache(
  () => listPublishedPostsUncached("workshop"),
  ["list-published-posts", "v7", "workshop"],
  {
    revalidate: SITE_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.posts],
  },
);

export function listPublishedPosts(kind: PostKind = "news") {
  return kind === "workshop" ? listPublishedWorkshops() : listPublishedNews();
}

/** Next post in section order (same sequence as `/news` or `/workshops`): newer posts first. */
export async function getPublishedPostNext(slug: string, kind: PostKind = "news") {
  const normalized = normalizeRouteSlug(slug);
  const posts = await listPublishedPosts(kind);
  const idx = posts.findIndex((p) => p.slug === normalized);
  if (idx === -1 || idx >= posts.length - 1) return null;
  return posts[idx + 1]!;
}

export async function getPostBySlug(slug: string) {
  const normalized = normalizeRouteSlug(slug);
  if (!normalized) return null;
  const [news, workshops] = await Promise.all([listPublishedPosts("news"), listPublishedPosts("workshop")]);
  const cached = news.find((p) => p.slug === normalized) ?? workshops.find((p) => p.slug === normalized);
  if (cached) return cached;
  const rows = await getDb().select().from(post).where(eq(post.slug, normalized));
  return rows[0] ?? null;
}

export async function listPostGalleryImages(postId: string) {
  return getDb()
    .select()
    .from(postGalleryImage)
    .where(eq(postGalleryImage.postId, postId))
    .orderBy(asc(postGalleryImage.sortOrder), asc(postGalleryImage.createdAt));
}

export async function listPostCategories(kind: PostKind = "news") {
  return getDb()
    .select()
    .from(postCategory)
    .where(eq(postCategory.kind, kind))
    .orderBy(asc(postCategory.sortOrder), asc(postCategory.name));
}

export async function listAllPostsAdmin(kind?: PostKind) {
  if (kind) {
    return getDb().select().from(post).where(eq(post.kind, kind)).orderBy(desc(post.updatedAt));
  }
  return getDb().select().from(post).orderBy(desc(post.updatedAt));
}

export async function listMailingListSignups() {
  return getDb().select().from(mailingListSignup).orderBy(desc(mailingListSignup.createdAt));
}

export { listContactMessages } from "@/lib/contactMessages";

export type PickerSeriesTag = { title: string; sortOrder: number; portfolio: string; portfolioSortOrder: number };

function pickerPortfolioName(slug: string, title: string): string {
  return isStudioGallerySlug(slug) ? "The Studio" : title;
}

async function listArtworksWithSeriesForPickerUncached() {
  const db = getDb();
  const parent = alias(series, "parent_series");
  const [rows, memberships] = await Promise.all([
    db
      .select({
        id: artwork.id,
        title: artwork.title,
        image: artwork.image,
        alt: artwork.alt,
        seriesTitle: series.title,
        seriesSlug: series.slug,
        seriesSortOrder: series.sortOrder,
      })
      .from(artwork)
      .leftJoin(series, eq(artwork.mediumSeriesId, series.id))
      .orderBy(asc(artwork.title)),
    db
      .select({
        artworkId: artworkSeries.artworkId,
        title: series.title,
        sortOrder: series.sortOrder,
        portfolioTitle: parent.title,
        portfolioSlug: parent.slug,
        portfolioSortOrder: parent.sortOrder,
      })
      .from(artworkSeries)
      .innerJoin(series, eq(artworkSeries.seriesId, series.id))
      .innerJoin(parent, eq(series.parentSeriesId, parent.id)),
  ]);

  const seriesByArtwork = new Map<string, PickerSeriesTag[]>();
  for (const row of memberships) {
    const list = seriesByArtwork.get(row.artworkId) ?? [];
    list.push({
      title: row.title,
      sortOrder: row.sortOrder,
      portfolio: pickerPortfolioName(row.portfolioSlug, row.portfolioTitle),
      portfolioSortOrder: row.portfolioSortOrder,
    });
    seriesByArtwork.set(row.artworkId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    label: row.seriesTitle ? `${row.title} — ${row.seriesTitle}` : row.title,
    image: row.image,
    alt: row.alt,
    href: row.seriesSlug ? artSeriesHref(row.seriesSlug) : "",
    gallery: row.seriesSlug ? pickerPortfolioName(row.seriesSlug, row.seriesTitle ?? "") : "",
    gallerySortOrder: row.seriesSortOrder ?? 0,
    series: seriesByArtwork.get(row.id) ?? [],
  }));
}

/** Admin painting pickers — one lightweight query, cached until artwork changes. */
export const listArtworksWithSeriesForPicker = unstable_cache(
  listArtworksWithSeriesForPickerUncached,
  ["artwork-picker", "v5"],
  { revalidate: SITE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.artwork, CACHE_TAGS.series] },
);

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

export type SeriesAdminOverview = Series & { artworkCount: number };

/** Series list for admin with artwork counts per gallery. */
async function listSeriesAdminOverviewUncached(): Promise<SeriesAdminOverview[]> {
  const db = getDb();
  const [rows, mediumCounts] = await Promise.all([
    db
      .select({
        id: series.id,
        slug: series.slug,
        title: series.title,
        excerpt: series.excerpt,
        content: series.content,
        featuredImage: series.featuredImage,
        featuredArtworkMode: series.featuredArtworkMode,
        featuredArtworkId: series.featuredArtworkId,
        sortOrder: series.sortOrder,
        parentSeriesId: series.parentSeriesId,
        showHeroSlideshow: series.showHeroSlideshow,
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
      .orderBy(asc(series.sortOrder), asc(series.title)),
    db
      .select({ mediumSeriesId: artwork.mediumSeriesId, artworkCount: count() })
      .from(artwork)
      .where(isNotNull(artwork.mediumSeriesId))
      .groupBy(artwork.mediumSeriesId),
  ]);

  const mediumMap = new Map(
    mediumCounts.map((r) => [r.mediumSeriesId!, Number(r.artworkCount)]),
  );

  return rows.map((row) => {
    const artworkCount = isMediumGallerySlug(row.slug)
      ? (mediumMap.get(row.id) ?? 0)
      : Number(row.artworkCount ?? 0);
    const withCount = { ...row, artworkCount };
    return withMediumGalleryTitle(withCount) as SeriesAdminOverview;
  });
}

export const listSeriesAdminOverview = unstable_cache(
  listSeriesAdminOverviewUncached,
  ["series-admin-overview", "v1"],
  { revalidate: SITE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.series, CACHE_TAGS.artwork] },
);
