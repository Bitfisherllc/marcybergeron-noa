"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { GalleryLightboxTrigger } from "@/components/GalleryLightbox";
import { SITE_IMAGE_QUALITY } from "@/lib/imageQuality";

export type StatementSlideshowSlide = {
  src: string;
  alt: string;
  title: string;
  width?: number | null;
  height?: number | null;
  lightboxIndex: number | null;
};

const COLUMN_MIN_RATIO = 4 / 5;
const COLUMN_MAX_RATIO = 4 / 3;

/** Sized to the tallest slide so portraits fill the stage, clamped so the column never gets too tall or short. */
function columnRatio(slides: StatementSlideshowSlide[]) {
  const ratios = slides.flatMap((s) => (s.width && s.height ? [s.width / s.height] : []));
  const tallest = ratios.length ? Math.min(...ratios) : COLUMN_MIN_RATIO;
  return Math.min(COLUMN_MAX_RATIO, Math.max(COLUMN_MIN_RATIO, tallest));
}

function SlideImage({
  slide,
  priority,
  fill,
  fit = "contain",
}: {
  slide: StatementSlideshowSlide;
  priority?: boolean;
  fill?: boolean;
  fit?: "contain" | "cover";
}) {
  const objectClass = fit === "cover" ? "object-cover" : "object-contain";

  if (fill) {
    return (
      <Image
        src={slide.src}
        alt={slide.alt}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 50vw"
        quality={SITE_IMAGE_QUALITY}
        className={objectClass}
      />
    );
  }

  if (fit === "cover") {
    return (
      <div className="relative aspect-[3/2] w-full">
        <Image
          src={slide.src}
          alt={slide.alt}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={SITE_IMAGE_QUALITY}
          className="object-cover"
        />
      </div>
    );
  }

  if (slide.width && slide.height) {
    return (
      <Image
        src={slide.src}
        alt={slide.alt}
        width={slide.width}
        height={slide.height}
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 50vw"
        quality={SITE_IMAGE_QUALITY}
        className="h-auto w-full max-w-full"
      />
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full">
      <Image
        src={slide.src}
        alt={slide.alt}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 50vw"
        quality={SITE_IMAGE_QUALITY}
        className="object-contain"
      />
    </div>
  );
}

function MaybeLightbox({
  slide,
  children,
}: {
  slide: StatementSlideshowSlide;
  children: ReactNode;
}) {
  if (slide.lightboxIndex == null) return <>{children}</>;
  return (
    <GalleryLightboxTrigger
      index={slide.lightboxIndex}
      label={`Enlarge featured image: ${slide.title}`}
      className="block h-full w-full"
    >
      {children}
    </GalleryLightboxTrigger>
  );
}

export function StatementSlideshow({
  slides,
  frame = "natural",
}: {
  slides: StatementSlideshowSlide[];
  frame?: "natural" | "landscape" | "column";
}) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const landscape = frame === "landscape";
  const column = frame === "column";
  const fit = landscape ? "cover" : "contain";
  const stageTint = column ? "" : "bg-black/[0.03]";

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
    if (n <= 1 || reduceMotion || paused) return;
    const id = window.setInterval(() => go(1), 6500);
    return () => window.clearInterval(id);
  }, [n, go, reduceMotion, paused]);

  if (n === 0) return null;

  const first = slides[0]!;

  if (n === 1) {
    return (
      <MaybeLightbox slide={first}>
        {column ? (
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: columnRatio(slides) }}>
            <SlideImage slide={first} priority fill fit={fit} />
          </div>
        ) : (
          <div className="overflow-hidden bg-black/[0.03]">
            <SlideImage slide={first} priority fit={fit} />
          </div>
        )}
      </MaybeLightbox>
    );
  }

  const stageRatio = landscape
    ? "3 / 2"
    : column
      ? columnRatio(slides)
      : first.width && first.height
        ? `${first.width} / ${first.height}`
        : "4 / 5";

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`relative w-full overflow-hidden ${stageTint}`}
        style={{ aspectRatio: stageRatio }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured paintings"
      >
        {slides.map((slide, i) => (
          <div
            key={`${slide.src}-${i}`}
            className={`absolute inset-0 ease-out motion-reduce:transition-none ${
              reduceMotion ? "" : "transition-opacity duration-[1100ms]"
            } ${i === index ? "z-[1] opacity-100" : "z-0 pointer-events-none opacity-0"}`}
            aria-hidden={i !== index}
          >
            <MaybeLightbox slide={slide}>
              <div className="relative h-full w-full">
                <SlideImage slide={slide} priority={i === 0} fill fit={fit} />
              </div>
            </MaybeLightbox>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink/55 transition hover:border-ink/25 hover:text-ink"
          aria-label="Previous featured image"
        >
          <span className="sr-only">Previous</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="-translate-x-px">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex flex-1 items-center justify-center gap-2.5" aria-label="Slide selection">
          {slides.map((slide, i) => (
            <button
              key={`${slide.src}-dot-${i}`}
              type="button"
              aria-current={i === index ? "true" : undefined}
              aria-label={`Featured image ${i + 1} of ${n}: ${slide.title}`}
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
          aria-label="Next featured image"
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
