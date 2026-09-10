import type { Metadata } from "next";
import { GalleryIndexCards } from "@/components/GalleryIndexCards";
import { resolveStatementArtwork } from "@/lib/featuredArtwork";
import { publicPortfolioGalleries } from "@/lib/mediumGalleries";
import { listArtworksGroupedForMediumGalleries, listMediumGalleries } from "@/lib/queries";
import { artSeriesHref } from "@/lib/routeSlug";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Browse Marcy Bergeron-Noa’s portfolio—oil and cold wax, works on paper, encaustic, collage, and sculpture.",
  alternates: { canonical: `${SITE_URL}/medium` },
};

export default async function MediumPage() {
  const galleries = publicPortfolioGalleries(await listMediumGalleries());
  const piecesByGallery = await listArtworksGroupedForMediumGalleries(galleries);
  const cards = galleries.map((s) => {
    const pieces = piecesByGallery.get(s.id) ?? [];
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
  });

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Portfolio</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Portfolio</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            The work organized by material and process—each gallery a doorway into paintings, works on paper,
            encaustic, collage, and sculpture.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-white/35">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          {cards.length === 0 ? (
            <p className="text-center text-sm text-muted">Portfolio galleries will appear here once they are published.</p>
          ) : (
            <GalleryIndexCards cards={cards} cta="Open gallery →" />
          )}
        </div>
      </section>
    </div>
  );
}
