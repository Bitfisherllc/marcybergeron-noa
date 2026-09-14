import Link from "next/link";
import { deleteSeries } from "@/app/admin/actions";
import type { Series } from "@/db";
import { AdminArtworkSiteEdit } from "@/components/AdminArtworkSiteEdit";
import { AdminDeleteSeriesForm } from "@/components/AdminDeleteSeriesForm";
import { GalleryLightboxProvider, GalleryLightboxTrigger } from "@/components/GalleryLightbox";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { StatementSlideshow } from "@/components/StatementSlideshow";
import { getAdminSession } from "@/lib/auth";
import { resolveInteriorHeroSlides } from "@/lib/featuredArtwork";
import { slideFromArtwork, slideFromArtworkCached, slideFromSeriesHero, type GallerySlide } from "@/lib/gallerySlides";
import { artworkStoredDimensions } from "@/lib/imageDimensions";
import { isMediumGallerySlug, isStudioGallerySlug } from "@/lib/mediumGalleries";
import { isOilColdWaxChildSlug, SERIES_INDEX_HREF } from "@/lib/oilColdWaxSeries";
import { isPrivateGallery } from "@/lib/privateGalleries";
import { getSeriesDeleteImpact } from "@/lib/seriesDelete";
import {
  getArtworkGalleryMeta,
  getOilColdWaxChildNeighbors,
  getSeriesNeighbors,
  listAdminSeriesMembershipOptions,
  listArtworksForPublicGallery,
  listHeroSlideshowSlots,
  listMediumGalleries,
} from "@/lib/queries";
import { artSeriesHref } from "@/lib/routeSlug";
import { seriesInquiryHref } from "@/lib/seriesInquiry";

type SeriesGalleryViewProps = {
  series: Series;
  variant: "public" | "private";
};

