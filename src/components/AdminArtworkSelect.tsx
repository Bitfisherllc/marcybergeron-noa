"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type AdminArtworkSelectOption = {
  id: string;
  label: string;
  image?: string;
  gallery?: string;
};

const selectClass = "mt-2 w-full border border-line bg-paper px-3 py-2 text-sm text-ink";

const btnSecondary =
  "inline-flex shrink-0 border border-line bg-paper px-4 py-3 text-xs tracking-[0.18em] text-ink uppercase transition hover:bg-black/[0.03] focus-ring";

const filterBtn = "focus-ring border px-3 py-1.5 text-[0.65rem] tracking-[0.16em] uppercase transition";

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

function galleryNames(options: AdminArtworkSelectOption[]): string[] {
  const names = new Set<string>();
  for (const option of options) {
    if (option.gallery) names.add(option.gallery);
  }
  return [...names].sort((a, b) => {
    if (a === "The Studio") return -1;
    if (b === "The Studio") return 1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}

function notifyFormDirty(form: HTMLFormElement | null) {
  if (!form) return;
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
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
  const [galleryFilter, setGalleryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const current = value !== undefined ? value : uncontrolled;
  const selected = current ? options.find((option) => option.id === current) : undefined;
  const visible = expanded ? options : selected ? [selected] : [];
  const galleries = useMemo(() => galleryNames(options), [options]);

  useEffect(() => {
    setExpanded(true);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter((option) => {
      if (galleryFilter !== "all" && option.gallery !== galleryFilter) return false;
      if (!needle) return true;
      return (
        option.label.toLowerCase().includes(needle) ||
        option.gallery?.toLowerCase().includes(needle) ||
        false
      );
    });
  }, [options, galleryFilter, query]);

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

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={current} />
      <div className={compact ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-3"}>
        <button
          type="button"
          className={compact ? `${btnSecondary} w-full justify-center` : btnSecondary}
          onClick={() => setOpen(true)}
        >
          Choose painting
        </button>
        {current || compact ? (
          <button
            type="button"
            className={`${compact ? `${btnSecondary} w-full justify-center` : btnSecondary} ${
              !current ? "pointer-events-none opacity-30" : ""
            }`}
            disabled={!current}
            onClick={(event) => pick("", event.currentTarget.form)}
          >
            Clear
          </button>
        ) : null}
        <p className="min-w-0 truncate text-xs leading-relaxed text-muted">
          {selected ? selected.label : emptyLabel === "— Auto —" ? "Automatic pick until you choose one" : "No painting chosen yet"}
        </p>
      </div>
      {!compact && selected?.image ? (
        <div className="flex items-start gap-3">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-ink bg-black/[0.03]">
            {selected.image.startsWith("/") ? (
              <Image src={selected.image} alt="" fill className="object-cover" sizes="80px" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- remote URLs
              <img src={selected.image} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <p className="pt-1 text-sm leading-relaxed text-ink">{selected.label}</p>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a painting"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[min(85vh,720px)] w-full max-w-3xl flex-col overflow-hidden border border-line bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h3 className="font-serif text-xl tracking-tight">Paintings</h3>
                <p className="mt-1 text-xs text-muted">Click a painting to use it for this slide.</p>
              </div>
              <button
                type="button"
                className="focus-ring border border-line px-3 py-1.5 text-xs tracking-wide uppercase"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
              <button
                type="button"
                className={`${filterBtn} ${
                  galleryFilter === "all" ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink/40"
                }`}
                onClick={() => setGalleryFilter("all")}
              >
                All
              </button>
              {galleries.map((gallery) => (
                <button
                  key={gallery}
                  type="button"
                  className={`${filterBtn} ${
                    galleryFilter === gallery
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-paper text-ink hover:border-ink/40"
                  }`}
                  onClick={() => setGalleryFilter(gallery)}
                >
                  {gallery}
                </button>
              ))}
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title"
                className="ml-auto w-full min-w-[12rem] flex-1 border border-line bg-paper px-3 py-1.5 text-sm text-ink sm:max-w-xs"
              />
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
                          onClick={(event) => pick(option.id, event.currentTarget.form)}
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
      ) : null}
    </div>
  );
}
