import type { Artwork, Series } from "@/db";
import { captionSubtitle } from "@/components/ArtCaption";
import { getPublicImageDimensions } from "@/lib/imageDimensions";

export type GallerySlide = {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  status?: string;
  description?: string;
  width?: number;
  height?: number;
};

export async function slideFromArtwork(piece: Artwork): Promise<GallerySlide> {
  const dim = piece.image.startsWith("/") ? await getPublicImageDimensions(piece.image) : null;
  return {
    id: piece.id,
    src: piece.image,
    alt: piece.alt,
    title: piece.title,
    subtitle: captionSubtitle({ medium: piece.medium, size: piece.size, year: piece.year }),
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
  opts?: { subtitle?: string },
): Promise<GallerySlide> {
  const dim = ser.featuredImage.startsWith("/") ? await getPublicImageDimensions(ser.featuredImage) : null;
  return {
    id: `${ser.id}-hero`,
    src: ser.featuredImage,
    alt: `${ser.title} — featured artwork`,
    title: ser.title,
    subtitle: opts?.subtitle ?? "Featured work",
    width: dim?.width,
    height: dim?.height,
  };
}
