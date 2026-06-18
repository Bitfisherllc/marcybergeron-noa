import type { Metadata } from "next";
import Link from "next/link";
import type { Artwork, Series } from "@/db";
import { AdminArtworkSiteEdit } from "@/components/AdminArtworkSiteEdit";
import { ArtCaption, captionSubtitle } from "@/components/ArtCaption";
import { GalleryLightboxProvider, GalleryLightboxTrigger } from "@/components/GalleryLightbox";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import { getAdminSession } from "@/lib/auth";
import { slideFromArtwork } from "@/lib/gallerySlides";
import { ALL_WORK_EXCERPT, ALL_WORK_TITLE } from "@/lib/portfolioGalleries";
import { listAllArtworksWithSeries, getArtworkGalleryMeta, listMediumGalleries, listPortfolioSeries } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: ALL_WORK_TITLE,
  description: ALL_WORK_EXCERPT,
  alternates: { canonical: `${SITE_URL}/art/all-work` },
};

type SeriesGroup = {
  ser: Series;
  pieces: Artwork[];
};

function groupArtworksBySeries(
  rows: Awaited<ReturnType<typeof listAllArtworksWithSeries>>,
): SeriesGroup[] {
  const groups: SeriesGroup[] = [];
  for (const { piece, ser } of rows) {
    const last = groups[groups.length - 1];
    if (last?.ser.id === ser.id) {
      last.pieces.push(piece);
    } else {
      groups.push({ ser, pieces: [piece] });
    }
  }
  return groups;
}

export default async function AllWorkPage() {
  const rows = await listAllArtworksWithSeries();
  const groups = groupArtworksBySeries(rows);
  const session = await getAdminSession();
  const pieceIds = [...new Set(rows.map(({ piece }) => piece.id))];
  const [slides, galleryMeta, adminLists] = await Promise.all([
    Promise.all(rows.map(({ piece }) => slideFromArtwork(piece))),
    getArtworkGalleryMeta(pieceIds),
    session ? Promise.all([listMediumGalleries(), listPortfolioSeries()]) : Promise.resolve(null),
  ]);

  let slideIndex = 0;

  return (
    <article>
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Portfolio</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{ALL_WORK_TITLE}</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">{ALL_WORK_EXCERPT}</p>
        </div>
      </header>

      <GalleryLightboxProvider slides={slides}>
        <div className="border-t border-line bg-white/35">
          {groups.length === 0 ? (
            <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
              <p className="text-sm text-muted">Paintings will appear here as galleries are published.</p>
            </div>
          ) : (
            groups.map((group, groupIdx) => (
              <section
                key={group.ser.id}
                className={groupIdx > 0 ? "border-t border-line" : undefined}
                aria-labelledby={`all-work-series-${group.ser.id}`}
              >
                <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
                  <div className="max-w-3xl">
                    <p className="text-xs tracking-[0.22em] text-muted uppercase">Series</p>
                    <h2 id={`all-work-series-${group.ser.id}`} className="mt-3 font-serif text-3xl tracking-tight">
                      <Link href={`/art/${group.ser.slug}`} className="hover:text-ink/80 focus-ring rounded-sm">
                        {group.ser.title}
                      </Link>
                    </h2>
                    {group.ser.excerpt ? (
                      <p className="mt-4 text-sm leading-relaxed text-muted">{group.ser.excerpt}</p>
                    ) : null}
                    <Link
                      href={`/art/${group.ser.slug}`}
                      className="mt-4 inline-flex text-xs tracking-[0.18em] text-ink/70 uppercase hover:text-ink"
                    >
                      Open gallery →
                    </Link>
                  </div>

                  <div className="mt-12 grid gap-12 sm:grid-cols-2 sm:items-start lg:grid-cols-3">
                    {group.pieces.map((piece) => {
                      const index = slideIndex++;
                      return (
                        <figure key={piece.id} className="border border-line bg-white/30 p-4">
                          <GalleryLightboxTrigger index={index} label={`Enlarge: ${piece.title}`}>
                            <IntrinsicGalleryImage
                              src={piece.image}
                              alt={piece.alt}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </GalleryLightboxTrigger>
                          <ArtCaption
                            title={piece.title}
                            subtitle={captionSubtitle({
                              medium: piece.medium,
                              size: piece.size,
                            })}
                            status={piece.status}
                            artworkId={piece.id}
                          />
                          {piece.description ? (
                            <p className="mt-3 text-sm leading-relaxed text-muted">{piece.description}</p>
                          ) : null}
                          {session && adminLists ? (
                            <AdminArtworkSiteEdit
                              artworkId={piece.id}
                              title={piece.title}
                              mediumSeriesId={piece.mediumSeriesId}
                              selectedSeriesIds={(galleryMeta.get(piece.id)?.portfolioSeries ?? []).map((ser) => ser.id)}
                              portfolioSeries={adminLists[1]}
                              mediumGalleries={adminLists[0]}
                              status={piece.status}
                              returnPath="/art/all-work"
                            />
                          ) : null}
                        </figure>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))
          )}
        </div>
      </GalleryLightboxProvider>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <Link href="/art" className="text-sm tracking-wide text-muted hover:text-ink">
            ← Back to portfolio
          </Link>
        </div>
      </section>
    </article>
  );
}
