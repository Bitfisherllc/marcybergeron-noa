import Link from "next/link";
import type { Series } from "@/db";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { resolveStatementArtwork } from "@/lib/featuredArtwork";
import { listArtworksForMediumGallery, getSeriesNeighbors } from "@/lib/queries";
import { artSeriesHref } from "@/lib/routeSlug";
import { seriesInquiryHref } from "@/lib/seriesInquiry";

type OilColdWaxHubViewProps = {
  parent: Series;
  childSeries: Series[];
};

export async function OilColdWaxHubView({ parent, childSeries }: OilColdWaxHubViewProps) {
  const [{ prev, next }, portfolioPieces] = await Promise.all([
    getSeriesNeighbors(parent.slug),
    listArtworksForMediumGallery(parent.id),
  ]);
  const statementArtwork = resolveStatementArtwork(parent, portfolioPieces);

  return (
    <article>
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Portfolio</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{parent.title}</h1>
          {parent.excerpt ? (
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">{parent.excerpt}</p>
          ) : null}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <IntrinsicGalleryImage
            src={statementArtwork.image}
            alt={statementArtwork.alt}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            frameClassName="border border-line"
          />
          <div className="space-y-8">
            <h2 className="font-serif text-2xl tracking-tight">Portfolio statement</h2>
            <ProseMarkdown content={parent.content} />
            <div className="border-t border-line pt-8">
              <Link href={seriesInquiryHref(parent.slug)} className="link-quiet text-sm tracking-wide">
                Inquire about this portfolio →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white/35">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl tracking-tight">Series</h2>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
            Choose a series to view its gallery.
          </p>
          {childSeries.length === 0 ? (
            <p className="mt-10 text-sm text-muted">Series will appear here once they are published.</p>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {childSeries.map((s) => (
                <article key={s.id} className="group border border-line bg-white/40">
                  <Link href={artSeriesHref(s.slug)} className="focus-ring block">
                    <IntrinsicGalleryImage
                      src={s.featuredImage}
                      alt={`${s.title} — featured artwork`}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      imageClassName="transition duration-500 group-hover:scale-[1.01]"
                    />
                    <div className="px-6 py-7">
                      <h3 className="font-serif text-2xl tracking-tight">{s.title}</h3>
                      {s.excerpt ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted">{s.excerpt}</p>
                      ) : null}
                      <span className="mt-3 inline-flex text-xs tracking-[0.18em] text-ink/70 uppercase">
                        View series →
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

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

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <Link href="/medium" className="text-sm tracking-wide text-muted hover:text-ink">
            ← Back to portfolio
          </Link>
        </div>
      </section>
    </article>
  );
}
