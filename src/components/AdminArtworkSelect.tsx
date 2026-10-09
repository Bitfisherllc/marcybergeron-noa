"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type AdminArtworkSeriesTag = {
  title: string;
  sortOrder: number;
  portfolio: string;
  portfolioSortOrder: number;
};

export type AdminArtworkSelectOption = {
  id: string;
  label: string;
  image?: string;
  gallery?: string;
  gallerySortOrder?: number;
  series?: AdminArtworkSeriesTag[];
};

const selectClass = "mt-2 w-full border border-line bg-paper px-3 py-2 text-sm text-ink";

const btnSecondary =
  "inline-flex shrink-0 border border-line bg-paper px-4 py-3 text-xs tracking-[0.18em] text-ink uppercase transition hover:bg-black/[0.03] focus-ring";

const btnPrimary =
  "inline-flex shrink-0 border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90 focus-ring";

const filterSelectClass = "focus-ring w-full border border-line bg-paper px-3 py-2 text-sm text-ink";

type AdminArtworkSelectProps = {
  name: string;
  options: AdminArtworkSelectOption[];
  emptyLabel?: string;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Thumbnail grid instead of a title-only dropdown. */
  visual?: boolean;
  /** Hide the extra selected-painting thumb (the parent already shows a preview). */
  compact?: boolean;
};

type NamedOrder = { name: string; sortOrder: number };

