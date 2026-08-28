export type ParsedGalleryImportFilename = {
  sortOrder: number;
  title: string;
  sizeRaw: string;
  size: string;
  extension: string;
};

const SIZE_PATTERN = String.raw`\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?`;

function parseSortOrder(digits: string, letter?: string): number {
  const base = Number(digits) * 100;
  if (!letter) return base;
  return base + (letter.toLowerCase().charCodeAt(0) - 97 + 1);
}

function normalizeSizeRaw(raw: string): string {
  return raw.replace(/\s/g, "").toLowerCase().replace("×", "x");
}

function extractSizeAndTitle(withoutExt: string): { titlePart: string; sizeRaw: string } | null {
  const framedSuffix = withoutExt.match(new RegExp(`^(.+?)\\s+(${SIZE_PATTERN})\\s+framed\\s*$`, "i"));
  if (framedSuffix) {
    return { titlePart: framedSuffix[1]!.trimEnd(), sizeRaw: framedSuffix[2]! };
  }

  const parenSuffix = withoutExt.match(/\(([^)]*)\)\s*$/);
  if (parenSuffix) {
    const sizes = [...parenSuffix[1]!.matchAll(new RegExp(SIZE_PATTERN, "gi"))];
    if (sizes.length > 0) {
      return {
        titlePart: withoutExt.slice(0, -parenSuffix[0].length).trimEnd(),
        sizeRaw: sizes[sizes.length - 1]![0],
      };
    }
  }

  const sizeMatch = withoutExt.match(new RegExp(`[ \\t-]+(${SIZE_PATTERN})\\s*$`, "i"));
  if (!sizeMatch) return null;

  return {
    titlePart: withoutExt.slice(0, -sizeMatch[0].length).trimEnd(),
    sizeRaw: sizeMatch[1]!,
  };
}

/**
 * `{order}-{title} {width}x{height}.{ext}` — tolerant of common filename quirks:
 * optional dash after order, letter suffixes (1a, 2b), spaces around ×,
 * decimal sizes, parenthetical notes (framed, detail, diptych), and `WxH framed`.
 */
export function parseGalleryImportFilename(filename: string): ParsedGalleryImportFilename | null {
  const base = filename.replace(/^.*[/\\]/, "").trim();
  if (!base) return null;

  const extMatch = base.match(/\s*\.(webp|jpe?g|png|gif)$/i);
  if (!extMatch) return null;

  const extension = extMatch[1].toLowerCase() === "jpeg" ? "jpg" : extMatch[1].toLowerCase();
  const withoutExt = base.slice(0, -extMatch[0].length).trimEnd();

  const extracted = extractSizeAndTitle(withoutExt);
  if (!extracted) return null;

  const sizeRaw = normalizeSizeRaw(extracted.sizeRaw);
  const beforeSize = extracted.titlePart;

  const dashed = beforeSize.match(/^(\d+)([a-z])-(.+)$/i);
  const legacy = dashed ? null : beforeSize.match(/^(\d+)-?\s*(.+)$/);
  const headMatch = dashed ?? legacy;
  if (!headMatch) return null;

  const sortOrder = dashed
    ? parseSortOrder(dashed[1]!, dashed[2])
    : parseSortOrder(legacy![1]!, undefined);
  const title = (dashed ? dashed[3] : legacy![2]).trim().replace(/\s+-+\s*$/, "");
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
  const match = normalized.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i);
  if (!match) return raw.trim();
  return `${match[1]}" × ${match[2]}"`;
}
