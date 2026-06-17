"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type HomeJournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  featuredImage: string | null;
  dateLabel: string;
};

export function HomeJournalSlider({ posts }: { posts: HomeJournalPost[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const cardElements = useCallback((): HTMLElement[] => {
    const el = scrollerRef.current;
    if (!el) return [];
    return [...el.querySelectorAll<HTMLElement>("[data-journal-card]")];
  }, []);

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    const cards = cardElements();
    if (!el || cards.length === 0) return;

    const scrollLeft = el.scrollLeft;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]!;
      const dist = Math.abs(card.offsetLeft - scrollLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    setActive(best);
  }, [cardElements]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const cards = cardElements();
      const card = cards[index];
      if (!card) return;

      card.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        inline: "start",
        block: "nearest",
      });
      setActive(index);
    },
    [cardElements, reduceMotion],
  );

  const goDelta = useCallback(
    (dir: -1 | 1) => {
      const next = Math.min(posts.length - 1, Math.max(0, active + dir));
      scrollToIndex(next);
    },
    [active, posts.length, scrollToIndex],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || posts.length === 0) return;

    el.addEventListener("scroll", syncActiveFromScroll, { passive: true });
    window.addEventListener("resize", syncActiveFromScroll);
    syncActiveFromScroll();

    return () => {
      el.removeEventListener("scroll", syncActiveFromScroll);
      window.removeEventListener("resize", syncActiveFromScroll);
    };
  }, [posts.length, syncActiveFromScroll]);

  useEffect(() => {
    if (posts.length === 0) return;
    setActive((i) => Math.min(posts.length - 1, i));
  }, [posts.length]);

  if (posts.length === 0) return null;

  const n = posts.length;
  const canScroll = n > 1;

  return (
    <div className="mt-10 min-w-0">
      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto overflow-y-visible scroll-smooth pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory scroll-ps-5 scroll-pe-8 ps-5 pe-8 [-webkit-overflow-scrolling:touch] md:scroll-ps-8 md:scroll-pe-10 md:ps-8 md:pe-10 [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((p) => (
          <article
            key={p.slug}
            data-journal-card
            className="box-border w-[min(100%,20rem)] shrink-0 snap-start border border-line bg-white/35 sm:w-[22.5rem]"
          >
            <Link href={`/news/${p.slug}`} className="focus-ring flex h-full flex-col">
              <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-black/[0.03]">
                {p.featuredImage ? (
                  <Image
                    src={p.featuredImage}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 90vw, 360px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs tracking-wide text-muted uppercase">
                    Journal
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 px-5 py-6">
                <div className="text-[0.65rem] tracking-[0.2em] text-muted uppercase">
                  {p.category} · {p.dateLabel}
                </div>
                <h3 className="font-serif text-xl leading-snug tracking-tight text-ink">{p.title}</h3>
                <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{p.excerpt}</p>
                <span className="text-[0.65rem] tracking-[0.18em] text-ink/70 uppercase">Read →</span>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {canScroll ? (
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => goDelta(-1)}
            disabled={active === 0}
            className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink/55 transition hover:border-ink/25 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            aria-label="Previous article"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="-translate-x-px">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex max-w-md flex-1 flex-wrap items-center justify-center gap-2" aria-label="Choose article">
            {posts.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to article ${i + 1} of ${n}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 focus-ring ${
                  i === active ? "w-6 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/35"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goDelta(1)}
            disabled={active === n - 1}
            className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink/55 transition hover:border-ink/25 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            aria-label="Next article"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="translate-x-px">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
