import { join } from "node:path";
import { stat } from "node:fs/promises";
import { getDb } from "@/db";
import { artwork, artworkSeries, series } from "@/db/schema";
import type { GallerySlide } from "@/lib/gallerySlides";
import { getPublicImageDimensions } from "@/lib/imageDimensions";
import { MEDIUM_GALLERY_SLUGS } from "@/lib/mediumGalleries";
import { OIL_COLD_WAX_GALLERY_SERIES_ORDER, OIL_COLD_WAX_PARENT_SLUG } from "@/lib/oilColdWaxSeries";

/** Unlisted URL — not in nav or the sitemap. */
export const IMAGE_RESOLUTION_REPORT_PATH = "/review/image-resolution";

export type ImageResolutionSeverity = "critical" | "high" | "medium";

export type ImageResolutionItem = {
  id: string;
  title: string;
  kind: "artwork" | "series-card";
  fileName: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  longEdge: number;
  kb: number | null;
  severity: ImageResolutionSeverity;
  why: string;
  alsoIn: string[];
  slide: GallerySlide;
};

export type ImageResolutionSeriesGroup = {
  title: string;
  slug: string;
  anchor: string;
  items: ImageResolutionItem[];
};

export type ImageResolutionReport = {
  counts: {
    critical: number;
    high: number;
    medium: number;
    total: number;
    artworkTotal: number;
  };
  series: ImageResolutionSeriesGroup[];
};

type Draft = ImageResolutionItem & { seriesTitle: string; seriesSlug: string };

const SERIES_ORDER: readonly string[] = [
  OIL_COLD_WAX_PARENT_SLUG,
  ...OIL_COLD_WAX_GALLERY_SERIES_ORDER,
  ...MEDIUM_GALLERY_SLUGS.filter((slug) => slug !== OIL_COLD_WAX_PARENT_SLUG),
];

const MEDIUM_SLUG_SET = new Set<string>(MEDIUM_GALLERY_SLUGS);

function isPhotoSrc(src: string): boolean {
  const lower = src.toLowerCase();
  return !lower.endsWith(".svg") && !lower.includes("placeholder");
}

function fileNameFromSrc(src: string): string {
  try {
    const path = src.startsWith("http") ? new URL(src).pathname : src;
    return decodeURIComponent(path.split("/").pop() || src);
  } catch {
    return src;
  }
}

