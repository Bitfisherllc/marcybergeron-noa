import Link from "next/link";
import { listSeries } from "@/lib/queries";
import type { Series } from "@/db";
import { SITE_NAME } from "@/lib/site";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
] as const;

/** Art menu: New Work first, then all other series A–Z by title. */
function seriesForArtNav(series: Series[]): Series[] {
  const nw = series.find((s) => s.slug === "new-work");
  const rest = series
    .filter((s) => s.slug !== "new-work")
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  return nw ? [nw, ...rest] : [...rest].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 4.25L6 7.75l3.5-3.5" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArtDropdownPanel({ series }: { series: Series[] }) {
  return (
    <div
      className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-[opacity,visibility] duration-150 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      role="region"
      aria-label="Art and series"
    >
      <ul className="min-w-[14.5rem] border border-line bg-paper py-1.5 shadow-[0_8px_30px_rgba(31,31,31,0.08)]">
        <li>
          <Link
            href="/art"
            className="block px-4 py-2.5 text-sm text-ink/90 transition-colors hover:bg-black/[0.04] hover:text-ink focus-visible:bg-black/[0.04] focus-visible:outline-none"
          >
            All series
          </Link>
        </li>
        <li className="mx-3 my-1 h-px bg-line" role="separator" />
        {series.map((s) => (
          <li key={s.id}>
            <Link
              href={`/art/${s.slug}`}
              className="block px-4 py-2 text-[0.8125rem] leading-snug text-ink/75 transition-colors hover:bg-black/[0.04] hover:text-ink focus-visible:bg-black/[0.04] focus-visible:outline-none"
            >
              {s.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileArtSection({ series }: { series: Series[] }) {
  return (
    <li className="border-b border-line/60 pb-2">
      <div className="px-2 py-2 text-[0.65rem] tracking-[0.2em] text-muted uppercase">Art</div>
      <ul className="mt-0.5 space-y-0.5">
        <li>
          <Link className="block rounded-sm px-2 py-2 text-sm text-ink hover:bg-black/[0.03]" href="/art">
            All series
          </Link>
        </li>
        {series.map((s) => (
          <li key={s.id}>
            <Link className="block rounded-sm px-2 py-2 text-sm text-ink/85 hover:bg-black/[0.03] hover:text-ink" href={`/art/${s.slug}`}>
              {s.title}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export async function SiteHeader() {
  const seriesRaw = await listSeries();
  const series = seriesForArtNav(seriesRaw);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-6 md:px-8">
        <Link href="/" className="font-serif text-2xl tracking-tight text-ink focus-ring rounded-sm" aria-label={`${SITE_NAME} — home`}>
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm tracking-wide text-ink/80">
            <li className="group relative">
              <Link
                href="/art"
                className="inline-flex items-center gap-1.5 rounded-sm hover:text-ink focus-ring"
                aria-haspopup="true"
              >
                Art
                <ChevronDown className="opacity-45 transition-[opacity,transform] duration-150 group-hover:translate-y-px group-hover:opacity-70" />
              </Link>
              <ArtDropdownPanel series={series} />
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
              <MobileArtSection series={series} />
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
