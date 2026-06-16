import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtCaption, captionSubtitle } from "@/components/ArtCaption";
import { GalleryLightboxProvider, GalleryLightboxTrigger } from "@/components/GalleryLightbox";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { slideFromArtwork, slideFromSeriesHero } from "@/lib/gallerySlides";
import { getSeriesBySlug, getSeriesNeighbors, listArtworksForSeries, listSeries } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

/** Build-time paths for SSG; if Postgres is unreachable (e.g. no local Docker), skip rather than fail `next build`. */
export async function generateStaticParams() {
  try {
    const rows = await listSeries();
    return rows.map((s) => ({ slug: s.slug }));
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
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) return {};
  return {
    title: `${s.title} Series`,
    description: s.excerpt,
    alternates: { canonical: `${SITE_URL}/art/${s.slug}` },
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) notFound();
  const pieces = await listArtworksForSeries(s.id);
  const { prev, next } = await getSeriesNeighbors(slug);

  const heroSlide = await slideFromSeriesHero(s);
  const pieceSlides = await Promise.all(pieces.map(slideFromArtwork));
  const lightboxSlides = [heroSlide, ...pieceSlides];

  return (
    <article>
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Series</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{s.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">{s.excerpt}</p>
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
              <h2 className="font-serif text-2xl tracking-tight">Series statement</h2>
              <ProseMarkdown content={s.content} />
              <div className="border-t border-line pt-8">
                <Link href="/contact" className="link-quiet text-sm tracking-wide">
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
              {pieces.map((p, i) => (
                <figure key={p.id} className="border border-line bg-white/30 p-4">
                  <GalleryLightboxTrigger index={i + 1} label={`Enlarge: ${p.title}`}>
                    <IntrinsicGalleryImage
                      src={p.image}
                      alt={p.alt}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </GalleryLightboxTrigger>
                  <ArtCaption
                    title={p.title}
                    subtitle={captionSubtitle({ medium: p.medium, size: p.size, year: p.year })}
                    status={p.status}
                  />
                  {p.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted">{p.description}</p>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        </section>
      </GalleryLightboxProvider>

      <nav className="border-t border-line" aria-label="Series pagination">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            {prev ? (
              <Link className="link-quiet" href={`/art/${prev.slug}`}>
                ← Previous: {prev.title}
              </Link>
            ) : (
              <span />
            )}
          </div>
          <div className="text-right">
            {next ? (
              <Link className="link-quiet" href={`/art/${next.slug}`}>
                Next: {next.title} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </nav>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <Link href="/art" className="text-sm tracking-wide text-muted hover:text-ink">
            ← Back to all series
          </Link>
        </div>
      </section>
    </article>
  );
}
