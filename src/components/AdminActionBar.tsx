"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const actionBtn =
  "focus-ring inline-flex h-8 items-center justify-center border border-green-500 bg-green-600 px-4 text-xs tracking-[0.16em] text-white uppercase transition hover:bg-green-700";

type BarAction = { href: string; label: string };

const SECTION_SELECTOR = "[data-admin-section]";

function actionsFor(pathname: string): BarAction[] {
  if (pathname === "/admin/posts") return [{ href: "/admin/posts/new", label: "Add a post" }];
  if (pathname === "/admin/series") return [{ href: "/admin/series/new", label: "Add a series" }];
  if (pathname.startsWith("/admin/workshops") && pathname !== "/admin/workshops/new") {
    return [{ href: "/admin/workshops/new", label: "Add a workshop" }];
  }
  return [];
}

function readSectionLabels(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR), (el) => el.dataset.adminSection ?? "");
}

/** Labels of the sections tagged with `data-admin-section` on the current page. */
function usePageSections(pathname: string): string[] {
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    let frame = 0;
    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readSectionLabels();
        setLabels((prev) => (prev.join("\n") === next.join("\n") ? prev : next));
      });
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname]);

  return labels;
}

function scrollToSection(index: number) {
  const target = document.querySelectorAll<HTMLElement>(SECTION_SELECTOR)[index];
  if (!target) return;
  const stickyTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--admin-sticky-top")) || 57;
  const top = target.getBoundingClientRect().top + window.scrollY - stickyTop - 16;
  window.scrollTo({ top, behavior: "smooth" });
  target
    .querySelector<HTMLElement>("input:not([type=hidden]):not([type=file]), textarea, select")
    ?.focus({ preventScroll: true });
}

/** Second admin bar for page-specific actions; sits between the admin bar and the site menu. */
export function AdminActionBar() {
  const pathname = usePathname() ?? "";
  const actions = actionsFor(pathname);
  const sections = usePageSections(pathname);

  return (
    <div className="border-b border-ink/20 bg-[#3a3a3a] text-paper">
      <div className="mx-auto flex min-h-12 max-w-6xl items-center gap-3 px-5 py-2 md:px-8">
        {sections.length > 1 ? (
          <label className="flex items-center gap-2 text-xs tracking-[0.16em] uppercase">
            <span>Jump to section</span>
            <select
              value=""
              className="focus-ring h-8 border border-paper/40 bg-paper px-2 text-sm tracking-normal text-ink normal-case"
              onChange={(event) => scrollToSection(Number(event.target.value))}
            >
              <option value="" disabled>
                Choose a section…
              </option>
              {sections.map((label, i) => (
                <option key={`${i}-${label}`} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className={actionBtn}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
