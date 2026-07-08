import Link from "next/link";
import { deleteSeries } from "@/app/admin/actions";
import type { Series } from "@/db";
import { AdminArtworkSiteEdit } from "@/components/AdminArtworkSiteEdit";
import { AdminDeleteSeriesForm } from "@/components/AdminDeleteSeriesForm";
import { ArtworkGalleryCaption } from "@/components/ArtworkGalleryCaption";
import { GalleryLightboxProvider, GalleryLightboxTrigger } from "@/components/GalleryLightbox";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { getAdminSession } from "@/lib/auth";
import { slideFromArtwork, slideFromSeriesHero } from "@/lib/gallerySlides";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { isPrivateGallery } from "@/lib/privateGalleries";
import { getSeriesDeleteImpact } from "@/lib/seriesDelete";
import {
  getArtworkGalleryMeta,
  getSeriesNeighbors,
  listArtworksForPublicGallery,
  listAdminSeriesMembershipOptions,
  listMediumGalleries,
} from "@/lib/queries";
import { artSeriesHref } from "@/lib/routeSlug";
import { seriesInquiryHref } from "@/lib/seriesInquiry";

type SeriesGalleryViewProps = {
  series: Series;
  variant: "public" | "private";
};

export async function SeriesGalleryView({ series: s, variant }: SeriesGalleryViewProps) {
  const pieces = await listArtworksForPublicGallery(s);
  const isDeletableGallery = isPrivateGallery(s);
  const session = await getAdminSession();
  const galleryMeta = await getArtworkGalleryMeta(pieces.map((p) => p.id));
  const adminLists = session
    ? await Promise.all([listMediumGalleries(), listAdminSeriesMembershipOptions()])
    : null;
  const deleteImpact = session && isDeletableGallery ? await getSeriesDeleteImpact(s.id) : null;
  const { prev, next } = variant === "public" && isMediumGallerySlug(s.slug) ? await getSeriesNeighbors(s.slug) : { prev: null, next: null };
  const returnPath = variant === "private" && s.accessToken ? `/private/${s.accessToken}` : artSeriesHref(s.slug);

  const heroSlide = await slideFromSeriesHero(s);
  const pieceSlides = await Promise.all(
    pieces.map((p) => {
      const meta = galleryMeta.get(p.id);
      return slideFromArtwork(p, {
        portfolioSeries: meta?.portfolioSeries ?? [],
        mediumGallery: meta?.mediumSeries ?? null,
      });
    }),
  );
  const lightboxSlides = [heroSlide, ...pieceSlides];

  return (
    <article>
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">
            {variant === "private" ? "Private gallery" : "Portfolio"}
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{s.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">{s.excerpt}</p>
          {variant === "private" ? (
            <p className="mt-4 max-w-3xl text-sm text-muted">
              This gallery is shared privately for review—it is not listed on the public portfolio.
            </p>
          ) : null}
        </div>
      </header>

      <GalleryLightboxProvider slides={lightboxSlides}>
        <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <GalleryLightboxTrigger index={0} label={`Enlarge featured image: ${s.title}`}>
              <IntrinsicGalleryImage
                src={s.featuredImage}
                alt={`${s.title} — featured artwork`}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                frameClassName="border border-line"
              />
            </GalleryLightboxTrigger>
            <div className="space-y-8">
              <h2 className="font-serif text-2xl tracking-tight">Portfolio statement</h2>
              <ProseMarkdown content={s.content} />
              <div className="border-t border-line pt-8">
                <Link href={seriesInquiryHref(s.slug)} className="link-quiet text-sm tracking-wide">
                  Inquire about this series →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-white/35">
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
            <h2 className="font-serif text-3xl tracking-tight">Gallery</h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              Click an image to view it larger. Captions appear beneath each thumbnail and in the lightbox.
            </p>
            <div className="mt-12 grid gap-12 sm:grid-cols-2 sm:items-start">
              {pieces.map((p, i) => {
                const meta = galleryMeta.get(p.id);
                return (
                  <figure key={p.id} className="border border-line bg-white/30 p-4">
                    <GalleryLightboxTrigger index={i + 1} label={`Enlarge: ${p.title}`}>
                      <IntrinsicGalleryImage src={p.image} alt={p.alt} sizes="(max-width: 768px) 100vw, 50vw" />
                    </GalleryLightboxTrigger>
                    <ArtworkGalleryCaption
                      title={p.title}
                      medium={p.medium}
                      size={p.size}
                      portfolioSeries={meta?.portfolioSeries ?? []}
                      mediumGallery={meta?.mediumSeries ?? null}
                      description={p.description || undefined}
                      status={p.status}
                      artworkId={p.id}
                    />
                    {session && adminLists ? (
                      <AdminArtworkSiteEdit
                        artworkId={p.id}
                        title={p.title}
                        mediumSeriesId={p.mediumSeriesId}
                        mediumGalleries={adminLists[0]}
                        status={p.status}
                        returnPath={returnPath}
                      />
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      </GalleryLightboxProvider>

      {variant === "public" ? (
        <nav className="border-t border-line" aria-label="Series pagination">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              {prev ? (
                <Link className="link-quiet" href={artSeriesHref(prev.slug)}>
                  ← Previous: {prev.title}
                </Link>
              ) : (
                <span />
              )}
            </div>
            <div className="text-right">
              {next ? (
                <Link className="link-quiet" href={artSeriesHref(next.slug)}>
                  Next: {next.title} →
                </Link>
              ) : (
                <span />
              )}
            </div>
          </div>
        </nav>
      ) : null}

      {session && deleteImpact && adminLists ? (
        <section className="border-t border-red-200/80 bg-red-50/30">
          <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
            <p className="text-xs tracking-[0.18em] text-red-900/70 uppercase">Admin</p>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-ink">Delete this gallery</h2>
            <div className="mt-6 max-w-xl">
              <AdminDeleteSeriesForm
                action={deleteSeries}
                impact={deleteImpact}
                portfolioOptions={adminLists[1]
                  .filter((row) => row.id !== s.id)
                  .map((row) => ({ id: row.id, title: row.title }))}
                mediumOptions={adminLists[0]
                  .filter((row) => row.id !== s.id)
                  .map((row) => ({ id: row.id, title: row.title }))}
                returnTo={returnPath}
                redirectAfter={variant === "private" ? "/admin/series" : "/medium"}
                explainBelow
              />
            </div>
          </div>
        </section>
      ) : null}

      {variant === "public" ? (
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
            <Link href="/medium" className="text-sm tracking-wide text-muted hover:text-ink">
              ← Back to portfolio
            </Link>
          </div>
        </section>
      ) : null}
    </article>
  );
}
