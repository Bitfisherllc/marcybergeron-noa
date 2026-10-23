export const ARTWORK_PRICE_HINT =
  "Shown on exhibition pages only, after a visitor signs in to see prices. Leave blank to hide the price. Portfolio and series pages never show it.";

/** Whole US dollars. Blank means the painting has no public price. */
export function parseArtworkPrice(raw: unknown): number | null {
  const text = String(raw ?? "")
    .trim()
    .replace(/[$,\s]/g, "");
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function formatArtworkPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
