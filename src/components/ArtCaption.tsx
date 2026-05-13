export function ArtCaption({
  title,
  subtitle,
  status,
}: {
  title: string;
  subtitle: string;
  status?: string;
}) {
  const statusLabel =
    status === "sold" ? "Sold" : status === "available" ? "Available" : status === "unknown" ? "" : status;
  return (
    <figcaption className="mt-4 max-w-prose space-y-1">
      <div className="font-serif text-lg font-medium tracking-tight text-ink">{title}</div>
      <div className="text-sm font-normal leading-relaxed text-muted">{subtitle}</div>
      {statusLabel ? (
        <div className="text-xs tracking-wide text-muted">{statusLabel}</div>
      ) : null}
    </figcaption>
  );
}

export function captionSubtitle(parts: { medium?: string; size?: string; year?: string }) {
  return [parts.medium, parts.size, parts.year].filter(Boolean).join(" · ");
}
