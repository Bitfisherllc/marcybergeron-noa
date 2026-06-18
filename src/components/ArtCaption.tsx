import { ArtworkInquiryLink } from "@/components/ArtworkInquiryLink";

export function ArtCaption({
  title,
  subtitle,
  status,
  artworkId,
  as: Tag = "figcaption",
}: {
  title: string;
  subtitle: string;
  status?: string;
  artworkId?: string;
  as?: "figcaption" | "div";
}) {
  return (
    <Tag className="mt-4 max-w-prose space-y-1">
      <div className="font-serif text-lg font-medium tracking-tight text-ink">{title}</div>
      <div className="text-sm font-normal leading-relaxed text-muted">{subtitle}</div>
      {status === "available" && artworkId ? (
        <div className="pt-1">
          <ArtworkInquiryLink artworkId={artworkId} />
        </div>
      ) : null}
    </Tag>
  );
}

export function captionSubtitle(parts: { medium?: string; size?: string }) {
  return [parts.medium, parts.size].filter(Boolean).join(" · ");
}
