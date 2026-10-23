import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Series } from "@/db";
import { series } from "@/db/schema";
import { getDb } from "@/db";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";

/** Hidden parent row. The public index lives at `/exhibitions`, not under `/art`. */
export const EXHIBITIONS_PARENT_SLUG = "exhibitions-index";

export function isExhibitionsParentSlug(slug: string): boolean {
  return slug === EXHIBITIONS_PARENT_SLUG;
}

export function exhibitionPublicHref(slug: string): string {
  return `/exhibitions/${encodeURIComponent(slug)}`;
}

/** Get or create the parent series that exhibitions hang from. */
export async function ensureExhibitionsParent(): Promise<Series> {
  const db = getDb();
  const existing = await db
    .select()
    .from(series)
    .where(eq(series.slug, EXHIBITIONS_PARENT_SLUG))
    .then((rows) => rows[0]);
  if (existing) return existing;

  const t = new Date();
  const row: Series = {
    id: nanoid(),
    slug: EXHIBITIONS_PARENT_SLUG,
    title: "Exhibitions",
    excerpt: "",
    content: "",
    featuredImage: GALLERY_PLACEHOLDER_IMAGE,
    featuredArtworkMode: "random",
    featuredArtworkId: null,
    sortOrder: 0,
    parentSeriesId: null,
    showHeroSlideshow: false,
    isPrivate: false,
    accessToken: null,
    createdAt: t,
    updatedAt: t,
  };
  try {
    await db.insert(series).values(row);
    return row;
  } catch {
    const again = await db
      .select()
      .from(series)
      .where(eq(series.slug, EXHIBITIONS_PARENT_SLUG))
      .then((rows) => rows[0]);
    if (again) return again;
    throw new Error("Could not create the exhibitions page.");
  }
}

/** Admin URL for a series id when it is the exhibitions index or one exhibition. */
export async function adminPathForSeriesId(seriesId: string): Promise<string | null> {
  const db = getDb();
  const row = await db
    .select({ id: series.id, slug: series.slug, parentSeriesId: series.parentSeriesId })
    .from(series)
    .where(eq(series.id, seriesId))
    .then((rows) => rows[0]);
  if (!row) return null;
  if (isExhibitionsParentSlug(row.slug)) return "/admin/exhibitions";
  if (!row.parentSeriesId) return null;
  const parent = await db
    .select({ slug: series.slug })
    .from(series)
    .where(eq(series.id, row.parentSeriesId))
    .then((rows) => rows[0]);
  if (!parent || !isExhibitionsParentSlug(parent.slug)) return null;
  return `/admin/exhibitions/${row.id}`;
}
