"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import type { GallerySlide } from "@/lib/gallerySlides";

export type { GallerySlide } from "@/lib/gallerySlides";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type Ctx = {
  slides: GallerySlide[];
  openIndex: number | null;
  open: (index: number) => void;
  close: () => void;
  goDelta: (delta: number) => void;
};

const GalleryLightboxContext = createContext<Ctx | null>(null);

function useGalleryLightbox() {
  const ctx = useContext(GalleryLightboxContext);
  if (!ctx) throw new Error("Gallery lightbox components must be inside GalleryLightboxProvider");
  return ctx;
}

export function GalleryLightboxProvider({
  slides,
  children,
}: {
  slides: GallerySlide[];
  children: React.ReactNode;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const open = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) setOpenIndex(index);
  }, [slides.length]);

  const close = useCallback(() => setOpenIndex(null), []);

  const goDelta = useCallback(
    (delta: number) => {
      setOpenIndex((i) => {
        if (i === null || slides.length === 0) return i;
        return (i + delta + slides.length) % slides.length;
      });
    },
    [slides.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (slides.length <= 1) return;
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
  }, [openIndex, close, slides.length, goDelta]);

  const value: Ctx = { slides, openIndex, open, close, goDelta };

  return (
    <GalleryLightboxContext.Provider value={value}>
      {children}
      {mounted && openIndex !== null ? (
        <LightboxPortal>
          <LightboxDialog index={openIndex} onClose={close} />
        </LightboxPortal>
      ) : null}
    </GalleryLightboxContext.Provider>
  );
}

/** Renders dialog in `document.body` so stacking is above the whole page. */
function LightboxPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function GalleryLightboxTrigger({
  index,
  children,
  label = "Enlarge image",
}: {
  index: number;
  children: React.ReactNode;
  label?: string;
}) {
  const { open } = useGalleryLightbox();
  return (
    <div
      role="button"
      tabIndex={0}
      className="cursor-zoom-in focus-ring rounded-sm outline-offset-2"
      aria-label={label}
      onClick={() => open(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(index);
        }
      }}
    >
      {children}
    </div>
  );
}

function statusLabel(status?: string) {
  if (status === "sold") return "Sold";
  if (status === "available") return "Available";
  if (status === "unknown" || !status) return "";
  return status;
}

function LightboxDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const { slides, goDelta } = useGalleryLightbox();
  const slide = slides[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const n = slides.length;

  useEffect(() => {
    closeRef.current?.focus();
  }, [index]);

  if (!slide) return null;

  const st = statusLabel(slide.status);
  const hasDims = slide.width && slide.height;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a]/94 p-4 backdrop-blur-[2px] md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
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
          {slide.src.startsWith("/") && hasDims ? (
            <Image
              src={slide.src}
              alt={slide.alt}
              width={slide.width!}
              height={slide.height!}
              sizes="100vw"
              priority
              className="max-h-[min(85vh,1200px)] w-auto max-w-full object-contain"
            />
          ) : slide.src.startsWith("/") ? (
            <div className="relative h-[min(85vh,1200px)] w-full max-w-full">
              <Image src={slide.src} alt={slide.alt} fill className="object-contain" sizes="100vw" priority />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- remote URLs
            <img
              src={slide.src}
              alt={slide.alt}
              className="max-h-[min(85vh,1200px)] w-auto max-w-full object-contain"
            />
          )}
        </div>

        <div className="w-full max-w-2xl shrink-0 border-t border-white/10 pt-5 text-center">
          <h2 id={titleId} className="font-serif text-xl tracking-tight text-white md:text-2xl">
            {slide.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65">{slide.subtitle}</p>
          {st ? <p className="mt-1 text-xs tracking-wide text-white/50">{st}</p> : null}
          {slide.description ? (
            <p className="mt-4 text-left text-sm leading-relaxed text-white/55 md:text-center">{slide.description}</p>
          ) : null}
          {n > 1 ? (
            <p className="mt-4 text-xs text-white/40">
              {index + 1} / {n} · Arrow keys to browse
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
