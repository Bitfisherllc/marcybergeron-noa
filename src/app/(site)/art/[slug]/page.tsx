import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SeriesGalleryView } from "@/components/SeriesGalleryView";
import { getAdminSession } from "@/lib/auth";
import { exhibitionPublicHref, EXHIBITIONS_PARENT_SLUG, isExhibitionsParentSlug } from "@/lib/exhibitions";
import { isMediumGallerySlug, legacyMediumGalleryRedirect } from "@/lib/mediumGalleries";
import { retiredSeriesRedirect } from "@/lib/oilColdWaxSeries";
import { isAllWorkSlug } from "@/lib/portfolioGalleries";
import { isPrivateGallery } from "@/lib/privateGalleries";
import { getSeriesById, getSeriesBySlug } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";
import { richTextToPlain } from "@/lib/richText";
import { artSeriesHref, normalizeRouteSlug } from "@/lib/routeSlug";

/** Signed-in hide controls read the admin cookie, so this page cannot be cached as a static file. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  let slug = normalizeRouteSlug(rawSlug);
  const retiredTarget = retiredSeriesRedirect(slug);
  if (retiredTarget) slug = retiredTarget;
  const legacyTarget = legacyMediumGalleryRedirect(slug);
  if (legacyTarget) slug = legacyTarget;
  const s = await getSeriesBySlug(slug);
  if (!s || isPrivateGallery(s)) return {};
  if (s.slug === EXHIBITIONS_PARENT_SLUG) {
    return {
      title: "Exhibitions",
      alternates: { canonical: `${SITE_URL}/exhibitions` },
    };
  }
  if (s.parentSeriesId) {
    const parent = await getSeriesById(s.parentSeriesId);
    if (parent && isExhibitionsParentSlug(parent.slug)) {
      return {
        title: `${s.title} Exhibition`,
        description: richTextToPlain(s.excerpt),
        alternates: { canonical: `${SITE_URL}${exhibitionPublicHref(s.slug)}` },
      };
    }
  }
  return {
    title: `${s.title} Series`,
    description: richTextToPlain(s.excerpt),
    alternates: { canonical: `${SITE_URL}${artSeriesHref(s.slug)}` },
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const retiredTarget = retiredSeriesRedirect(slug);
  if (retiredTarget) redirect(artSeriesHref(retiredTarget));
  const legacyTarget = legacyMediumGalleryRedirect(slug);
  if (legacyTarget) redirect(artSeriesHref(legacyTarget));

  const s = await getSeriesBySlug(slug);
  if (!s) notFound();

  if (s.slug === EXHIBITIONS_PARENT_SLUG) redirect("/exhibitions");
  if (s.parentSeriesId) {
    const parent = await getSeriesById(s.parentSeriesId);
    if (parent && isExhibitionsParentSlug(parent.slug)) redirect(exhibitionPublicHref(s.slug));
  }

  if (isAllWorkSlug(slug) || (!isMediumGallerySlug(slug) && !s.parentSeriesId && !isPrivateGallery(s))) {
    redirect("/medium");
  }

  if (isPrivateGallery(s)) {
    const session = await getAdminSession();
    if (!session) notFound();
  }

  return <SeriesGalleryView series={s} variant="public" />;
}
