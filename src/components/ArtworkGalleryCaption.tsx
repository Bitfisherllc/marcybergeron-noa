import Link from "next/link";
import { captionSubtitle } from "@/components/ArtCaption";
import { ArtworkInquiryLink } from "@/components/ArtworkInquiryLink";
import { RichText } from "@/components/RichText";
import { formatArtworkPrice } from "@/lib/artworkPrice";
import { artSeriesHref } from "@/lib/routeSlug";

export type GallerySeriesLink = { slug: string; title: string };

function availabilityLabel(status?: string) {
  if (status === "sold") return "Sold";
  if (status === "available") return "Available";
  return "";
}

type ArtworkGalleryCaptionProps = {
  title: string;
  medium?: string;
  size?: string;
  portfolioSeries: GallerySeriesLink[];
  mediumGallery?: GallerySeriesLink | null;
  description?: string;
  status?: string;
  /** Show Available or Sold. Exhibition galleries turn this on. */
  showStatus?: boolean;
  /** Whole USD. Omit on portfolio and series pages. */
  price?: number | null;
  artworkId?: string;
  as?: "figcaption" | "div";
  /** Light text for the lightbox overlay. */
  variant?: "default" | "lightbox";
  titleId?: string;
  hideTitle?: boolean;
};

export function ArtworkGalleryCaption({
  title,
  medium,
  size,
  portfolioSeries,
  mediumGallery,
  description,
  status,
  showStatus = false,
  price,
  artworkId,
  as: Tag = "figcaption",
  variant = "default",
  titleId,
  hideTitle = false,
}: ArtworkGalleryCaptionProps) {
  const subtitle = captionSubtitle({ medium, size });
  const availability = showStatus ? availabilityLabel(status) : "";
  const isLightbox = variant === "lightbox";
  const linkClass = isLightbox
    ? "underline decoration-white/25 underline-offset-2 transition hover:text-white hover:decoration-white/50"
    : "link-quiet text-ink/85";
  const labelClass = isLightbox ? "text-white/50" : "text-muted/80";
  const textClass = isLightbox ? "text-white/65" : "text-muted";
  const titleClass = isLightbox
    ? "font-serif text-xl tracking-tight text-white md:text-2xl"
    : "font-serif text-lg font-medium tracking-tight text-ink";
  const descClass = isLightbox ? "text-sm leading-relaxed text-white/55" : "text-sm leading-relaxed text-muted";

  return (
    <Tag className={`max-w-prose space-y-2 ${isLightbox ? "w-full text-center" : "mt-4"}`}>
      {hideTitle ? null : (
        <div id={titleId} className={titleClass}>
          {title}
        </div>
      )}
      {subtitle ? <div className={`text-sm leading-relaxed ${textClass}`}>{subtitle}</div> : null}
      {availability ? <div className={`text-sm leading-relaxed ${textClass}`}>{availability}</div> : null}
      {price != null ? (
        <div className={`text-sm leading-relaxed ${isLightbox ? "text-white/80" : "text-ink"}`}>
          {formatArtworkPrice(price)}
        </div>
      ) : null}
      {!isLightbox && portfolioSeries.length > 0 ? (
        <div className={`text-sm ${textClass}`}>
          <span className={labelClass}>Series </span>
          {portfolioSeries.map((s, i) => (
            <span key={s.slug}>
              {i > 0 ? ", " : null}
              <Link href={artSeriesHref(s.slug)} className={linkClass}>
                {s.title}
              </Link>
            </span>
          ))}
        </div>
      ) : null}
      {!isLightbox && mediumGallery ? (
        <div className={`text-sm ${textClass}`}>
          <Link href={artSeriesHref(mediumGallery.slug)} className={linkClass}>
            {mediumGallery.title}
          </Link>
        </div>
      ) : null}
      {description ? <RichText content={description} className={descClass} /> : null}
      {status === "available" && artworkId ? (
        <div className={isLightbox ? "pt-1" : undefined}>
          <ArtworkInquiryLink artworkId={artworkId} variant={variant} />
        </div>
      ) : null}
    </Tag>
  );
}
