import type { Artwork } from "@/db";
import { captionSubtitle } from "@/components/ArtCaption";
import type { ArtworkGalleryMeta } from "@/lib/queries";

export function artworkInquiryHref(artworkId: string): string {
  return `/contact?artwork=${encodeURIComponent(artworkId)}`;
}

export function buildArtworkInquiryMessage(
  piece: Pick<Artwork, "title" | "medium" | "size">,
  meta?: ArtworkGalleryMeta,
): string {
  const lines = [`I am interested in purchasing "${piece.title}".`, ""];

  const details = captionSubtitle({ medium: piece.medium, size: piece.size });
  if (details) lines.push(details);

  if (meta?.portfolioSeries.length) {
    lines.push(`Series: ${meta.portfolioSeries.map((s) => s.title).join(", ")}`);
  }
  if (meta?.mediumSeries) {
    lines.push(`Medium: ${meta.mediumSeries.title}`);
  }

  lines.push("", "Please let me know about availability and next steps.");
  return lines.join("\n");
}
