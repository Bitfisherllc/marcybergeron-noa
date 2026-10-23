import type { Metadata } from "next";
import { ExhibitionPriceGate } from "@/components/ExhibitionPriceGate";
import { GalleryIndexCards } from "@/components/GalleryIndexCards";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { RichText } from "@/components/RichText";
import { StatementSlideshow } from "@/components/StatementSlideshow";
import { ensureExhibitionsParent } from "@/lib/exhibitions";
import { hasPriceViewSession } from "@/lib/priceAccess";
import { resolveInteriorHeroSlides } from "@/lib/featuredArtwork";
import { publicGalleryExcerpt, publicGalleryStatement } from "@/lib/galleryCopy";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import { listExhibitionIndexCards, listHeroSlideshowSlots } from "@/lib/queries";
import { richTextToPlain } from "@/lib/richText";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const parent = await ensureExhibitionsParent();
  return {
    title: parent.title || "Exhibitions",
    description: richTextToPlain(parent.excerpt) || `Exhibitions by ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/exhibitions` },
  };
}

export default async function ExhibitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ prices?: string }>;
}) {
  const sp = await searchParams;
  const [parent, showPrices] = await Promise.all([ensureExhibitionsParent(), hasPriceViewSession()]);
  const [cards, heroSlots] = await Promise.all([
    listExhibitionIndexCards(),
    parent.showHeroSlideshow ? listHeroSlideshowSlots(parent.id) : Promise.resolve([]),
  ]);
  const statement = publicGalleryStatement(parent.content);
  const excerpt = statement ? null : publicGalleryExcerpt(parent.excerpt);
  const slideshowSlides = (
    parent.showHeroSlideshow ? resolveInteriorHeroSlides(parent, [], heroSlots) : []
  )
    .filter((hero) => hero.image && hero.image !== GALLERY_PLACEHOLDER_IMAGE)
    .map((hero) => ({
      src: hero.image,
      alt: hero.alt,
      title: hero.title,
      width: hero.artwork?.imageWidth,
      height: hero.artwork?.imageHeight,
      lightboxIndex: null as number | null,
    }));

  const intro = (
    <>
      <p className="text-xs tracking-[0.22em] text-muted uppercase">Exhibitions</p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{parent.title}</h1>
      <ExhibitionPriceGate returnTo="/exhibitions" signedIn={showPrices} error={sp.prices === "1"} />
      {excerpt ? (
        <RichText content={excerpt} className="mt-6 max-w-2xl text-base leading-relaxed text-muted" />
      ) : null}
      {statement ? (
        <div className="mt-10 max-w-3xl space-y-6">
          <h2 className="font-serif text-2xl tracking-tight">About</h2>
          <ProseMarkdown content={statement} />
        </div>
      ) : null}
    </>
  );

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          {slideshowSlides.length > 0 ? (
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>{intro}</div>
              <StatementSlideshow slides={slideshowSlides} frame="column" />
            </div>
          ) : (
            intro
          )}
        </div>
      </section>

      <section className="border-t border-line bg-white/35">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          {cards.length === 0 ? (
            <p className="text-center text-sm text-muted">Exhibitions will appear here once they are published.</p>
          ) : (
            <GalleryIndexCards cards={cards} cta="View exhibition →" />
          )}
        </div>
      </section>
    </div>
  );
}