function GalleryAbout({
  heading,
  content,
  inquireHref,
  inquireLabel,
}: {
  heading: string;
  content: string;
  inquireHref?: string;
  inquireLabel?: string;
}) {
  return (
    <div className="space-y-8">
      <h2 className="font-serif text-2xl tracking-tight">{heading}</h2>
      <ProseMarkdown content={content} />
      {inquireHref ? (
        <div className="border-t border-line pt-8">
          <Link href={inquireHref} className="link-quiet text-sm tracking-wide">
            {inquireLabel ?? "Contact Marcy to learn more →"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export async function SeriesGalleryView({ series: s, variant }: SeriesGalleryViewProps) {
  const isStudioGallery = isStudioGallerySlug(s.slug);
  const showSlideshow = isStudioGallery || s.showHeroSlideshow;
  const [pieces, heroSlots] = await Promise.all([
    listArtworksForPublicGallery(s),
    showSlideshow ? listHeroSlideshowSlots(s.id) : Promise.resolve([]),
  ]);
  const isDeletableGallery = isPrivateGallery(s);
  const session = variant === "private" ? await getAdminSession() : null;
  const galleryMeta = await getArtworkGalleryMeta(pieces.map((p) => p.id));
  const adminLists = session
    ? await Promise.all([listMediumGalleries(), listAdminSeriesMembershipOptions()])
    : null;
  const isChildSeries = isOilColdWaxChildSlug(s.slug);
  const deleteImpact = session && isDeletableGallery ? await getSeriesDeleteImpact(s.id) : null;
  const { prev, next } =
    variant === "public"
      ? isChildSeries
        ? await getOilColdWaxChildNeighbors(s.slug)
        : isMediumGallerySlug(s.slug)
          ? await getSeriesNeighbors(s.slug)
          : { prev: null, next: null }
      : { prev: null, next: null };
  const returnPath = variant === "private" && s.accessToken ? `/private/${s.accessToken}` : artSeriesHref(s.slug);

  const aboutHeading = isChildSeries ? "Series statement" : "About";
  const inquireHref = isStudioGallery ? undefined : seriesInquiryHref(s.slug);
  const inquireLabel = isChildSeries
    ? "Contact Marcy to learn more about this series and how to purchase →"
    : "Contact Marcy to learn more about this medium and how to purchase →";
  const heroResolved = showSlideshow ? resolveInteriorHeroSlides(s, pieces, heroSlots) : [];
  const lightboxByArtworkId = new Map<string, number>();
  const lightboxSlides: GallerySlide[] = [];
  const heroLightboxIndex: number[] = [];
  const pushArtworkSlide = async (piece: (typeof pieces)[number]) => {
    if (lightboxByArtworkId.has(piece.id)) return;
    const meta = galleryMeta.get(piece.id);
    const slideMeta = {
      portfolioSeries: meta?.portfolioSeries ?? [],
      mediumGallery: meta?.mediumSeries ?? null,
    };
    const slide = artworkStoredDimensions(piece)
      ? slideFromArtworkCached(piece, slideMeta)
      : await slideFromArtwork(piece, slideMeta);
    lightboxByArtworkId.set(piece.id, lightboxSlides.length);
    lightboxSlides.push(
      isStudioGallery
        ? { ...slide, hideTitle: true, title: "", portfolioSeries: [], mediumGallery: null }
        : slide,
    );
  };
  for (const [slot, hero] of heroResolved.entries()) {
    if (hero.artwork) {
      await pushArtworkSlide(hero.artwork);
      heroLightboxIndex.push(lightboxByArtworkId.get(hero.artwork.id) ?? 0);
    } else {
      heroLightboxIndex.push(lightboxSlides.length);
      lightboxSlides.push({
        ...(await slideFromSeriesHero(s, { subtitle: "Featured work", image: hero.image, slot })),
        ...(isStudioGallery ? { hideTitle: true, subtitle: "" } : {}),
      });
    }
  }
  for (const piece of pieces) {
    await pushArtworkSlide(piece);
  }
  const slideshowSlides = heroResolved.map((hero, i) => {
    const standalone = hero.artwork ? null : lightboxSlides[heroLightboxIndex[i] ?? -1];
    return {
      src: hero.image,
      alt: hero.alt,
      title: hero.title,
      width: hero.artwork?.imageWidth ?? standalone?.width,
      height: hero.artwork?.imageHeight ?? standalone?.height,
      lightboxIndex: heroLightboxIndex[i] ?? 0,
    };
  });

  const studioHero = isStudioGallery && showSlideshow;

  return (
    <article>
      <GalleryLightboxProvider slides={lightboxSlides}>
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          {studioHero ? (
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-xs tracking-[0.22em] text-muted uppercase">Studio</p>
                <h1 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">{s.title}</h1>
                <p className="mt-6 text-base leading-relaxed text-muted">{s.excerpt}</p>
                <div className="mt-10">
                  <GalleryAbout
                    heading={aboutHeading}
                    content={s.content}
                    inquireHref={inquireHref}
                    inquireLabel={inquireLabel}
                  />
                </div>
              </div>
              <StatementSlideshow slides={slideshowSlides} frame="landscape" />
            </div>
          ) : (
            <>
              <p className="text-xs tracking-[0.22em] text-muted uppercase">
                {variant === "private" ? "Private gallery" : isChildSeries ? "Series" : "Portfolio"}
              </p>
              <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{s.title}</h1>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">{s.excerpt}</p>
              {isChildSeries ? (
                <p className="mt-4">
                  <Link href={SERIES_INDEX_HREF} className="link-quiet text-sm tracking-wide">
                    ← All series
                  </Link>
                </p>
              ) : null}
              {variant === "private" ? (
                <p className="mt-4 max-w-3xl text-sm text-muted">
                  This gallery is shared privately for review—it is not listed on the public portfolio.
                </p>
              ) : null}
              {!showSlideshow ? (
                <div className="mt-10 max-w-3xl">
                  <GalleryAbout
                    heading={aboutHeading}
                    content={s.content}
                    inquireHref={inquireHref}
                    inquireLabel={inquireLabel}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </header>

        {showSlideshow && !isStudioGallery ? (
          <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <StatementSlideshow slides={slideshowSlides} />
              <GalleryAbout
                heading={aboutHeading}
                content={s.content}
                inquireHref={inquireHref}
                inquireLabel={inquireLabel}
              />
            </div>
          </section>
        ) : null}

        <section className={`${showSlideshow && !isStudioGallery ? "border-t border-line " : ""}bg-white/35`}>
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
            <h2 className="font-serif text-3xl tracking-tight">{s.title}</h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              Click an image to view it larger, with title and details.
            </p>
            <div className="mt-12 grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:grid-cols-3">
              {pieces.map((p) => (
                  <figure key={p.id}>
                    <GalleryLightboxTrigger
                      index={lightboxByArtworkId.get(p.id) ?? 0}
                      label={`Enlarge: ${p.title}`}
                    >
                      <IntrinsicGalleryImage
                        src={p.image}
                        alt={p.alt}
                        width={p.imageWidth}
                        height={p.imageHeight}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        frame="portrait"
                      />
                    </GalleryLightboxTrigger>
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
              ))}
            </div>
          </div>
        </section>
      </GalleryLightboxProvider>

      {variant === "public" && (prev || next) ? (
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
            {isChildSeries ? (
              <Link href={SERIES_INDEX_HREF} className="text-sm tracking-wide text-muted hover:text-ink">
                ← Back to series
              </Link>
            ) : isStudioGallery ? (
              <Link href="/about" className="text-sm tracking-wide text-muted hover:text-ink">
                ← Back to About
              </Link>
            ) : (
              <Link href="/medium" className="text-sm tracking-wide text-muted hover:text-ink">
                ← Back to portfolio
              </Link>
            )}
          </div>
        </section>
      ) : null}
    </article>
  );
}
