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
};

const AUTO_ADVANCE_MS = 6000;

export function HomeJournalSlider({ posts }: { posts: HomeJournalPost[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);
  const pausedRef = useRef(false);
  const activeRef = useRef(0);
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

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      const cards = cardElements();
      const card = cards[index];
      if (!el || !card) return;

      programmaticScrollRef.current = true;
      el.scrollTo({
        left: card.offsetLeft,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, reduceMotion ? 0 : 450);
    },
    [cardElements, reduceMotion],
  );

  const syncActiveFromScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;

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
    activeRef.current = best;
  }, [cardElements]);

  const goDelta = useCallback(
    (dir: -1 | 1) => {
      pausedRef.current = true;
      window.setTimeout(() => {
        pausedRef.current = false;
      }, AUTO_ADVANCE_MS);
      const next = (activeRef.current + dir + posts.length) % posts.length;
      activeRef.current = next;
      setActive(next);
      scrollToIndex(next);
    },
    [posts.length, scrollToIndex],
  );

  const goTo = useCallback(
    (index: number) => {
      pausedRef.current = true;
      window.setTimeout(() => {
        pausedRef.current = false;
      }, AUTO_ADVANCE_MS);
      activeRef.current = index;
      setActive(index);
      scrollToIndex(index);
    },
    [scrollToIndex],
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
    if (posts.length <= 1 || reduceMotion) return;

    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      const next = (activeRef.current + 1) % posts.length;
      activeRef.current = next;
      setActive(next);
      scrollToIndex(next);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(id);
  }, [posts.length, reduceMotion, scrollToIndex]);

  useEffect(() => {
    if (posts.length === 0) return;
    const clamped = Math.min(posts.length - 1, activeRef.current);
    activeRef.current = clamped;
    setActive(clamped);
  }, [posts.length]);

  if (posts.length === 0) return null;

  const n = posts.length;
  const canScroll = n > 1;

  return (
    <div
      className="mt-10 min-w-0"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onFocusCapture={() => {
        pausedRef.current = true;
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          pausedRef.current = false;
        }
      }}
    >
      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto overflow-y-visible scroll-smooth pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory scroll-ps-5 scroll-pe-8 ps-5 pe-8 [-webkit-overflow-scrolling:touch] md:scroll-ps-8 md:scroll-pe-10 md:ps-8 md:pe-10 [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-roledescription="carousel"
        aria-label="Journal articles"
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
                <div className="text-[0.65rem] tracking-[0.2em] text-muted uppercase">{p.category}</div>
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
            className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink/55 transition hover:border-ink/25 hover:text-ink"
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
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 focus-ring ${
                  i === active ? "w-6 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/35"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goDelta(1)}
            className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink/55 transition hover:border-ink/25 hover:text-ink"
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
