import type { Artwork, Series } from "@/db";
import { captionSubtitle } from "@/components/ArtCaption";
import type { GallerySeriesLink } from "@/components/ArtworkGalleryCaption";
import { artworkStoredDimensions, getPublicImageDimensions, resolveArtworkImageDimensions } from "@/lib/imageDimensions";

export type GallerySlide = {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  medium?: string;
  size?: string;
  portfolioSeries?: GallerySeriesLink[];
  mediumGallery?: GallerySeriesLink | null;
  artworkId?: string;
  status?: string;
  description?: string;
  width?: number;
  height?: number;
};

export async function slideFromArtwork(
  piece: Artwork,
  meta?: { portfolioSeries: GallerySeriesLink[]; mediumGallery: GallerySeriesLink | null },
): Promise<GallerySlide> {
  const dim = await resolveArtworkImageDimensions(piece);
  return {
    id: piece.id,
    src: piece.image,
    alt: piece.alt,
    title: piece.title,
    subtitle: captionSubtitle({ medium: piece.medium, size: piece.size }),
    medium: piece.medium,
    size: piece.size,
    portfolioSeries: meta?.portfolioSeries ?? [],
    mediumGallery: meta?.mediumGallery ?? null,
    artworkId: piece.id,
    status: piece.status,
    description: piece.description || undefined,
    width: dim?.width,
    height: dim?.height,
  };
}

export async function slideFromSeriesFeatured(ser: Series): Promise<GallerySlide> {
  const dim = ser.featuredImage.startsWith("/") ? await getPublicImageDimensions(ser.featuredImage) : null;
  return {
    id: `${ser.id}-featured`,
    src: ser.featuredImage,
    alt: `${ser.title} — featured artwork`,
    title: ser.title,
    subtitle: "Series",
    description: ser.excerpt,
    width: dim?.width,
    height: dim?.height,
  };
}

export async function slideFromSeriesHero(
  ser: Pick<Series, "id" | "title" | "featuredImage">,
  opts?: { subtitle?: string; image?: string; slot?: number },
): Promise<GallerySlide> {
  const src = opts?.image ?? ser.featuredImage;
  const dim = src.startsWith("/") ? await getPublicImageDimensions(src) : null;
  const slotSuffix = opts?.slot != null ? `-${opts.slot}` : "";
  return {
    id: `${ser.id}-hero${slotSuffix}`,
    src,
    alt: `${ser.title} — featured artwork`,
    title: ser.title,
    subtitle: opts?.subtitle ?? "Featured work",
    width: dim?.width,
    height: dim?.height,
  };
}

/** Sync slide for a news-post gallery image (caption in the lightbox title). */
export function slideFromPostGalleryImage(img: {
  id: string;
  image: string;
  alt: string;
  caption: string;
  imageWidth: number | null;
  imageHeight: number | null;
}): GallerySlide {
  const title = img.caption.trim() || img.alt.trim() || "Gallery image";
  return {
    id: img.id,
    src: img.image,
    alt: img.alt.trim() || title,
    title,
    subtitle: "",
    width: img.imageWidth ?? undefined,
    height: img.imageHeight ?? undefined,
  };
}

/** Sync slide builder when artwork dimensions are already loaded from the DB. */
export function slideFromArtworkCached(
  piece: Artwork,
  meta?: { portfolioSeries: GallerySeriesLink[]; mediumGallery: GallerySeriesLink | null },
): GallerySlide {
  const dim = artworkStoredDimensions(piece);
  return {
    id: piece.id,
    src: piece.image,
    alt: piece.alt,
    title: piece.title,
    subtitle: captionSubtitle({ medium: piece.medium, size: piece.size }),
    medium: piece.medium,
    size: piece.size,
    portfolioSeries: meta?.portfolioSeries ?? [],
    mediumGallery: meta?.mediumGallery ?? null,
    artworkId: piece.id,
    status: piece.status,
    description: piece.description || undefined,
    width: dim?.width,
    height: dim?.height,
  };
}
