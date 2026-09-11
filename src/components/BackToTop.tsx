"use client";

import { useEffect, useState } from "react";

function ArrowUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 12.5V3.5M8 3.5L3.75 7.75M8 3.5l4.25 4.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 360);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      className={`fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line bg-paper text-ink/75 shadow-[0_8px_24px_rgba(31,31,31,0.08)] transition-[opacity,transform,color] duration-200 ease-out hover:text-ink focus-ring motion-reduce:transition-none print:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
      aria-label="Return to top"
      tabIndex={visible ? 0 : -1}
      onClick={goToTop}
    >
      <ArrowUpIcon />
    </button>
  );
}
