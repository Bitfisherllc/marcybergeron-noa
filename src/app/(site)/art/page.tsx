import type { Metadata } from "next";
import Link from "next/link";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import {
  ALL_WORK_EXCERPT,
  ALL_WORK_HREF,
  ALL_WORK_TITLE,
  seriesForPortfolioNav,
} from "@/lib/portfolioGalleries";
import { listAllArtworksWithSeries, listSeries } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Browse abstract painting series by Marcy Bergeron-Noa—Wayfinding, Beyond the Surface, In Search of Solace, Diastole, 3 Dimensional Works, New Work, and more.",
  alternates: { canonical: `${SITE_URL}/art` },
};

export default async function ArtPage() {
  const [seriesRaw, allWorkRows] = await Promise.all([listSeries(), listAllArtworksWithSeries()]);
  const series = seriesForPortfolioNav(seriesRaw);
  const allWorkCover = allWorkRows[0]?.piece.image ?? GALLERY_PLACEHOLDER_IMAGE;

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Portfolio</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Series</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            The work is grouped by series—each one a doorway into a body of work. Read the excerpt, feel the
            tone, then enter when you are ready.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-white/35">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl tracking-tight">Series</h2>
            <div className="mx-auto mt-5 h-px w-16 bg-line" />
            <p className="mt-6 text-sm leading-relaxed text-muted">
              Each card includes a featured image, title, excerpt, and a link into the full gallery.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <article className="group border border-line bg-white/40">
              <Link href={ALL_WORK_HREF} className="focus-ring block">
                <IntrinsicGalleryImage
                  src={allWorkCover}
                  alt={`${ALL_WORK_TITLE} — featured artwork`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  imageClassName="transition duration-500 group-hover:scale-[1.01]"
                />
                <div className="px-6 py-7">
                  <h3 className="font-serif text-3xl tracking-tight">{ALL_WORK_TITLE}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{ALL_WORK_EXCERPT}</p>
                  <span className="mt-3 inline-flex text-xs tracking-[0.18em] text-ink/70 uppercase">
                    Open gallery →
                  </span>
                </div>
              </Link>
            </article>
            {series.map((s) => (
              <article key={s.id} className="group border border-line bg-white/40">
                <Link href={`/art/${s.slug}`} className="focus-ring block">
                  <IntrinsicGalleryImage
                    src={s.featuredImage}
                    alt={`${s.title} — featured artwork`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    imageClassName="transition duration-500 group-hover:scale-[1.01]"
                  />
                  <div className="px-6 py-7">
                    <h3 className="font-serif text-3xl tracking-tight">{s.title}</h3>
                    {s.excerpt ? <p className="mt-3 text-sm leading-relaxed text-muted">{s.excerpt}</p> : null}
                    <span className="mt-3 inline-flex text-xs tracking-[0.18em] text-ink/70 uppercase">
                      Open series →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
