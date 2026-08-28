import { join } from "path";
import { imageSize } from "image-size";
import { imageSizeFromFile } from "image-size/fromFile";
import type { Artwork } from "@/db";

const cache = new Map<string, { width: number; height: number } | null>();

export type ImageDimensions = { width: number; height: number };

export function normalizeDimensions(raw: { width?: number; height?: number } | null | undefined): ImageDimensions | null {
  const width = raw?.width;
  const height = raw?.height;
  if (!width || !height) return null;
  return { width, height };
}

/** Stored DB dimensions when present. */
export function artworkStoredDimensions(
  piece: Pick<Artwork, "imageWidth" | "imageHeight">,
): ImageDimensions | null {
  if (piece.imageWidth && piece.imageHeight) {
    return { width: piece.imageWidth, height: piece.imageHeight };
  }
  return null;
}

/** Measure from an in-memory buffer (admin upload / import). */
export function measureImageBuffer(buffer: Buffer): ImageDimensions | null {
  try {
    const r = imageSize(buffer);
    return normalizeDimensions(applyOrientation(r.width, r.height, r.orientation));
  } catch {
    return null;
  }
}

function applyOrientation(
  width: number | undefined,
  height: number | undefined,
  orientation?: number,
): { width?: number; height?: number } {
  if (!width || !height) return { width, height };
  const o = orientation;
  if (o && o >= 5 && o <= 8) return { width: height, height: width };
  return { width, height };
}

/** Measure a public URL or `/uploads/...` path. Remote URLs are skipped. */
export async function measureImageSrc(src: string): Promise<ImageDimensions | null> {
  if (!src.startsWith("/")) return null;
  return getPublicImageDimensions(src);
}

/** Read width/height for images stored under `public/` (e.g. `/uploads/...`). Cached per process. */
export async function getPublicImageDimensions(src: string): Promise<ImageDimensions | null> {
  if (!src.startsWith("/")) return null;

  const hit = cache.get(src);
  if (hit !== undefined) return hit;

  const abs = join(process.cwd(), "public", decodeURIComponent(src.replace(/^\//, "")));

  try {
    const r = await imageSizeFromFile(abs);
    const out = normalizeDimensions(applyOrientation(r.width, r.height, r.orientation));
    cache.set(src, out);
    return out;
  } catch {
    cache.set(src, null);
    return null;
  }
}

/** Prefer stored artwork dimensions, else measure local public files. */
export async function resolveArtworkImageDimensions(
  piece: Pick<Artwork, "image" | "imageWidth" | "imageHeight">,
): Promise<ImageDimensions | null> {
  const stored = artworkStoredDimensions(piece);
  if (stored) return stored;
  if (!piece.image.startsWith("/")) return null;
  return getPublicImageDimensions(piece.image);
}

/** Resolve dimensions for gallery rendering — stored props beat filesystem reads. */
export async function resolveImageDimensions(
  src: string,
  stored?: ImageDimensions | null,
): Promise<ImageDimensions | null> {
  if (stored) return stored;
  if (!src.startsWith("/")) return null;
  return getPublicImageDimensions(src);
}
