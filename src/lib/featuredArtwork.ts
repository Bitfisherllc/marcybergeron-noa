import type { Artwork, Series } from "@/db";

export type FeaturedArtworkMode = "random" | "static";

export function parseFeaturedArtworkMode(raw: string | null | undefined): FeaturedArtworkMode {
  return raw === "static" ? "static" : "random";
}

export function pickRandomArtwork<T>(pieces: T[]): T | null {
  return pickRandomArtworks(pieces, 1)[0] ?? null;
}

export function pickRandomArtworks<T>(pieces: T[], count: number): T[] {
  const pool = [...pieces];
  const out: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

export type ResolvedStatementArtwork = {
  artwork: Artwork | null;
  image: string;
  alt: string;
  title: string;
  /** When the resolved piece is in the gallery grid, use this lightbox index (1-based offset after hero). */
  gridIndex: number | null;
};

export const HERO_SLIDESHOW_MAX = 3;

export type HeroSlideshowSlot = {
  artworkId: string | null;
  image: string | null;
};

function matchPieceByImage<T extends { id: string; image: string }>(
  image: string,
  pieces: T[],
): T | undefined {
  return pieces.find((piece) => piece.image === image);
}

/**
 * Resolve one gallery slideshow slot from the admin form.
 * Upload wins, then a newly chosen site image, then a painting in this gallery,
 * then the image already stored on the slot.
 */
export function resolveHeroSlideshowWrite(input: {
  uploaded: string | null;
  libraryImage: string;
  initialImage: string;
  artworkId: string;
  pieces: Pick<Artwork, "id" | "image">[];
}): { artworkId: string | null; image: string } | null {
  const allowed = new Set(input.pieces.map((piece) => piece.id));
  const selected =
    input.artworkId && allowed.has(input.artworkId)
      ? input.pieces.find((piece) => piece.id === input.artworkId)
      : undefined;

  if (input.uploaded) {
    return {
      image: input.uploaded,
      artworkId: matchPieceByImage(input.uploaded, input.pieces)?.id ?? null,
    };
  }

  if (input.libraryImage && input.libraryImage !== input.initialImage) {
    return {
      image: input.libraryImage,
      artworkId: matchPieceByImage(input.libraryImage, input.pieces)?.id ?? null,
    };
  }

  if (selected) {
    return { image: selected.image, artworkId: selected.id };
  }

  if (input.libraryImage) {
    return {
      image: input.libraryImage,
      artworkId: matchPieceByImage(input.libraryImage, input.pieces)?.id ?? null,
    };
  }

  return null;
}

function fromPiece(piece: Artwork, pieces: Artwork[]): ResolvedStatementArtwork {
  const gridIndex = pieces.findIndex((p) => p.id === piece.id);
  return {
    artwork: piece,
    image: piece.image,
    alt: piece.alt,
    title: piece.title,
    gridIndex: gridIndex >= 0 ? gridIndex : null,
  };
}

/**
 * Large image(s) beside About when a gallery has Display slideshow turned on.
 * Independent of the rotating Portfolio listing card. Uses saved slots when set.
 */
export function resolveInteriorHeroSlides(
  series: Pick<Series, "title" | "featuredImage" | "featuredArtworkMode" | "featuredArtworkId">,
  pieces: Artwork[],
  slots: HeroSlideshowSlot[],
): ResolvedStatementArtwork[] {
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const slides: ResolvedStatementArtwork[] = [];
  const seenArtwork = new Set<string>();
  const seenImage = new Set<string>();
  for (const slot of slots) {
    if (slides.length >= HERO_SLIDESHOW_MAX) break;
    const fromId = slot.artworkId ? byId.get(slot.artworkId) : undefined;
    const fromImage = slot.image ? matchPieceByImage(slot.image, pieces) : undefined;
    const piece = fromId ?? fromImage;
    if (piece) {
      if (seenArtwork.has(piece.id)) continue;
      seenArtwork.add(piece.id);
      slides.push(fromPiece(piece, pieces));
      continue;
    }
    if (!slot.image || seenImage.has(slot.image)) continue;
    seenImage.add(slot.image);
    slides.push({
      artwork: null,
      image: slot.image,
      alt: `${series.title} — featured artwork`,
      title: series.title,
      gridIndex: null,
    });
  }
  if (slides.length > 0) return slides;

  const random = pickRandomArtworks(pieces, 1);
  if (random.length > 0) return random.map((piece) => fromPiece(piece, pieces));

  return [
    {
      artwork: null,
      image: series.featuredImage,
      alt: `${series.title} — featured artwork`,
      title: series.title,
      gridIndex: null,
    },
  ];
}

/** Pick the artwork shown on the main Portfolio listing card. */
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
