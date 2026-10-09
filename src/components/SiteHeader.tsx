import Image from "next/image";
import Link from "next/link";
import { AdminWorkshopsNavItem } from "@/components/AdminOnly";
import { SiteMobileMenu } from "@/components/SiteMobileMenu";
import { SocialIcon } from "@/components/SocialIcon";
import type { Series } from "@/db";
import { getSiteContact } from "@/lib/contactPage";
import { listMediumGalleries } from "@/lib/queries";
import {
  aboutNavDropdownItems,
  isStudioGallerySlug,
  portfolioNavDropdownItems,
  publicPortfolioGalleries,
} from "@/lib/mediumGalleries";
import { SITE_NAME } from "@/lib/site";
import { getWorkshopsPublic } from "@/lib/siteFeatures";
import { socialLinkLabel } from "@/lib/socialLinks";

const workshopsLink = { href: "/workshops", label: "Workshops" } as const;

const navLinks = [
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

type NavItem = { href: string; label: string };

type HeaderNav = {
  home?: NavItem;
  portfolio: { href: string; overviewLabel: string; items: NavItem[] };
  /** `null` while Workshops are hidden from visitors (shown client-side to a signed-in admin). */
  workshops: NavItem | null;
  about: { href: string; items: NavItem[] };
  links: readonly NavItem[];
};

function publicNav(galleries: Series[], workshopsPublic: boolean): HeaderNav {
  return {
    portfolio: { href: "/medium", overviewLabel: "View portfolio", items: portfolioNavDropdownItems(galleries) },
    workshops: workshopsPublic ? workshopsLink : null,
    about: { href: "/about", items: aboutNavDropdownItems() },
    links: navLinks,
  };
}

/** Same menu, but every item opens the admin screen for that page. */
function adminNav(galleries: Series[]): HeaderNav {
  const studio = galleries.find((s) => isStudioGallerySlug(s.slug));
  return {
    home: { href: "/admin/home", label: "Home" },
    portfolio: {
      href: "/admin/series",
      overviewLabel: "All galleries",
      items: publicPortfolioGalleries(galleries).map((s) => ({ href: `/admin/series/${s.id}`, label: s.title })),
    },
    workshops: { href: "/admin/workshops", label: "Workshops" },
    about: {
      href: "/admin/about",
      items: [
        { href: "/admin/about", label: "About Marcy" },
        ...(studio ? [{ href: `/admin/series/${studio.id}`, label: "The Studio" }] : []),
      ],
    },
    links: [
      { href: "/admin/posts", label: "News" },
      { href: "/admin/contact-page", label: "Contact" },
    ],
  };
}

export async function SiteHeader({ admin = false }: { admin?: boolean }) {
  const [portfolioGalleries, contact, workshopsPublic] = await Promise.all([
    listMediumGalleries(),
    getSiteContact(),
    admin ? true : getWorkshopsPublic(),
  ]);
  const nav = admin ? adminNav(portfolioGalleries) : publicNav(portfolioGalleries, workshopsPublic);

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-6 md:px-8">
        {admin ? (
          <p
            role="note"
            className="flex max-w-[20rem] items-start gap-2.5 rounded-md border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 px-3.5 py-2.5 text-sm leading-snug text-amber-950 shadow-sm"
          >
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 size-4 shrink-0 text-amber-600"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Marcy, choose the page you would like to edit. Always click{" "}
              <strong className="font-semibold uppercase">save</strong> after editing.
            </span>
          </p>
        ) : (
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
        )}
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm tracking-wide text-ink/80">
            {nav.home ? (
              <li>
                <Link href={nav.home.href} className="hover:text-ink focus-ring rounded-sm">
                  {nav.home.label}
                </Link>
              </li>
            ) : null}
            <li className="group relative">
              <NavDropdownLink href={nav.portfolio.href} label="Portfolio" />
              <NavDropdownPanel
                ariaLabel="Portfolio galleries"
                overviewHref={nav.portfolio.href}
                overviewLabel={nav.portfolio.overviewLabel}
                items={nav.portfolio.items}
              />
            </li>
            {nav.workshops ? (
              <li>
                <Link href={nav.workshops.href} className="hover:text-ink focus-ring rounded-sm">
                  {nav.workshops.label}
                </Link>
              </li>
            ) : (
              <AdminWorkshopsNavItem className="hover:text-ink focus-ring rounded-sm" />
            )}
            <li className="group relative">
              <NavDropdownLink href={nav.about.href} label="About" />
              <NavDropdownPanel ariaLabel="About" items={nav.about.items} />
            </li>
            {nav.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink focus-ring rounded-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          {contact.socialLinks.map((link) => (
            <a
              key={link.url}
              className="rounded-sm text-muted hover:text-ink focus-ring"
              href={link.url}
              rel="me noreferrer"
              target="_blank"
              aria-label={socialLinkLabel(link)}
              title={socialLinkLabel(link)}
            >
              <SocialIcon url={link.url} className="block opacity-80" />
            </a>
          ))}
        </div>
        <SiteMobileMenu
          homeLink={nav.home}
          portfolioHref={nav.portfolio.href}
          portfolioOverviewLabel={nav.portfolio.overviewLabel}
          portfolioItems={nav.portfolio.items}
          aboutItems={nav.about.items}
          workshopsLink={nav.workshops}
          navLinks={nav.links}
          socialLinks={contact.socialLinks}
        />
      </div>
    </header>
  );
}
