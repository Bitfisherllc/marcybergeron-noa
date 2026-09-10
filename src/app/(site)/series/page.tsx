import type { Metadata } from "next";
import { GalleryIndexCards } from "@/components/GalleryIndexCards";
import { resolveStatementArtwork } from "@/lib/featuredArtwork";
import { SERIES_INDEX_HREF } from "@/lib/oilColdWaxSeries";
import { listArtworksForSeries, listSeriesGalleries } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";
import { artSeriesHref } from "@/lib/routeSlug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Series",
  description:
    "Bodies of work by Marcy Bergeron-Noa—Standing Tall As Trees, Born in France, Mexico as Muse, and General-Oil & Cold Wax.",
  alternates: { canonical: `${SITE_URL}${SERIES_INDEX_HREF}` },
};

export default async function SeriesIndexPage() {
  const galleries = await listSeriesGalleries();
  const cards = await Promise.all(
    galleries.map(async (s) => {
      const pieces = await listArtworksForSeries(s.id);
      const featured = resolveStatementArtwork(s, pieces);
      return {
        id: s.id,
        href: artSeriesHref(s.slug),
        title: s.title,
        excerpt: s.excerpt,
        image: featured.image,
        alt: featured.alt,
        imageWidth: featured.artwork?.imageWidth,
        imageHeight: featured.artwork?.imageHeight,
      };
    }),
  );

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Series</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Series</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Distinct bodies of work—each series a focused collection within the studio practice.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-white/35">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          {cards.length === 0 ? (
            <p className="text-center text-sm text-muted">Series will appear here once they are published.</p>
          ) : (
            <GalleryIndexCards cards={cards} cta="View series →" />
          )}
        </div>
      </section>
    </div>
  );
}
