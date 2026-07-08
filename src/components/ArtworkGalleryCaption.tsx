import Link from "next/link";
import { captionSubtitle } from "@/components/ArtCaption";
import { ArtworkInquiryLink } from "@/components/ArtworkInquiryLink";
import { artSeriesHref } from "@/lib/routeSlug";

export type GallerySeriesLink = { slug: string; title: string };

type ArtworkGalleryCaptionProps = {
  title: string;
  medium?: string;
  size?: string;
  portfolioSeries: GallerySeriesLink[];
  mediumGallery?: GallerySeriesLink | null;
  description?: string;
  status?: string;
  artworkId?: string;
  as?: "figcaption" | "div";
  /** Light text for the lightbox overlay. */
  variant?: "default" | "lightbox";
  titleId?: string;
};

export function ArtworkGalleryCaption({
  title,
  medium,
  size,
  portfolioSeries,
  mediumGallery,
  description,
  status,
  artworkId,
  as: Tag = "figcaption",
  variant = "default",
  titleId,
}: ArtworkGalleryCaptionProps) {
  const subtitle = captionSubtitle({ medium, size });
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
      <div id={titleId} className={titleClass}>
        {title}
      </div>
      {subtitle ? <div className={`text-sm leading-relaxed ${textClass}`}>{subtitle}</div> : null}
      {portfolioSeries.length > 0 ? (
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
      {mediumGallery ? (
        <div className={`text-sm ${textClass}`}>
          <Link href={artSeriesHref(mediumGallery.slug)} className={linkClass}>
            {mediumGallery.title}
          </Link>
        </div>
      ) : null}
      {description ? <p className={descClass}>{description}</p> : null}
      {status === "available" && artworkId ? (
        <div className={isLightbox ? "pt-1" : undefined}>
          <ArtworkInquiryLink artworkId={artworkId} variant={variant} />
        </div>
      ) : null}
    </Tag>
  );
}
