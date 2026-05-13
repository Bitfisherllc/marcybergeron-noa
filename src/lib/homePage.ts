import { asc, eq, inArray } from "drizzle-orm";
import type { Artwork, Post, Series } from "@/db";
import {
  artwork,
  homeFeaturedPostSlot,
  homeFeaturedSeriesSlot,
  homeSection,
  homeSelectedArtworkSlot,
  homeSlideshow,
  post,
  series,
} from "@/db/schema";
import { getDb } from "@/db";
import { HOME_SECTION_DEFAULTS, HOME_SECTION_KEYS, type HomeSectionKey } from "@/lib/homeDefaults";
import { featuredHomePieces, heroHomeSlides, listPublishedPosts, listSeries } from "@/lib/queries";

export type HomeSectionResolved = {
  eyebrow: string;
  title: string;
  quote: string;
  body: string;
};

export async function getResolvedHomeSection(key: HomeSectionKey): Promise<HomeSectionResolved> {
  const def = HOME_SECTION_DEFAULTS[key];
  const rows = await getDb().select().from(homeSection).where(eq(homeSection.section, key));
  const row = rows[0];
  if (!row) return { ...def };
  return {
    eyebrow: row.eyebrow,
    title: row.title,
    quote: row.quote,
    body: row.body,
  };
}

export async function getResolvedHeroSlides(): Promise<{ src: string; alt: string }[]> {
  const rows = await getDb().select().from(homeSlideshow).orderBy(asc(homeSlideshow.sortOrder), asc(homeSlideshow.createdAt));
  if (rows.length > 0) {
    return rows.map((r) => ({ src: r.image, alt: r.alt }));
  }
  return heroHomeSlides();
}

async function slotSeriesIds(): Promise<(string | null)[]> {
  const rows = await getDb().select().from(homeFeaturedSeriesSlot).orderBy(asc(homeFeaturedSeriesSlot.slot));
  const bySlot: (string | null)[] = [null, null, null];
  for (const r of rows) {
    if (r.slot >= 0 && r.slot <= 2) bySlot[r.slot] = r.seriesId ?? null;
  }
  return bySlot;
}

export async function getResolvedFeaturedSeries(): Promise<Series[]> {
  const slots = await slotSeriesIds();
  const ids = slots.filter((id): id is string => Boolean(id));
  if (ids.length === 0) {
    const all = await listSeries();
    return all.slice(0, 3);
  }
  const db = getDb();
  const found = await db.select().from(series).where(inArray(series.id, ids));
  const map = new Map(found.map((s) => [s.id, s]));
  const ordered: Series[] = [];
  for (const id of slots) {
    if (!id) continue;
    const s = map.get(id);
    if (s) ordered.push(s);
  }
  return ordered.slice(0, 3);
}

async function slotPostIds(): Promise<(string | null)[]> {
  const rows = await getDb().select().from(homeFeaturedPostSlot).orderBy(asc(homeFeaturedPostSlot.slot));
  const bySlot: (string | null)[] = [null, null, null];
  for (const r of rows) {
    if (r.slot >= 0 && r.slot <= 2) bySlot[r.slot] = r.postId ?? null;
  }
  return bySlot;
}

export async function getResolvedJournalPostsForHome(): Promise<Post[]> {
  const slots = await slotPostIds();
  const ids = slots.filter((id): id is string => Boolean(id));
  if (ids.length === 0) {
    const all = await listPublishedPosts();
    return all.slice(0, 3);
  }
  const db = getDb();
  const found = await db.select().from(post).where(inArray(post.id, ids));
  const map = new Map(found.map((p) => [p.id, p]));
  const ordered: Post[] = [];
  for (const id of slots) {
    if (!id) continue;
    const p = map.get(id);
    if (p?.published) ordered.push(p);
  }
  if (ordered.length === 0) {
    const all = await listPublishedPosts();
    return all.slice(0, 3);
  }
  return ordered.slice(0, 3);
}

