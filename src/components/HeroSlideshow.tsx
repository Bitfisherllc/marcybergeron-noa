"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/heroSlides";

function SlideCaption({ slide }: { slide: HeroSlide }) {
  if (!slide.title && !slide.subtitle) return null;
  return (
    <div className="min-h-[3.25rem] border-t border-line pt-4 text-center">
      {slide.title ? (
        <div className="font-serif text-lg font-medium tracking-tight text-ink">{slide.title}</div>
      ) : null}
      {slide.subtitle ? (
        <div className={`text-sm leading-relaxed text-muted ${slide.title ? "mt-1" : ""}`}>{slide.subtitle}</div>
      ) : null}
    </div>
  );
}

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (n <= 1) return;
      setIndex((i) => (i + delta + n) % n);
    },
    [n],
  );

  const goTo = useCallback(
    (i: number) => {
      if (i >= 0 && i < n) setIndex(i);
    },
    [n],
  );

  useEffect(() => {
    if (n <= 1 || reduceMotion) return;
    const id = window.setInterval(() => go(1), 7200);
    return () => window.clearInterval(id);
  }, [n, go, reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (n === 0) return null;

  const current = slides[index] ?? slides[0]!;

  if (n === 1) {
    const s = slides[0]!;
    return (
      <div className="space-y-4">
        <div className="relative aspect-[4/5] overflow-hidden bg-black/[0.03]">
          <Image src={s.src} alt={s.alt} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <SlideCaption slide={s} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-black/[0.03]"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured paintings"
      >
        {slides.map((slide, i) => (
          <div
            key={`${slide.src}-${i}`}
            className={`absolute inset-0 ease-out motion-reduce:transition-none ${
              reduceMotion ? "" : "transition-opacity duration-[1100ms]"
            } ${i === index ? "z-[1] opacity-100" : "z-0 opacity-0"}`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>

      <SlideCaption slide={current} />

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => go(-1)}
          className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink/55 transition hover:border-ink/25 hover:text-ink"
          aria-label="Previous image"
        >
          <span className="sr-only">Previous</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="-translate-x-px">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex flex-1 items-center justify-center gap-2.5" aria-label="Slide selection">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-current={i === index ? "true" : undefined}
              aria-label={`Image ${i + 1} of ${n}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 focus-ring ${
                i === index ? "w-6 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/35"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink/55 transition hover:border-ink/25 hover:text-ink"
          aria-label="Next image"
        >
          <span className="sr-only">Next</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="translate-x-px">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
