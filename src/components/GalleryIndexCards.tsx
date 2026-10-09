import Link from "next/link";
import { GalleryListingImage } from "@/components/GalleryListingImage";
import { RichText } from "@/components/RichText";
import { publicGalleryExcerpt } from "@/lib/galleryCopy";

export type GalleryIndexCard = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
  image: string;
  alt: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  /** Optional portfolio type, e.g. “Oil and Cold Wax”, shown above the title. */
  portfolioType?: string | null;
};

export function GalleryIndexCards({ cards, cta }: { cards: GalleryIndexCard[]; cta: string }) {
  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const excerpt = publicGalleryExcerpt(card.excerpt);
        return (
        <article key={card.id} className="group flex flex-col border border-line bg-white/40">
          <Link href={card.href} className="focus-ring flex flex-1 flex-col">
            <GalleryListingImage
              galleryId={card.id}
              src={card.image}
              alt={card.alt}
              width={card.imageWidth}
              height={card.imageHeight}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              imageClassName="transition duration-500 group-hover:scale-[1.01]"
            />
            <div className="flex flex-1 flex-col px-6 py-7">
              {card.portfolioType ? (
                <p className="truncate text-xs tracking-[0.18em] text-muted uppercase">{card.portfolioType}</p>
              ) : null}
              <h2 className={`line-clamp-2 font-serif text-3xl tracking-tight ${card.portfolioType ? "mt-3" : ""}`}>
                {card.title}
              </h2>
              {excerpt ? (
                <RichText
                  content={excerpt}
                  insideLink
                  className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted"
                />
              ) : null}
              <span className="mt-auto inline-flex pt-3 text-xs tracking-[0.18em] text-ink/70 uppercase">{cta}</span>
            </div>
          </Link>
        </article>
        );
      })}
    </div>
  );
}
