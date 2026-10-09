import type { Artwork, Series } from "@/db";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";

export type FeaturedArtworkMode = "static" | "upload";

/** Null for legacy `random` rows, which now show the gallery’s first painting until a choice is saved. */
export function parseFeaturedArtworkMode(raw: string | null | undefined): FeaturedArtworkMode | null {
  return raw === "static" || raw === "upload" ? raw : null;
}

/** Listing card set to the uploaded card image, and one has actually been uploaded. */
export function usesUploadedCover(series: Pick<Series, "featuredImage" | "featuredArtworkMode">): boolean {
  return (
    parseFeaturedArtworkMode(series.featuredArtworkMode) === "upload" &&
    Boolean(series.featuredImage) &&
    series.featuredImage !== GALLERY_PLACEHOLDER_IMAGE
  );
}

/**
 * Painting on the listing card when the uploaded card image is not in use:
 * the chosen piece, else the first painting in the gallery.
 */
export function listingCardPiece<T extends { id: string }>(
  series: Pick<Series, "featuredArtworkMode" | "featuredArtworkId">,
  pieces: T[],
): T | null {
  const chosen =
    parseFeaturedArtworkMode(series.featuredArtworkMode) === "static" && series.featuredArtworkId
      ? pieces.find((piece) => piece.id === series.featuredArtworkId)
      : undefined;
  return chosen ?? pieces[0] ?? null;
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
/** Home page hero can hold more images than a gallery page. */
export const HOME_SLIDESHOW_MAX = 5;

export type HeroSlideshowSlot = {
  artworkId: string | null;
  image: string | null;
  href?: string | null;
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
 * Independent of the Portfolio listing card. Uses saved slots when set.
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
  if (!usesUploadedCover(series)) {
    const piece = listingCardPiece(series, pieces);
    if (piece) return fromPiece(piece, pieces);
  }

  return {
    artwork: null,
    image: series.featuredImage,
    alt: `${series.title} — featured artwork`,
    title: series.title,
    gridIndex: null,
  };
}
