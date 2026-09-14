import Image from "next/image";
import Link from "next/link";
import { SiteMobileMenu } from "@/components/SiteMobileMenu";
import { listMediumGalleries } from "@/lib/queries";
import { aboutNavDropdownItems, portfolioNavDropdownItems } from "@/lib/mediumGalleries";
import { CONTACT, SITE_NAME } from "@/lib/site";

const workshopsLink = { href: "/workshops", label: "Workshops" } as const;

const navLinks = [
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
] as const;

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 4.25L6 7.75l3.5-3.5" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const dropdownPanelClass =
  "invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-[opacity,visibility] duration-150 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

function dropdownItemClass(emphasized?: boolean) {
  return emphasized
    ? "block px-4 py-2.5 text-sm text-ink/90 transition-colors hover:bg-black/[0.04] hover:text-ink focus-visible:bg-black/[0.04] focus-visible:outline-none"
    : "block px-4 py-2 text-[0.8125rem] leading-snug text-ink/75 transition-colors hover:bg-black/[0.04] hover:text-ink focus-visible:bg-black/[0.04] focus-visible:outline-none";
}

function NavDropdownPanel({
  ariaLabel,
  overviewHref,
  overviewLabel,
  items,
  trailingItems,
}: {
  ariaLabel: string;
  overviewHref?: string;
  overviewLabel?: string;
  items: { href: string; label: string }[];
  trailingItems?: { href: string; label: string }[];
}) {
  return (
    <div className={dropdownPanelClass} role="region" aria-label={ariaLabel}>
      <ul className="min-w-[14.5rem] border border-line bg-paper py-1.5 shadow-[0_8px_30px_rgba(31,31,31,0.08)]">
        {overviewHref && overviewLabel ? (
          <>
            <li>
              <Link href={overviewHref} className={dropdownItemClass(true)}>
                {overviewLabel}
              </Link>
            </li>
            <li className="mx-3 my-1 h-px bg-line" role="separator" />
          </>
        ) : null}
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={dropdownItemClass()}>
              {item.label}
            </Link>
          </li>
        ))}
        {trailingItems?.length ? (
          <>
            <li className="mx-3 my-1 h-px bg-line" role="separator" />
            {trailingItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={dropdownItemClass()}>
                  {item.label}
                </Link>
              </li>
            ))}
          </>
        ) : null}
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

export async function SiteHeader() {
  const portfolioGalleries = await listMediumGalleries();
  const portfolioItems = portfolioNavDropdownItems(portfolioGalleries);
  const aboutItems = aboutNavDropdownItems();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-6 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-sm font-serif text-2xl tracking-tight text-ink focus-ring"
          aria-label={`${SITE_NAME} — home`}
        >
          <Image
            src="/images/logo.svg"
            alt=""
            width={512}
            height={1254}
            className="h-[1.45em] w-auto shrink-0 object-contain object-left brightness-0"
          />
          <span>{SITE_NAME}</span>
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm tracking-wide text-ink/80">
            <li className="group relative">
              <NavDropdownLink href="/medium" label="Portfolio" />
              <NavDropdownPanel
                ariaLabel="Portfolio galleries"
                overviewHref="/medium"
                overviewLabel="View portfolio"
                items={portfolioItems}
              />
            </li>
            <li>
              <Link href={workshopsLink.href} className="hover:text-ink focus-ring rounded-sm">
                {workshopsLink.label}
              </Link>
            </li>
            <li className="group relative">
              <NavDropdownLink href="/about" label="About" />
              <NavDropdownPanel ariaLabel="About" items={aboutItems} />
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
        <div className="hidden items-center md:flex">
          <a
            className="rounded-sm text-muted hover:text-ink focus-ring"
            href={CONTACT.instagram}
            rel="me noreferrer"
            target="_blank"
            aria-label="Instagram"
          >
            <InstagramIcon className="block opacity-80" />
          </a>
        </div>
        <SiteMobileMenu
          portfolioItems={portfolioItems}
          aboutItems={aboutItems}
          workshopsLink={workshopsLink}
          navLinks={navLinks}
          instagramHref={CONTACT.instagram}
        />
      </div>
    </header>
  );
}
