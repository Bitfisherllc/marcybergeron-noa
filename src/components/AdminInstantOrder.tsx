"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const SAVE_DELAY_MS = 350;

const arrowClass =
  "focus-ring inline-flex h-8 w-8 items-center justify-center border border-line text-ink/70 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30";

/**
 * Reorders rows instantly; quick clicks are batched and the final order is saved in the background,
 * one request at a time.
 */
export function useInstantOrder<T extends { id: string }>(
  initialRows: T[],
  save: (orderedIds: string[]) => Promise<{ ok: boolean }>,
) {
  const [rows, setRows] = useState(initialRows);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [prevInitial, setPrevInitial] = useState(initialRows);
  const queuedIds = useRef<string[] | null>(null);
  const saving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const busy = status === "pending" || status === "saving";
  if (initialRows !== prevInitial) {
    setPrevInitial(initialRows);
    if (!busy) setRows(initialRows);
  }

  const flush = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      while (queuedIds.current) {
        const ids = queuedIds.current;
        queuedIds.current = null;
        setStatus("saving");
        const result = await save(ids).catch(() => ({ ok: false }));
        if (!result.ok) {
          queuedIds.current = null;
          setStatus("error");
          return;
        }
      }
      setStatus("saved");
    } finally {
      saving.current = false;
    }
  }, [save]);

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setRows(next);
    setStatus("pending");
    queuedIds.current = next.map((r) => r.id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
  }

  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { rows, status, move };
}

export function OrderStatus({ status }: { status: SaveStatus }) {
  return (
    <p className="mb-3 h-5 text-right text-xs tracking-wide text-muted" aria-live="polite">
      {status === "pending" || status === "saving" ? "Saving order…" : null}
      {status === "saved" ? "Order saved." : null}
      {status === "error" ? (
        <span className="text-red-700">Could not save the new order. Refresh the page and try again.</span>
      ) : null}
    </p>
  );
}

export function OrderArrows({
  label,
  index,
  count,
  onMove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (index: number, delta: -1 | 1) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        className={arrowClass}
        disabled={index === 0}
        aria-label={`Move ${label} up`}
        onClick={() => onMove(index, -1)}
      >
        <Arrow d="M7 3.25 3.75 8.25h6.5L7 3.25Z" />
      </button>
      <button
        type="button"
        className={arrowClass}
        disabled={index === count - 1}
        aria-label={`Move ${label} down`}
        onClick={() => onMove(index, 1)}
      >
        <Arrow d="M7 10.75 10.25 5.75H3.75L7 10.75Z" />
      </button>
    </div>
  );
}

function Arrow({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="block">
      <path d={d} stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