export function seriesAnchor(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function severityFor(longEdge: number): ImageResolutionSeverity | null {
  if (longEdge < 800) return "critical";
  if (longEdge < 1200) return "high";
  if (longEdge < 2000) return "medium";
  return null;
}

function whyFor(longEdge: number, severity: ImageResolutionSeverity): string {
  if (severity === "critical") {
    return `Only ${longEdge}px on the long edge. Gallery tiles display at about 360px on screen (720px on a Retina screen). This file is smaller than a Retina tile, so it looks soft in the grid and very soft when enlarged.`;
  }
  if (severity === "high") {
    return `Only ${longEdge}px on the long edge. Fine as a small tile, but the enlarged view is often 1,000–1,600px. The browser stretches this file, so it looks soft when clicked.`;
  }
  return `${longEdge}px on the long edge. Tiles look acceptable. A Retina enlarged view draws about 2,000–3,200 physical pixels, so texture looks a little soft when clicked.`;
}

export function severityLabel(severity: ImageResolutionSeverity): string {
  if (severity === "critical") return "Replace first";
  if (severity === "high") return "Soft when clicked";
  return "Slightly soft when enlarged";
}

async function localFileKb(src: string): Promise<number | null> {
  if (!src.startsWith("/")) return null;
  try {
    const abs = join(process.cwd(), "public", decodeURIComponent(src.replace(/^\//, "")));
    const st = await stat(abs);
    return Math.round(st.size / 1024);
  } catch {
    return null;
  }
}

async function dimensionsFor(
  src: string,
  stored?: { width: number | null; height: number | null },
): Promise<{ width: number; height: number } | null> {
  const fromFile = src.startsWith("/") ? await getPublicImageDimensions(src) : null;
  if (fromFile) return fromFile;
  if (stored?.width && stored.height) return { width: stored.width, height: stored.height };
  return null;
}

function makeSlide(item: {
  id: string;
  src: string;
  alt: string;
  title: string;
  width: number;
  height: number;
  kb: number | null;
  severity: ImageResolutionSeverity;
}): GallerySlide {
  const size = `${item.width} × ${item.height} px${item.kb != null ? ` · ${item.kb} KB` : ""}`;
  return {
    id: item.id,
    src: item.src,
    alt: item.alt,
    title: item.title,
    subtitle: `${severityLabel(item.severity)} · ${size}`,
    width: item.width,
    height: item.height,
  };
}

function toPublicItem(draft: Draft): ImageResolutionItem {
  const { seriesTitle, seriesSlug, ...item } = draft;
  return item;
}

export async function getImageResolutionReport(): Promise<ImageResolutionReport> {
  const db = getDb();
  const [seriesRows, arts, memberships] = await Promise.all([
    db.select().from(series),
    db.select().from(artwork),
    db.select().from(artworkSeries),
  ]);

  const seriesById = new Map(seriesRows.map((s) => [s.id, s]));
  const membersByArtwork = new Map<string, string[]>();
  for (const m of memberships) {
    const list = membersByArtwork.get(m.artworkId) ?? [];
    list.push(m.seriesId);
    membersByArtwork.set(m.artworkId, list);
  }

  const drafts: Draft[] = [];

  for (const a of arts) {
    if (!isPhotoSrc(a.image)) continue;
    const dim = await dimensionsFor(a.image, { width: a.imageWidth, height: a.imageHeight });
    if (!dim) continue;
    const longEdge = Math.max(dim.width, dim.height);
    const severity = severityFor(longEdge);
    if (!severity) continue;

    const memberIds = new Set(membersByArtwork.get(a.id) ?? []);
    memberIds.add(a.seriesId);
    if (a.mediumSeriesId) memberIds.add(a.mediumSeriesId);
    const memberSeries = [...memberIds]
      .map((id) => seriesById.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    const named = memberSeries.filter((s) => s.slug !== OIL_COLD_WAX_PARENT_SLUG && !MEDIUM_SLUG_SET.has(s.slug));
    const medium = memberSeries.find((s) => MEDIUM_SLUG_SET.has(s.slug));
    const home = named[0] ?? medium ?? seriesById.get(a.seriesId);
    if (!home) continue;

    const kb = await localFileKb(a.image);
    drafts.push({
      id: a.id,
      title: a.title,
      kind: "artwork",
      fileName: fileNameFromSrc(a.image),
      src: a.image,
      alt: a.alt || a.title,
      width: dim.width,
      height: dim.height,
      longEdge,
      kb,
      severity,
      why: whyFor(longEdge, severity),
      alsoIn: memberSeries.filter((s) => s.id !== home.id).map((s) => s.title),
      slide: makeSlide({
        id: a.id,
        src: a.image,
        alt: a.alt || a.title,
        title: a.title,
        width: dim.width,
        height: dim.height,
        kb,
        severity,
      }),
      seriesTitle: home.title,
      seriesSlug: home.slug,
    });
  }

  for (const s of seriesRows) {
    if (!isPhotoSrc(s.featuredImage)) continue;
    const dim = await dimensionsFor(s.featuredImage);
    if (!dim) continue;
    const longEdge = Math.max(dim.width, dim.height);
    const severity = severityFor(longEdge);
    if (!severity) continue;
    if (drafts.some((i) => i.src === s.featuredImage && i.seriesSlug === s.slug)) continue;

    const kb = await localFileKb(s.featuredImage);
    const id = `${s.id}-featured`;
    const title = `${s.title} (series card)`;
    drafts.push({
      id,
      title,
      kind: "series-card",
      fileName: fileNameFromSrc(s.featuredImage),
      src: s.featuredImage,
      alt: `${s.title} — series card`,
      width: dim.width,
      height: dim.height,
      longEdge,
      kb,
      severity,
      why: whyFor(longEdge, severity),
      alsoIn: [],
      slide: makeSlide({
        id,
        src: s.featuredImage,
        alt: `${s.title} — series card`,
        title,
        width: dim.width,
        height: dim.height,
        kb,
        severity,
      }),
      seriesTitle: s.title,
      seriesSlug: s.slug,
    });
  }

  const extraSlugs = [...new Set(drafts.map((i) => i.seriesSlug))].filter((slug) => !SERIES_ORDER.includes(slug));
  extraSlugs.sort((a, b) => {
    const ta = seriesRows.find((s) => s.slug === a)?.title ?? a;
    const tb = seriesRows.find((s) => s.slug === b)?.title ?? b;
    return ta.localeCompare(tb);
  });
  const rank = new Map([...SERIES_ORDER, ...extraSlugs].map((slug, i) => [slug, i]));
  const sevRank = { critical: 0, high: 1, medium: 2 } as const;

  drafts.sort((a, b) => {
    const sa = rank.get(a.seriesSlug) ?? 999;
    const sb = rank.get(b.seriesSlug) ?? 999;
    if (sa !== sb) return sa - sb;
    if (sevRank[a.severity] !== sevRank[b.severity]) return sevRank[a.severity] - sevRank[b.severity];
    if (a.longEdge !== b.longEdge) return a.longEdge - b.longEdge;
    return a.title.localeCompare(b.title);
  });

  const groups = new Map<string, ImageResolutionSeriesGroup>();
  for (const draft of drafts) {
    let group = groups.get(draft.seriesSlug);
    if (!group) {
      group = {
        title: draft.seriesTitle,
        slug: draft.seriesSlug,
        anchor: seriesAnchor(draft.seriesTitle),
        items: [],
      };
      groups.set(draft.seriesSlug, group);
    }
    group.items.push(toPublicItem(draft));
  }

  return {
    counts: {
      critical: drafts.filter((i) => i.severity === "critical").length,
      high: drafts.filter((i) => i.severity === "high").length,
      medium: drafts.filter((i) => i.severity === "medium").length,
      total: drafts.length,
      artworkTotal: arts.length,
    },
    series: [...groups.values()],
  };
}
