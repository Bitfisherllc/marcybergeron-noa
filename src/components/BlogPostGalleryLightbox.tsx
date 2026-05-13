"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

type Slide = { src: string; alt: string };

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Wraps blog post markdown: images inside `.post-gallery` open in a full-screen lightbox
 * (with prev/next within that gallery).
 */
export function BlogPostGalleryLightbox({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<{ slides: Slide[]; index: number } | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof HTMLImageElement)) return;
      if (!root.contains(t)) return;
      const gallery = t.closest(".post-gallery");
      if (!gallery || !root.contains(gallery)) return;
      e.preventDefault();
      e.stopPropagation();
      const imgs = Array.from(gallery.querySelectorAll("img")) as HTMLImageElement[];
      const idx = imgs.indexOf(t);
      if (idx < 0) return;
      const slides = imgs.map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.getAttribute("alt") ?? "",
      }));
      setOpen({ slides, index: idx });
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  const close = useCallback(() => setOpen(null), []);

  const goDelta = useCallback((delta: number) => {
    setOpen((s) => {
      if (!s || s.slides.length === 0) return s;
      const n = s.slides.length;
      return { ...s, index: (s.index + delta + n) % n };
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (open.slides.length <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goDelta(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goDelta(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, goDelta]);

  return (
    <div ref={wrapRef} className="blog-post-gallery-lightbox-root">
      {children}
      {mounted && open ? <BlogLightboxPortal open={open} onClose={close} goDelta={goDelta} /> : null}
    </div>
  );
}

function BlogLightboxPortal({
  open,
  onClose,
  goDelta,
}: {
  open: { slides: Slide[]; index: number };
  onClose: () => void;
  goDelta: (d: number) => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <BlogLightboxOverlay slides={open.slides} index={open.index} onClose={onClose} goDelta={goDelta} />,
    document.body,
  );
}

function BlogLightboxOverlay({
  slides,
  index,
  onClose,
  goDelta,
}: {
  slides: Slide[];
  index: number;
  onClose: () => void;
  goDelta: (d: number) => void;
}) {
  const slide = slides[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const n = slides.length;

  useEffect(() => {
    closeRef.current?.focus();
  }, [index]);

  if (!slide) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a]/94 p-4 backdrop-blur-[2px] md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="focus-ring absolute right-3 top-3 z-[2] inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-white/85 transition hover:border-white/35 hover:text-white md:right-6 md:top-6"
        aria-label="Close"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </button>

      {n > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goDelta(-1);
            }}
            className="focus-ring absolute left-2 top-1/2 z-[2] inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-white/15 text-white/80 transition hover:border-white/35 hover:text-white md:left-5"
            aria-label="Previous image"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="-translate-x-px">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goDelta(1);
            }}
            className="focus-ring absolute right-2 top-1/2 z-[2] inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-white/15 text-white/80 transition hover:border-white/35 hover:text-white md:right-5"
            aria-label="Next image"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="translate-x-px">
              <path
                d="M6 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : null}

      <div
        className="mx-auto flex min-h-0 w-full max-w-[min(100vw-2rem,1600px)] flex-1 flex-col items-center justify-center gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary URLs from markdown / uploads */}
          <img
            src={slide.src}
            alt={slide.alt}
            className="max-h-[min(85vh,1200px)] w-auto max-w-full object-contain"
          />
        </div>
        <p id={labelId} className="max-w-2xl text-center text-xs text-white/55">
          {slide.alt || "Image"}{" "}
          {n > 1 ? (
            <span className="text-white/40">
              · {index + 1} / {n}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
