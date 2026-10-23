import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeriesGalleryView } from "@/components/SeriesGalleryView";
import { exhibitionPublicHref, isExhibitionsParentSlug } from "@/lib/exhibitions";
import { hasPriceViewSession } from "@/lib/priceAccess";
import { getSeriesById, getSeriesBySlug, listExhibitions } from "@/lib/queries";
import { normalizeRouteSlug } from "@/lib/routeSlug";
import { richTextToPlain } from "@/lib/richText";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const rows = await listExhibitions();
    return rows.map((s) => ({ slug: s.slug }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[exhibitions/[slug]] generateStaticParams: could not list exhibitions —", msg);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const s = await getSeriesBySlug(normalizeRouteSlug(rawSlug));
  if (!s || s.isPrivate || !s.parentSeriesId) return {};
  const parent = await getSeriesById(s.parentSeriesId);
  if (!parent || !isExhibitionsParentSlug(parent.slug)) return {};
  return {
    title: `${s.title} Exhibition`,
    description: richTextToPlain(s.excerpt),
    alternates: { canonical: `${SITE_URL}${exhibitionPublicHref(s.slug)}` },
  };
}

export default async function ExhibitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ prices?: string }>;
}) {
  const [{ slug: rawSlug }, sp] = await Promise.all([params, searchParams]);
  const s = await getSeriesBySlug(normalizeRouteSlug(rawSlug));
  if (!s || s.isPrivate || !s.parentSeriesId) notFound();
  const parent = await getSeriesById(s.parentSeriesId);
  if (!parent || !isExhibitionsParentSlug(parent.slug)) notFound();
  const showPrices = await hasPriceViewSession();
  return (
    <SeriesGalleryView
      series={s}
      variant="public"
      surface="exhibition"
      showPrices={showPrices}
      priceLoginError={sp.prices === "1"}
    />
  );
}