function byStudioThenOrder(a: NamedOrder, b: NamedOrder) {
  if (a.name === "The Studio") return 1;
  if (b.name === "The Studio") return -1;
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function portfolioNames(options: AdminArtworkSelectOption[]): string[] {
  const portfolios = new Map<string, number>();
  for (const option of options) {
    if (option.gallery && !portfolios.has(option.gallery)) {
      portfolios.set(option.gallery, option.gallerySortOrder ?? 0);
    }
    for (const tag of option.series ?? []) {
      if (!portfolios.has(tag.portfolio)) portfolios.set(tag.portfolio, tag.portfolioSortOrder);
    }
  }
  return [...portfolios]
    .map(([name, sortOrder]) => ({ name, sortOrder }))
    .sort(byStudioThenOrder)
    .map((entry) => entry.name);
}

function seriesNames(options: AdminArtworkSelectOption[], portfolio: string): string[] {
  const names = new Map<string, number>();
  for (const option of options) {
    for (const tag of option.series ?? []) {
      if (portfolio !== "all" && tag.portfolio !== portfolio) continue;
      if (!names.has(tag.title)) names.set(tag.title, tag.sortOrder);
    }
  }
  return [...names]
    .map(([name, sortOrder]) => ({ name, sortOrder }))
    .sort(byStudioThenOrder)
    .map((entry) => entry.name);
}

function inPortfolio(option: AdminArtworkSelectOption, portfolio: string) {
  if (portfolio === "all") return true;
  return option.gallery === portfolio || (option.series ?? []).some((tag) => tag.portfolio === portfolio);
}

function inSeries(option: AdminArtworkSelectOption, seriesName: string, portfolio: string) {
  if (seriesName === "all") return true;
  return (option.series ?? []).some(
    (tag) => tag.title === seriesName && (portfolio === "all" || tag.portfolio === portfolio),
  );
}

function notifyFormDirty(form: HTMLFormElement | null) {
  if (!form) return;
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
}

type ArtworkPickerDialogProps = {
  options: AdminArtworkSelectOption[];
  current: string;
  hint?: string;
  onPick: (id: string, form: HTMLFormElement | null) => void;
  onClose: () => void;
  /** Shows an Upload a painting button in the header. */
  onUpload?: () => void;
};

export function ArtworkPickerDialog({
  options,
  current,
  hint = "Click a painting to use it for this slide.",
  onPick,
  onClose,
  onUpload,
}: ArtworkPickerDialogProps) {
  const [portfolio, setPortfolio] = useState("all");
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [query, setQuery] = useState("");
  const portfolios = useMemo(() => portfolioNames(options), [options]);
  const seriesInPortfolio = useMemo(() => seriesNames(options, portfolio), [options, portfolio]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter((option) => {
      if (!inPortfolio(option, portfolio)) return false;
      if (!inSeries(option, seriesFilter, portfolio)) return false;
      if (!needle) return true;
      return (
        option.label.toLowerCase().includes(needle) ||
        option.gallery?.toLowerCase().includes(needle) ||
        false
      );
    });
  }, [options, portfolio, seriesFilter, query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a painting"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(85vh,720px)] w-full max-w-3xl flex-col overflow-hidden border border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h3 className="font-serif text-xl tracking-tight">Choose a painting</h3>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </div>
          <div className="flex items-center gap-2">
            {onUpload ? (
              <button type="button" className={btnPrimary} onClick={onUpload}>
                Upload a painting
              </button>
            ) : null}
            <button
              type="button"
              className="focus-ring border border-line px-3 py-1.5 text-xs tracking-wide uppercase"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        <div className={`grid gap-3 border-b border-line px-5 py-3 ${portfolios.length > 0 ? "sm:grid-cols-3" : ""}`}>
          {portfolios.length > 0 ? (
            <>
              <label className="block text-xs tracking-wide text-muted uppercase">
                Portfolio
                <select
                  value={portfolio}
                  className={`${filterSelectClass} mt-1 normal-case tracking-normal`}
                  onChange={(event) => {
                    setPortfolio(event.target.value);
                    setSeriesFilter("all");
                  }}
                >
                  <option value="all">All portfolios</option>
                  {portfolios.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs tracking-wide text-muted uppercase">
                Series
                <select
                  value={seriesFilter}
                  disabled={seriesInPortfolio.length === 0}
                  className={`${filterSelectClass} mt-1 normal-case tracking-normal disabled:opacity-50`}
                  onChange={(event) => setSeriesFilter(event.target.value)}
                >
                  <option value="all">
                    {seriesInPortfolio.length === 0 ? "No series in this portfolio" : "All series"}
                  </option>
                  {seriesInPortfolio.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          <label className="block text-xs tracking-wide text-muted uppercase">
            Search
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title"
              className={`${filterSelectClass} mt-1 normal-case tracking-normal`}
            />
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted">No paintings match this filter.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((option) => {
                const isSelected = current === option.id;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      className={`focus-ring w-full border p-1.5 text-left transition ${
                        isSelected ? "border-ink bg-black/[0.04]" : "border-line hover:border-ink/40"
                      }`}
                      onClick={(event) => onPick(option.id, event.currentTarget.form)}
                    >
                      <div className="relative aspect-square overflow-hidden bg-black/[0.04]">
                        {option.image?.startsWith("/") ? (
                          <Image src={option.image} alt="" fill className="object-cover" sizes="120px" />
                        ) : option.image ? (
                          // eslint-disable-next-line @next/next/no-img-element -- remote URLs
                          <img src={option.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[0.65rem] text-muted">
                            No image
                          </div>
                        )}
                      </div>
                      <span className="mt-1.5 block truncate text-[0.65rem] leading-snug text-ink">
                        {option.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Server HTML stays small; the full painting list fills in after hydrate. */
export function AdminArtworkSelect({
  name,
  options,
  emptyLabel = "— None —",
  className = selectClass,
  value,
  defaultValue,
  onChange,
  visual = false,
  compact = false,
}: AdminArtworkSelectProps) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const current = value !== undefined ? value : uncontrolled;
  const selected = current ? options.find((option) => option.id === current) : undefined;
  const visible = expanded ? options : selected ? [selected] : [];

  useEffect(() => {
    setExpanded(true);
  }, []);

  function pick(id: string, form: HTMLFormElement | null) {
    if (value === undefined) setUncontrolled(id);
    onChange?.(id);
    notifyFormDirty(form);
    setOpen(false);
  }

  if (!visual) {
    return (
      <select
        name={name}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        className={className}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      >
        <option value="">{emptyLabel}</option>
        {visible.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const statusText = selected
    ? selected.label
    : emptyLabel === "— Auto —"
      ? "Automatic pick until you choose one"
      : "No painting chosen yet";
  const chooseLabel = current ? "Change painting" : "Choose a painting";

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={current} />
      {compact ? (
        <div className="flex flex-col gap-2">
          <button type="button" className={`${btnSecondary} w-full justify-center`} onClick={() => setOpen(true)}>
            {chooseLabel}
          </button>
          <button
            type="button"
            className={`${btnSecondary} w-full justify-center ${!current ? "pointer-events-none opacity-30" : ""}`}
            disabled={!current}
            onClick={(event) => pick("", event.currentTarget.form)}
          >
            Clear
          </button>
          <p className="min-w-0 truncate text-xs leading-relaxed text-muted">{statusText}</p>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <button
            type="button"
            className={`focus-ring relative h-24 w-20 shrink-0 overflow-hidden border bg-black/[0.03] ${
              selected ? "border-ink" : "border-dashed border-line"
            }`}
            aria-label={chooseLabel}
            onClick={() => setOpen(true)}
          >
            {selected?.image?.startsWith("/") ? (
              <Image src={selected.image} alt="" fill className="object-cover" sizes="80px" />
            ) : selected?.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote URLs
              <img src={selected.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center p-2 text-center text-[0.65rem] leading-snug text-muted">
                {selected ? "No image" : "None"}
              </span>
            )}
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <p className={`text-sm leading-snug ${selected ? "text-ink" : "text-muted"}`}>{statusText}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnSecondary} onClick={() => setOpen(true)}>
                {chooseLabel}
              </button>
              {current ? (
                <button type="button" className={btnSecondary} onClick={(event) => pick("", event.currentTarget.form)}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {open ? (
        <ArtworkPickerDialog
          options={options}
          current={current}
          hint="Click a painting to choose it."
          onPick={pick}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
