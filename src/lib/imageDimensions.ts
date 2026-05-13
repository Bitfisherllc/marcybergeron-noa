import { join } from "path";
import { imageSizeFromFile } from "image-size/fromFile";

const cache = new Map<string, { width: number; height: number } | null>();

/** Read width/height for images stored under `public/` (e.g. `/uploads/...`). Cached per process. */
export async function getPublicImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  if (!src.startsWith("/")) return null;

  const hit = cache.get(src);
  if (hit !== undefined) return hit;

  const abs = join(process.cwd(), "public", decodeURIComponent(src.replace(/^\//, "")));

  try {
    const r = await imageSizeFromFile(abs);
    let width = r.width;
    let height = r.height;
    if (!width || !height) {
      cache.set(src, null);
      return null;
    }
    const o = r.orientation;
    if (o && o >= 5 && o <= 8) {
      const t = width;
      width = height;
      height = t;
    }
    const out = { width, height };
    cache.set(src, out);
    return out;
  } catch {
    cache.set(src, null);
    return null;
  }
}
