import { postPublicHref } from "@/lib/postKind";
import { DEFAULT_WORKSHOP_PRICE, formatWorkshopPrice } from "@/lib/workshopPrice";

export const WORKSHOP_MATERIALS_DEFAULT =
  "Workshops include all materials unless otherwise noted.";

export const WORKSHOP_PRICE_FLOOR_NOTE = `Workshops start at ${formatWorkshopPrice(DEFAULT_WORKSHOP_PRICE)}.`;

export function parseSessionDates(raw: string | null | undefined): string[] {
  return String(raw ?? "")
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function workshopDatesLabel(raw: string | null | undefined): string {
  const dates = parseSessionDates(raw);
  return dates.length > 0 ? `Dates ${dates.join(" · ")}` : "Dates TBA";
}

export function workshopMaterialsLine(note: string | null | undefined): string {
  const custom = String(note ?? "").trim();
  return custom || WORKSHOP_MATERIALS_DEFAULT;
}

export function workshopInterestHref(slug: string): string {
  return `${postPublicHref("workshop", slug)}/interest`;
}

export function workshopFormatLabel(format: string): string {
  if (format === "group") return "Private group workshop";
  if (format === "solo") return "Solo private workshop";
  return "Scheduled class";
}
