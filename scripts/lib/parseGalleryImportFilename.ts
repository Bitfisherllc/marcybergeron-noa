export type ParsedGalleryImportFilename = {
  sortOrder: number;
  title: string;
  sizeRaw: string;
  size: string;
  extension: string;
};

/**
 * `{order}-{title} {width}x{height}.{ext}` — tolerant of common filename quirks:
 * optional dash after order, spaces around ×, extra spaces before the extension.
 * Example: `1-Gut Feeling 24x18.webp`, `17Born in the USA   22x18 .webp`, `16-Headlights 14 x 12.webp`
 */
export function parseGalleryImportFilename(filename: string): ParsedGalleryImportFilename | null {
  const base = filename.replace(/^.*[/\\]/, "").trim();
  if (!base) return null;

  const extMatch = base.match(/\s*\.(webp|jpe?g|png|gif)$/i);
  if (!extMatch) return null;

  const extension = extMatch[1].toLowerCase() === "jpeg" ? "jpg" : extMatch[1].toLowerCase();
  const withoutExt = base.slice(0, -extMatch[0].length).trimEnd();

  const sizeMatch = withoutExt.match(/\s+(\d+\s*[x×]\s*\d+)\s*$/i);
  if (!sizeMatch) return null;

  const sizeRaw = sizeMatch[1].replace(/\s/g, "").toLowerCase().replace("×", "x");
  const beforeSize = withoutExt.slice(0, -sizeMatch[0].length).trimEnd();

  const headMatch = beforeSize.match(/^(\d+)-?\s*(.+)$/);
  if (!headMatch) return null;

  const sortOrder = Number(headMatch[1]);
  const title = headMatch[2].trim();
  if (!title || !Number.isFinite(sortOrder)) return null;

  return {
    sortOrder,
    title,
    sizeRaw,
    size: formatGalleryImportSize(sizeRaw),
    extension,
  };
}

export function formatGalleryImportSize(raw: string): string {
  const normalized = raw.trim().replace(/\s/g, "").replace("×", "x");
  const match = normalized.match(/^(\d+)x(\d+)$/i);
  if (!match) return raw.trim();
  return `${match[1]}" × ${match[2]}"`;
}
