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

export type AdminLightboxSlide = {
  src: string;
  alt: string;
  caption?: string;
};

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type Ctx = {
  slides: AdminLightboxSlide[];
  openIndex: number | null;
  open: (index: number) => void;
  close: () => void;
  goDelta: (delta: number) => void;
};

const AdminLightboxContext = createContext<Ctx | null>(null);

function useAdminLightbox() {
  const ctx = useContext(AdminLightboxContext);
  if (!ctx) throw new Error("AdminLightboxTrigger must be inside AdminLightboxProvider");
  return ctx;
}

export function AdminLightboxProvider({
  slides,
  children,
}: {
  slides: AdminLightboxSlide[];
  children: React.ReactNode;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const open = useCallback(
    (index: number) => {
      if (index >= 0 && index < slides.length) setOpenIndex(index);
    },
    [slides.length],
  );

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

  return (
    <AdminLightboxContext.Provider value={{ slides, openIndex, open, close, goDelta }}>
      {children}
      {mounted && openIndex !== null ? (
        <AdminLightboxPortal>
          <AdminLightboxDialog index={openIndex} onClose={close} />
        </AdminLightboxPortal>
      ) : null}
    </AdminLightboxContext.Provider>
  );
}

function AdminLightboxPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function AdminLightboxTrigger({
  index,
  children,
  label = "View full image",
}: {
  index: number;
  children: React.ReactNode;
  label?: string;
}) {
  const { open } = useAdminLightbox();
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

/** Single admin image — opens lightbox without a provider. */
export function AdminLightboxThumb({
  src,
  alt,
  caption,
  children,
  label = "View full image",
}: {
  src: string;
  alt: string;
  caption?: string;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <AdminLightboxProvider slides={[{ src, alt, caption }]}>
      <AdminLightboxTrigger index={0} label={label}>
        {children}
      </AdminLightboxTrigger>
    </AdminLightboxProvider>
  );
}

function AdminLightboxDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const { slides, goDelta } = useAdminLightbox();
  const slide = slides[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const n = slides.length;

  useEffect(() => {
    closeRef.current?.focus();
  }, [index]);

  if (!slide) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0a]/94 p-4 backdrop-blur-[2px] md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={slide.caption ? titleId : undefined}
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
        <span aria-hidden className="text-2xl leading-none">
          ×
        </span>
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
            ‹
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
            ›
          </button>
        </>
      ) : null}

      <div
        className="mx-auto flex min-h-0 w-full max-w-[min(100vw-2rem,1600px)] flex-1 flex-col items-center justify-center gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          <AdminLightboxImage src={slide.src} alt={slide.alt} />
        </div>
        {slide.caption ? (
          <p id={titleId} className="max-w-2xl shrink-0 text-center text-sm text-white/75">
            {slide.caption}
          </p>
        ) : null}
        {n > 1 ? (
          <p className="shrink-0 text-xs text-white/40">
            {index + 1} / {n} · Arrow keys to browse
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AdminLightboxImage({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("/")) {
    return (
      <div className="relative h-[min(85vh,1200px)] w-full max-w-full">
        <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" priority />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob / remote URLs
    <img src={src} alt={alt} className="max-h-[min(85vh,1200px)] w-auto max-w-full object-contain" />
  );
}
