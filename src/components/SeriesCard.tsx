import Image from "next/image";
import Link from "next/link";
import type { Series } from "@/db";
import { RichText } from "@/components/RichText";
import { SITE_IMAGE_QUALITY } from "@/lib/imageQuality";
import { artSeriesHref } from "@/lib/routeSlug";

export function SeriesCard({
  s,
  image,
  alt,
  portfolioType,
}: {
  s: Series;
  /** Resolved listing-card picture; defaults to the stored card image. */
  image?: string;
  alt?: string;
  portfolioType?: string | null;
}) {
  return (
    <article className="group flex flex-col border border-line bg-white/40">
      <Link href={artSeriesHref(s.slug)} className="focus-ring block">
        <div className="relative aspect-[4/3] overflow-hidden bg-black/[0.03]">
          <Image
            src={image ?? s.featuredImage}
            alt={alt ?? `${s.title} — featured artwork`}
            fill
            quality={SITE_IMAGE_QUALITY}
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        </div>
        <div className="space-y-3 px-6 py-7">
          {portfolioType ? (
            <p className="text-xs tracking-[0.18em] text-muted uppercase">{portfolioType}</p>
          ) : null}
          <h3 className="font-serif text-2xl tracking-tight">{s.title}</h3>
          <RichText content={s.excerpt} insideLink className="text-sm leading-relaxed text-muted" />
          <span className="inline-flex items-center gap-2 text-xs tracking-[0.18em] text-ink/70 uppercase">
            View series
            <span aria-hidden className="translate-x-0 transition group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}
