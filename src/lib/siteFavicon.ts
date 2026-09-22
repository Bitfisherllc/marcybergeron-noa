import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { siteFavicon } from "@/db/schema";
import { getDb } from "@/db";
import { CACHE_TAGS, SITE_REVALIDATE_SECONDS } from "@/lib/cacheConfig";

export const SITE_FAVICON_ID = "default";
export const DEFAULT_FAVICON_SRC = "/images/favicon.ico";

export type ResolvedFavicon = {
  src: string;
  href: string;
  type: string;
  isCustom: boolean;
  updatedAt: number;
};

function mimeFromSrc(src: string): string {
  const path = src.split("?")[0] ?? src;
  if (/\.ico$/i.test(path)) return "image/x-icon";
  if (/\.svg$/i.test(path)) return "image/svg+xml";
  if (/\.webp$/i.test(path)) return "image/webp";
  if (/\.jpe?g$/i.test(path)) return "image/jpeg";
  if (/\.gif$/i.test(path)) return "image/gif";
  return "image/png";
}

function withVersion(src: string, updatedAt: number): string {
  const version = String(updatedAt);
  return src.includes("?") ? `${src}&v=${version}` : `${src}?v=${version}`;
}

async function getResolvedFaviconUncached(): Promise<ResolvedFavicon> {
  const row = await getDb()
    .select()
    .from(siteFavicon)
    .where(eq(siteFavicon.id, SITE_FAVICON_ID))
    .then((rows) => rows[0] ?? null);
  if (!row?.image) {
    return {
      src: DEFAULT_FAVICON_SRC,
      href: DEFAULT_FAVICON_SRC,
      type: mimeFromSrc(DEFAULT_FAVICON_SRC),
      isCustom: false,
      updatedAt: 0,
    };
  }
  const updatedAt = row.updatedAt.getTime();
  return {
    src: row.image,
    href: withVersion(row.image, updatedAt),
    type: mimeFromSrc(row.image),
    isCustom: true,
    updatedAt,
  };
}

export const getResolvedFavicon = unstable_cache(getResolvedFaviconUncached, ["site-favicon", "v1"], {
  revalidate: SITE_REVALIDATE_SECONDS,
  tags: [CACHE_TAGS.site],
});

export async function getFaviconForAdmin(): Promise<ResolvedFavicon> {
  return getResolvedFaviconUncached();
}
