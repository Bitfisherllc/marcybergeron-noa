"use client";

import { useEffect, useRef, useState } from "react";
import { SocialIcon } from "@/components/SocialIcon";
import { normalizeSocialUrl, socialPlatform, type SocialLink } from "@/lib/socialLinks";

type Row = SocialLink & { key: number };

const smallBtn =
  "focus-ring inline-flex h-9 items-center justify-center border border-line bg-paper px-3 text-xs text-ink/80 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40";

/** Editable list of social links. Inputs are indexed (`social_url_0`, …) so the save tracker sees every change. */
export function AdminSocialLinksField({ defaultLinks }: { defaultLinks: SocialLink[] }) {
  const nextKey = useRef(defaultLinks.length);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>(() => defaultLinks.map((link, key) => ({ ...link, key })));
  const [changed, setChanged] = useState(0);

  useEffect(() => {
    if (changed === 0) return;
    wrapRef.current?.closest("form")?.dispatchEvent(new Event("change", { bubbles: true }));
  }, [changed]);

  function update(key: number, patch: Partial<SocialLink>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function restructure(nextRows: Row[]) {
    setRows(nextRows);
    setChanged((n) => n + 1);
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= rows.length) return;
    const copy = [...rows];
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
    restructure(copy);
  }

  return (
    <div ref={wrapRef} className="mt-5 space-y-4">
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No social links. The Social section is hidden on the site until you add one.</p>
      ) : null}
      {rows.map((row, index) => {
        const url = normalizeSocialUrl(row.url);
        const platform = url ? socialPlatform(url) : null;
        const invalid = row.url.trim() !== "" && !url;
        return (
          <div key={row.key} className="flex flex-wrap items-end gap-3 border border-line bg-paper/60 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-ink/70" aria-hidden>
              {url ? <SocialIcon url={url} size={20} /> : null}
            </span>
            <label className="block min-w-[14rem] flex-[2] text-sm text-muted">
              Web address
              <input
                name={`social_url_${index}`}
                value={row.url}
                onChange={(e) => update(row.key, { url: e.target.value })}
                placeholder="https://www.instagram.com/yourname/"
                inputMode="url"
                className={`mt-2 w-full border bg-paper px-3 py-2 text-sm ${invalid ? "border-red-600" : "border-line"}`}
              />
              {invalid ? <span className="mt-1 block text-xs text-red-700">This does not look like a web address.</span> : null}
            </label>
            <label className="block min-w-[10rem] flex-1 text-sm text-muted">
              Name shown
              <input
                name={`social_label_${index}`}
                value={row.label}
                onChange={(e) => update(row.key, { label: e.target.value })}
                placeholder={platform?.label ?? "e.g. Instagram"}
                className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" className={smallBtn} onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                ↑
              </button>
              <button
                type="button"
                className={smallBtn}
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className={`${smallBtn} text-red-700`}
                onClick={() => restructure(rows.filter((r) => r.key !== row.key))}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="focus-ring inline-flex h-10 items-center border border-green-700 bg-green-700 px-4 text-xs tracking-[0.16em] text-white uppercase hover:bg-green-800"
        onClick={() => {
          restructure([...rows, { key: nextKey.current++, url: "", label: "" }]);
        }}
      >
        + Add social link
      </button>
    </div>
  );
}
