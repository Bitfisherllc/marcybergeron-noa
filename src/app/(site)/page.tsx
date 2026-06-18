import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminArtworkSiteEdit } from "@/components/AdminArtworkSiteEdit";
import { ArtCaption, captionSubtitle } from "@/components/ArtCaption";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { HomeJournalSlider } from "@/components/HomeJournalSlider";
import { HomeMarkdown } from "@/components/HomeMarkdown";
import {
  getResolvedFeaturedSeries,
  getResolvedHeroSlides,
  getResolvedHomeSection,
  getResolvedJournalPostsForHome,
  getResolvedSelectedWorks,
} from "@/lib/homePage";
import { getAdminSession } from "@/lib/auth";
import { toHeroSlide } from "@/lib/heroSlides";
import { getArtworkGalleryMeta, listMediumGalleries, listPortfolioSeries } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Marcy Bergeron-Noa | Abstract Artist Portfolio",
  description:
    "Paintings that listen beneath the surface—abstract work by Marcy Bergeron-Noa, organized in series and shown with quiet, gallery-like spacing.",
};

export default async function HomePage() {
  const [hero, featuredSec, journalSec, artistSec, selectedSec, featuredSeries, journalPostsRaw, selectedPicks, slides, session] =
    await Promise.all([
      getResolvedHomeSection("hero"),
      getResolvedHomeSection("featured_series"),
      getResolvedHomeSection("journal"),
      getResolvedHomeSection("artist_words"),
      getResolvedHomeSection("selected_works"),
      getResolvedFeaturedSeries(),
      getResolvedJournalPostsForHome(),
      getResolvedSelectedWorks(),
      getResolvedHeroSlides(),
      getAdminSession(),
    ]);

  const [galleryMeta, adminLists] = session
    ? await Promise.all([
        getArtworkGalleryMeta(selectedPicks.map(({ piece }) => piece.id)),
        Promise.all([listMediumGalleries(), listPortfolioSeries()]),
      ])
    : [null, null];

  const journalPosts = journalPostsRaw.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    featuredImage: p.featuredImage,
    dateLabel: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(
      p.publishedAt ?? p.updatedAt,
    ),
  }));

  let heroSlides = slides;
  if (heroSlides.length === 0) {
    heroSlides = [
      toHeroSlide(
        featuredSeries[0]?.featuredImage ?? "/images/logo.svg",
        featuredSeries[0]?.title ?? "",
        "Featured abstract painting",
      ),
    ];
  }

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:gap-16 md:px-8 md:py-20">
          <div className="order-2 md:order-1">
            {hero.eyebrow ? (
              <p className="text-xs tracking-[0.22em] text-muted uppercase">{hero.eyebrow}</p>
            ) : null}
            <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight md:text-5xl">{hero.title}</h1>
            <p className="mt-6 max-w-prose text-base leading-relaxed text-muted">{hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/art"
                className="inline-flex items-center border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90 focus-ring"
              >
                View portfolio
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center border border-line bg-transparent px-5 py-3 text-xs tracking-[0.18em] text-ink uppercase hover:bg-black/[0.03] focus-ring"
              >
                Studio &amp; contact
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <HeroSlideshow slides={heroSlides} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl tracking-tight">{featuredSec.title}</h2>
          <div className="mx-auto mt-5 h-px w-16 bg-line" />
          <p className="mt-6 text-sm leading-relaxed text-muted">{featuredSec.body}</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredSeries.map((s) => (
            <article key={s.id} className="group border border-line bg-white/40">
              <Link href={`/art/${s.slug}`} className="focus-ring block">
                <div className="relative aspect-[4/3] overflow-hidden bg-black/[0.03]">
                  <Image
                    src={s.featuredImage}
                    alt={`${s.title} — featured artwork`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="space-y-3 px-6 py-7">
                  <h3 className="font-serif text-2xl tracking-tight">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{s.excerpt}</p>
                  <span className="inline-flex text-xs tracking-[0.18em] text-ink/70 uppercase">
                    Enter series →
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {journalPosts.length > 0 ? (
        <section className="border-t border-line bg-white/35">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-3xl tracking-tight">{journalSec.title}</h2>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{journalSec.body}</p>
              </div>
              <Link href="/news" className="link-quiet shrink-0 text-sm tracking-wide">
                View all posts →
              </Link>
            </div>
            <div className="-mx-5 md:-mx-8">
              <HomeJournalSlider posts={journalPosts} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-y border-line bg-white/35">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-start md:gap-16 md:px-8 md:py-20">
          <div>
            <Image
              src="/images/logo.svg"
              alt="Marcy Bergeron-Noa — hand-drawn studio mark"
              width={512}
              height={1254}
              className="mb-6 h-[6.75rem] w-auto max-w-[16.5rem] object-contain brightness-0 sm:mb-8 sm:h-[7.5rem] sm:max-w-[19.5rem]"
            />
            <h2 className="font-serif text-3xl tracking-tight">{artistSec.title}</h2>
            <div className="mt-5 h-px w-16 bg-line" />
          </div>
          <blockquote className="space-y-6">
            {artistSec.quote ? (
              <p className="font-serif text-2xl leading-snug tracking-tight text-ink/90">“{artistSec.quote}”</p>
            ) : null}
            <HomeMarkdown markdown={artistSec.body} />
            <div className="pt-2">
              <Image
                src="/images/sig.svg"
                alt="Signature — Marcy Bergeron-Noa"
                width={1448}
                height={385}
                className="h-8 w-auto max-w-[12rem] object-contain object-left opacity-[0.78] sm:h-9 sm:max-w-[14rem]"
              />
            </div>
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="font-serif text-3xl tracking-tight">{selectedSec.title}</h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{selectedSec.body}</p>
          </div>
          <Link href="/art" className="link-quiet text-sm tracking-wide">
            Browse the full archive →
          </Link>
        </div>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {selectedPicks.map(({ series: s, piece }) => (
            <figure key={piece.id} className="border border-line bg-white/30 p-4">
              <Link href={`/art/${s.slug}`} className="focus-ring block">
                <div className="relative aspect-[3/4] overflow-hidden bg-black/[0.03]">
                  <Image
                    src={piece.image}
                    alt={piece.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </Link>
              <ArtCaption
                title={piece.title}
                subtitle={captionSubtitle({ medium: piece.medium, size: piece.size })}
                status={piece.status}
                artworkId={piece.id}
              />
              {session && adminLists && galleryMeta ? (
                <AdminArtworkSiteEdit
                  artworkId={piece.id}
                  title={piece.title}
                  mediumSeriesId={piece.mediumSeriesId}
                  selectedSeriesIds={(galleryMeta.get(piece.id)?.portfolioSeries ?? []).map((ser) => ser.id)}
                  portfolioSeries={adminLists[1]}
                  mediumGalleries={adminLists[0]}
                  status={piece.status}
                  returnPath="/"
                />
              ) : null}
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
