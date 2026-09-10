import Link from "next/link";
import { GalleryListingImage } from "@/components/GalleryListingImage";
import { StaggeredCardGrid } from "@/components/StaggeredCardGrid";

export type GalleryIndexCard = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
  image: string;
  alt: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
};

export function GalleryIndexCards({ cards, cta }: { cards: GalleryIndexCard[]; cta: string }) {
  return (
    <StaggeredCardGrid>
      {cards.map((card) => (
        <article key={card.id} className="group border border-line bg-white/40">
          <Link href={card.href} className="focus-ring block">
            <GalleryListingImage
              galleryId={card.id}
              src={card.image}
              alt={card.alt}
              width={card.imageWidth}
              height={card.imageHeight}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              imageClassName="transition duration-500 group-hover:scale-[1.01]"
            />
            <div className="px-6 py-7">
              <h2 className="font-serif text-3xl tracking-tight">{card.title}</h2>
              {card.excerpt ? (
                <p className="mt-3 text-sm leading-relaxed text-muted">{card.excerpt}</p>
              ) : null}
              <span className="mt-3 inline-flex text-xs tracking-[0.18em] text-ink/70 uppercase">{cta}</span>
            </div>
          </Link>
        </article>
      ))}
    </StaggeredCardGrid>
  );
}