async function slotArtworkIds(): Promise<(string | null)[]> {
  const rows = await getDb().select().from(homeSelectedArtworkSlot).orderBy(asc(homeSelectedArtworkSlot.slot));
  const bySlot: (string | null)[] = [null, null, null];
  for (const r of rows) {
    if (r.slot >= 0 && r.slot <= 2) bySlot[r.slot] = r.artworkId ?? null;
  }
  return bySlot;
}

export async function getResolvedSelectedWorks(): Promise<{ series: Series; piece: Artwork }[]> {
  const slots = await slotArtworkIds();
  const ids = slots.filter((id): id is string => Boolean(id));
  const db = getDb();

  if (ids.length > 0) {
    const pieces = await db.select().from(artwork).where(inArray(artwork.id, ids));
    const pieceMap = new Map(pieces.map((a) => [a.id, a]));
    const seriesIds = [...new Set(pieces.map((a) => a.seriesId))];
    const sers = seriesIds.length ? await db.select().from(series).where(inArray(series.id, seriesIds)) : [];
    const seriesMap = new Map(sers.map((s) => [s.id, s]));
    const ordered: { series: Series; piece: Artwork }[] = [];
    for (const id of slots) {
      if (!id) continue;
      const piece = pieceMap.get(id);
      if (!piece) continue;
      const s = seriesMap.get(piece.seriesId);
      if (s) ordered.push({ series: s, piece });
    }
    if (ordered.length > 0) return ordered.slice(0, 3);
  }

  const picks = await featuredHomePieces();
  const featured = await getResolvedFeaturedSeries();
  const featuredIds = new Set(featured.map((s) => s.id));
  const fromFeatured = picks.filter((p) => featuredIds.has(p.series.id)).slice(0, 3);
  if (fromFeatured.length >= 3) return fromFeatured.slice(0, 3);
  return picks.slice(0, 3);
}

/** Admin: raw section rows for form (empty strings if row exists with blanks). */
export async function listHomeSectionsForAdmin(): Promise<Record<HomeSectionKey, HomeSectionResolved>> {
  const db = getDb();
  const rows = await db.select().from(homeSection);
  const map = new Map(rows.map((r) => [r.section as HomeSectionKey, r]));
  const out = {} as Record<HomeSectionKey, HomeSectionResolved>;
  for (const key of HOME_SECTION_KEYS) {
    const row = map.get(key);
    const def = HOME_SECTION_DEFAULTS[key];
    out[key] = row
      ? { eyebrow: row.eyebrow, title: row.title, quote: row.quote, body: row.body }
      : { ...def };
  }
  return out;
}

export async function listHomeSlideshowForAdmin() {
  return getDb().select().from(homeSlideshow).orderBy(asc(homeSlideshow.sortOrder), asc(homeSlideshow.createdAt));
}

export async function getHomePickStateForAdmin() {
  const [seriesSlots, postSlots, artSlots] = await Promise.all([
    getDb().select().from(homeFeaturedSeriesSlot).orderBy(asc(homeFeaturedSeriesSlot.slot)),
    getDb().select().from(homeFeaturedPostSlot).orderBy(asc(homeFeaturedPostSlot.slot)),
    getDb().select().from(homeSelectedArtworkSlot).orderBy(asc(homeSelectedArtworkSlot.slot)),
  ]);
  const seriesBySlot = [null, null, null] as (string | null)[];
  for (const r of seriesSlots) {
    if (r.slot >= 0 && r.slot <= 2) seriesBySlot[r.slot] = r.seriesId ?? null;
  }
  const postBySlot = [null, null, null] as (string | null)[];
  for (const r of postSlots) {
    if (r.slot >= 0 && r.slot <= 2) postBySlot[r.slot] = r.postId ?? null;
  }
  const artBySlot = [null, null, null] as (string | null)[];
  for (const r of artSlots) {
    if (r.slot >= 0 && r.slot <= 2) artBySlot[r.slot] = r.artworkId ?? null;
  }
  return { seriesBySlot, postBySlot, artBySlot };
}
