/** Decode slug params from dynamic routes (`Dimensional%20Ground` → `Dimensional Ground`). */
export function normalizeRouteSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) return trimmed;
  try {
    return decodeURIComponent(trimmed.replace(/\+/g, " "));
  } catch {
    return trimmed.replace(/\+/g, " ");
  }
}

export function artSeriesHref(slug: string): string {
  return `/art/${encodeURIComponent(slug)}`;
}
