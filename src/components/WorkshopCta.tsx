import Link from "next/link";
import { workshopDatesLabel, workshopInterestHref, workshopMaterialsLine } from "@/lib/workshopCopy";

export function WorkshopInterestButton({
  slug,
  className = "",
  label = "Inquire",
}: {
  slug: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href={workshopInterestHref(slug)}
      className={`inline-flex items-center border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90 focus-ring ${className}`}
    >
      {label}
    </Link>
  );
}

export function WorkshopDetailsNote({
  sessionDates,
  materialsNote,
}: {
  sessionDates?: string | null;
  materialsNote?: string | null;
}) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted">
      <p>{workshopDatesLabel(sessionDates)}</p>
      <p>{workshopMaterialsLine(materialsNote)}</p>
    </div>
  );
}
