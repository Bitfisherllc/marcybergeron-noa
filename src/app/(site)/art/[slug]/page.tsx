import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeriesGalleryView } from "@/components/SeriesGalleryView";
import { getAdminSession } from "@/lib/auth";
import { isPrivateGallery } from "@/lib/privateGalleries";
import { getSeriesBySlug, listSeries } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";
import { artSeriesHref, normalizeRouteSlug } from "@/lib/routeSlug";

/** Build-time paths for SSG; if Postgres is unreachable (e.g. no local Docker), skip rather than fail `next build`. */
export async function generateStaticParams() {
  try {
    const rows = await listSeries();
    return rows.filter((s) => !s.isPrivate).map((s) => ({ slug: s.slug }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[art/[slug]] generateStaticParams: could not list series —", msg);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const s = await getSeriesBySlug(slug);
  if (!s || isPrivateGallery(s)) return {};
  return {
    title: `${s.title} Series`,
    description: s.excerpt,
    alternates: { canonical: `${SITE_URL}${artSeriesHref(s.slug)}` },
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const s = await getSeriesBySlug(slug);
  if (!s) notFound();

  if (isPrivateGallery(s)) {
    const session = await getAdminSession();
    if (!session) notFound();
  }

  return <SeriesGalleryView series={s} variant="public" />;
}
