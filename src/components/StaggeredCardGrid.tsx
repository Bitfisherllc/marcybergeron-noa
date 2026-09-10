"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const ROW_PX = 1;

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Packs mixed-height cards so a landscape piece can sit beside a portrait
 * without leaving a full-row gap underneath.
 */
export function StaggeredCardGrid({ children, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    let cancelled = false;
    const bound = new Set<HTMLImageElement>();

    const pack = () => {
      if (cancelled) return;
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
      const items = Array.from(grid.children) as HTMLElement[];
      for (const item of items) item.style.gridRowEnd = "auto";
      const heights = items.map((item) => item.getBoundingClientRect().height);
      for (let i = 0; i < items.length; i += 1) {
        const span = Math.max(1, Math.ceil((heights[i]! + gap) / (ROW_PX + gap)));
        items[i]!.style.gridRowEnd = `span ${span}`;
      }

      for (const img of grid.querySelectorAll("img")) {
        if (bound.has(img)) continue;
        bound.add(img);
        img.addEventListener("load", pack);
      }
    };

    grid.style.gridAutoRows = `${ROW_PX}px`;
    grid.style.gridAutoFlow = "dense";
    pack();

    window.addEventListener("resize", pack);
    void document.fonts?.ready.then(pack);

    let lastWidth = grid.clientWidth;
    const ro = new ResizeObserver(() => {
      const width = grid.clientWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      pack();
    });
    ro.observe(grid);

    const mo = new MutationObserver(pack);
    mo.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", pack);
      for (const img of bound) img.removeEventListener("load", pack);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
