import { artSeriesHref } from "@/lib/routeSlug";
import { isStudioGallerySlug } from "@/lib/mediumGalleries";
import { listMediumGalleries, listChildSeries, listAllPostsAdmin } from "@/lib/queries";
import { postPublicHref } from "@/lib/postKind";

export type HomeSlideLinkOption = {
  href: string;
  label: string;
};

export type HomeSlideLinkGroup = {
  label: string;
  options: HomeSlideLinkOption[];
};

const SITE_PAGES: HomeSlideLinkOption[] = [
  { href: "/medium", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/news", label: "News" },
  { href: "/workshops", label: "Workshops" },
  { href: "/contact", label: "Contact" },
  { href: "/mailing-list", label: "Mailing list" },
];

export async function listHomeSlideLinkGroups(): Promise<HomeSlideLinkGroup[]> {
  const [galleries, series, news, workshops] = await Promise.all([
    listMediumGalleries(),
    listChildSeries(),
    listAllPostsAdmin("news"),
    listAllPostsAdmin("workshop"),
  ]);

  const galleryOptions = galleries.map((s) => ({
    href: artSeriesHref(s.slug),
    label: isStudioGallerySlug(s.slug) ? "The Studio" : s.title,
  }));

  return [
    { label: "Site", options: SITE_PAGES },
    { label: "Galleries", options: galleryOptions },
    {
      label: "Series",
      options: series.map((s) => ({ href: artSeriesHref(s.slug), label: s.title })),
    },
    {
      label: "News",
      options: news
        .filter((p) => p.published)
        .map((p) => ({ href: postPublicHref("news", p.slug), label: p.title })),
    },
    {
      label: "Workshops",
      options: workshops
        .filter((p) => p.published)
        .map((p) => ({ href: postPublicHref("workshop", p.slug), label: p.title })),
    },
  ].filter((group) => group.options.length > 0);
}

export function allowedHomeSlideHrefs(groups: HomeSlideLinkGroup[]): Set<string> {
  return new Set(groups.flatMap((group) => group.options.map((option) => option.href)));
}

export function sanitizeHomeSlideHref(raw: string, allowed: Set<string>): string {
  const href = raw.trim();
  if (!href || !href.startsWith("/") || href.startsWith("//")) return "";
  return allowed.has(href) ? href : "";
}
