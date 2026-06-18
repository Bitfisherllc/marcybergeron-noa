import type { Series } from "@/db";

export function seriesInquiryHref(seriesSlug: string): string {
  return `/contact?series=${encodeURIComponent(seriesSlug)}`;
}

export function buildSeriesInquiryMessage(series: Pick<Series, "title">): string {
  return [
    `I am interested in the "${series.title}" series and have a few questions.`,
    "",
    "I may also be interested in commissioning something similar.",
    "",
    "Please let me know if you would be open to a conversation.",
  ].join("\n");
}
