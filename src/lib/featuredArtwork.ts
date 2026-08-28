import type { Artwork, Series } from "@/db";

export type FeaturedArtworkMode = "random" | "static";

export function parseFeaturedArtworkMode(raw: string | null | undefined): FeaturedArtworkMode {
  return raw === "static" ? "static" : "random";
}

export function pickRandomArtwork<T>(pieces: T[]): T | null {
  if (pieces.length === 0) return null;
  return pieces[Math.floor(Math.random() * pieces.length)]!;
}

export type ResolvedStatementArtwork = {
  artwork: Artwork | null;
  image: string;
  alt: string;
  title: string;
  /** When the resolved piece is in the gallery grid, use this lightbox index (1-based offset after hero). */
  gridIndex: number | null;
};

/** Pick the artwork shown beside the portfolio statement. */
export function resolveStatementArtwork(
  series: Pick<Series, "title" | "featuredImage" | "featuredArtworkMode" | "featuredArtworkId">,
  pieces: Artwork[],
): ResolvedStatementArtwork {
  const mode = parseFeaturedArtworkMode(series.featuredArtworkMode);

  if (mode === "static" && series.featuredArtworkId) {
    const fixed = pieces.find((p) => p.id === series.featuredArtworkId);
    if (fixed) {
      const gridIndex = pieces.findIndex((p) => p.id === fixed.id);
      return {
        artwork: fixed,
        image: fixed.image,
        alt: fixed.alt,
        title: fixed.title,
        gridIndex: gridIndex >= 0 ? gridIndex : null,
      };
    }
  }

  const random = pickRandomArtwork(pieces);
  if (random) {
    const gridIndex = pieces.findIndex((p) => p.id === random.id);
    return {
      artwork: random,
      image: random.image,
      alt: random.alt,
      title: random.title,
      gridIndex: gridIndex >= 0 ? gridIndex : null,
    };
  }

  return {
    artwork: null,
    image: series.featuredImage,
    alt: `${series.title} — featured artwork`,
    title: series.title,
    gridIndex: null,
  };
}
