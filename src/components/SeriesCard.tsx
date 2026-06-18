import Image from "next/image";
import Link from "next/link";
import type { Series } from "@/db";
import { artSeriesHref } from "@/lib/routeSlug";

export function SeriesCard({ s }: { s: Series }) {
  return (
    <article className="group flex flex-col border border-line bg-white/40">
      <Link href={artSeriesHref(s.slug)} className="focus-ring block">
        <div className="relative aspect-[4/3] overflow-hidden bg-black/[0.03]">
          <Image
            src={s.featuredImage}
            alt={`${s.title} — featured artwork`}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        </div>
        <div className="space-y-3 px-6 py-7">
          <h3 className="font-serif text-2xl tracking-tight">{s.title}</h3>
          <p className="text-sm leading-relaxed text-muted">{s.excerpt}</p>
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
