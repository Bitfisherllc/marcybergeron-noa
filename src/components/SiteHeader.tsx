import Link from "next/link";
import { listMediumGalleries, listSeries } from "@/lib/queries";
import {
  portfolioDropdownItems,
} from "@/lib/portfolioGalleries";
import { SITE_NAME } from "@/lib/site";
import { artSeriesHref } from "@/lib/routeSlug";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
] as const;

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 4.25L6 7.75l3.5-3.5" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const dropdownPanelClass =
  "invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-[opacity,visibility] duration-150 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

function NavDropdownPanel({
  ariaLabel,
  overviewHref,
  overviewLabel,
  items,
}: {
  ariaLabel: string;
  overviewHref: string;
  overviewLabel: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div className={dropdownPanelClass} role="region" aria-label={ariaLabel}>
      <ul className="min-w-[14.5rem] border border-line bg-paper py-1.5 shadow-[0_8px_30px_rgba(31,31,31,0.08)]">
        <li>
          <Link
            href={overviewHref}
            className="block px-4 py-2.5 text-sm text-ink/90 transition-colors hover:bg-black/[0.04] hover:text-ink focus-visible:bg-black/[0.04] focus-visible:outline-none"
          >
            {overviewLabel}
          </Link>
        </li>
        <li className="mx-3 my-1 h-px bg-line" role="separator" />
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block px-4 py-2 text-[0.8125rem] leading-snug text-ink/75 transition-colors hover:bg-black/[0.04] hover:text-ink focus-visible:bg-black/[0.04] focus-visible:outline-none"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavDropdownLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-sm hover:text-ink focus-ring"
      aria-haspopup="true"
    >
      {label}
      <ChevronDown className="opacity-45 transition-[opacity,transform] duration-150 group-hover:translate-y-px group-hover:opacity-70" />
    </Link>
  );
}

function MobileNavSection({
  title,
  overviewHref,
  overviewLabel,
  items,
}: {
  title: string;
  overviewHref: string;
  overviewLabel: string;
  items: { href: string; label: string }[];
}) {
  return (
    <li className="border-b border-line/60 pb-2">
      <div className="px-2 py-2 text-[0.65rem] tracking-[0.2em] text-muted uppercase">{title}</div>
      <ul className="mt-0.5 space-y-0.5">
        <li>
          <Link className="block rounded-sm px-2 py-2 text-sm text-ink hover:bg-black/[0.03]" href={overviewHref}>
            {overviewLabel}
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.href}>
            <Link className="block rounded-sm px-2 py-2 text-sm text-ink/85 hover:bg-black/[0.03] hover:text-ink" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export async function SiteHeader() {
  const [seriesRaw, mediumGalleries] = await Promise.all([listSeries(), listMediumGalleries()]);
  const portfolioItems = portfolioDropdownItems(seriesRaw);
  const mediumItems = mediumGalleries.map((s) => ({ href: artSeriesHref(s.slug), label: s.title }));

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-6 md:px-8">
        <Link href="/" className="font-serif text-2xl tracking-tight text-ink focus-ring rounded-sm" aria-label={`${SITE_NAME} — home`}>
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm tracking-wide text-ink/80">
            <li className="group relative">
              <NavDropdownLink href="/art" label="Portfolio" />
              <NavDropdownPanel
                ariaLabel="Portfolio and series"
                overviewHref="/art"
                overviewLabel="View portfolio"
                items={portfolioItems}
              />
            </li>
            <li className="group relative">
              <NavDropdownLink href="/medium" label="Medium" />
              <NavDropdownPanel
                ariaLabel="Browse by medium"
                overviewHref="/medium"
                overviewLabel="All mediums"
                items={mediumItems}
              />
            </li>
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink focus-ring rounded-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-5 text-xs tracking-[0.18em] text-muted uppercase md:flex">
          <a className="hover:text-ink" href="https://www.instagram.com/marcysartspace/" rel="noreferrer" target="_blank">
            Instagram
          </a>
          <a className="hover:text-ink" href="https://www.facebook.com/marcy.bergeron" rel="noreferrer" target="_blank">
            Facebook
          </a>
        </div>
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-sm px-2 py-1 text-sm tracking-wide text-ink/80 focus-ring [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2.5rem,16rem)] border border-line bg-paper py-2 shadow-[0_8px_30px_rgba(31,31,31,0.08)]">
            <ul className="text-sm">
              <MobileNavSection title="Portfolio" overviewHref="/art" overviewLabel="View portfolio" items={portfolioItems} />
              <MobileNavSection title="Medium" overviewHref="/medium" overviewLabel="All mediums" items={mediumItems} />
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link className="block rounded-sm px-3 py-2.5 hover:bg-black/[0.03]" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </header>
  );
}
