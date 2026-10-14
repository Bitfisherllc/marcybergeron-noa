import { ADMIN_UPLOAD_MAX_EDGE } from "@/lib/adminUploadLimits";

export type ShrunkUpload = { buffer: Buffer; ext: ".webp"; contentType: "image/webp" };

/**
 * Safety net behind the browser resize: re-encodes still images wider or taller than
 * ADMIN_UPLOAD_MAX_EDGE as WebP. Returns null to keep the original (small, animated, SVG,
 * unreadable, or sharp unavailable).
 */
export async function shrinkUploadOnServer(input: Buffer): Promise<ShrunkUpload | null> {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height) return null;
    if (meta.format === "svg" || meta.format === "gif" || (meta.pages ?? 1) > 1) return null;
    if (Math.max(meta.width, meta.height) <= ADMIN_UPLOAD_MAX_EDGE) return null;

    const buffer = await sharp(input)
      .rotate()
      .resize({ width: ADMIN_UPLOAD_MAX_EDGE, height: ADMIN_UPLOAD_MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer();
    return { buffer, ext: ".webp", contentType: "image/webp" };
  } catch (error) {
    console.warn("[saveUpload] Could not resize upload; storing original.", error);
    return null;
  }
}
