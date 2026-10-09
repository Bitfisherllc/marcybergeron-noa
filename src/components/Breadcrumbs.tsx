import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export type Crumb = { label: string; href: string };

/**
 * `items` runs from the section (e.g. Portfolio) down to the current page (last item).
 * Visible: the section as a back button, then any intermediate parents; Home and the current page are omitted.
 * The full trail (Home → current page) is still emitted as schema.org BreadcrumbList for search results.
 */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: `${SITE_URL}${crumb.href === "/" ? "" : crumb.href}`,
    })),
  };
  const [section, ...parents] = items.slice(0, -1);

  return (
    <nav aria-label="Breadcrumb" className={className}>
      {section ? (
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs tracking-wide text-muted">
          <li>
            <Link
              href={section.href}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-line py-1.5 pr-3 pl-2 text-ink/70 transition hover:border-ink/25 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {section.label}
            </Link>
          </li>
          {parents.map((crumb) => (
            <li key={crumb.href} className="flex min-w-0 items-center gap-x-2">
              <span aria-hidden className="text-muted/60">
                /
              </span>
              <Link href={crumb.href} className="truncate rounded-sm hover:text-ink focus-ring">
                {crumb.label}
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </nav>
  );
}
