"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

type NavItem = { href: string; label: string };

function HamburgerIcon() {
  return (
    <span className="relative block h-3.5 w-[18px]" aria-hidden>
      <span className="absolute top-0 left-0 block h-px w-full bg-current" />
      <span className="absolute top-1.5 left-0 block h-px w-full bg-current" />
      <span className="absolute top-[14px] left-0 block h-px w-full bg-current" />
    </span>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function MobileNavSection({
  title,
  overviewHref,
  overviewLabel,
  items,
  onNavigate,
}: {
  title: string;
  overviewHref?: string;
  overviewLabel?: string;
  items: NavItem[];
  onNavigate: () => void;
}) {
  return (
    <li className="border-b border-line/60 pb-3">
      <div className="px-1 py-2 text-[0.65rem] tracking-[0.2em] text-muted uppercase">{title}</div>
      <ul className="space-y-0.5">
        {overviewHref && overviewLabel ? (
          <li>
            <Link
              className="block rounded-sm px-1 py-2.5 text-sm text-ink hover:bg-black/[0.03]"
              href={overviewHref}
              onClick={onNavigate}
            >
              {overviewLabel}
            </Link>
          </li>
        ) : null}
        {items.map((item) => (
          <li key={item.href}>
            <Link
              className="block rounded-sm px-1 py-2.5 text-sm text-ink/85 hover:bg-black/[0.03] hover:text-ink"
              href={item.href}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function SiteMobileMenu({
  portfolioItems,
  seriesItems,
  aboutItems,
  seriesIndexHref,
  navLinks,
}: {
  portfolioItems: NavItem[];
  seriesItems: NavItem[];
  aboutItems: NavItem[];
  seriesIndexHref: string;
  navLinks: readonly NavItem[];
}) {
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    close();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className={`relative z-[90] inline-flex h-10 w-10 items-center justify-center rounded-sm text-ink/80 transition-opacity duration-200 focus-ring ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <HamburgerIcon />
      </button>

      <div
        className={`fixed inset-0 z-[80] bg-ink/45 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        aria-label="Close menu"
        onClick={close}
      />

      <nav
        id={panelId}
        aria-label="Mobile"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 right-0 z-[81] flex w-[min(20rem,86vw)] flex-col border-l border-line bg-paper shadow-[-16px_0_40px_rgba(31,31,31,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-xs tracking-[0.2em] text-muted uppercase">Menu</p>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-ink/75 transition hover:bg-black/[0.03] hover:text-ink focus-ring"
            aria-label="Close menu"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-5 py-4 text-sm">
          <MobileNavSection
            title="Portfolio"
            overviewHref="/medium"
            overviewLabel="View portfolio"
            items={portfolioItems}
            onNavigate={close}
          />
          <MobileNavSection
            title="Series"
            overviewHref={seriesIndexHref}
            overviewLabel="View series"
            items={seriesItems}
            onNavigate={close}
          />
          <MobileNavSection title="About" items={aboutItems} onNavigate={close} />
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                className="block rounded-sm px-1 py-2.5 hover:bg-black/[0.03]"
                href={link.href}
                onClick={close}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
