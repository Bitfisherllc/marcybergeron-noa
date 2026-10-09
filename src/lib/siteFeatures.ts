import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { siteFeature } from "@/db/schema";
import { getDb } from "@/db";
import { getAdminSession } from "@/lib/auth";
import { CACHE_TAGS, SITE_REVALIDATE_SECONDS } from "@/lib/cacheConfig";

export const WORKSHOPS_FEATURE = "workshops";

async function isFeatureEnabledUncached(key: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ enabled: siteFeature.enabled })
    .from(siteFeature)
    .where(eq(siteFeature.key, key));
  return row?.enabled ?? false;
}

/** Workshops stay hidden from visitors until turned on in admin. */
export const getWorkshopsPublic = unstable_cache(
  () => isFeatureEnabledUncached(WORKSHOPS_FEATURE),
  ["site-feature", "v1", WORKSHOPS_FEATURE],
  {
    revalidate: SITE_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.site],
  },
);

export async function getWorkshopsPublicForAdmin(): Promise<boolean> {
  return isFeatureEnabledUncached(WORKSHOPS_FEATURE);
}

/** Visitors when Workshops are on; otherwise only a signed-in admin (reads the session cookie). */
export async function canViewWorkshops(): Promise<boolean> {
  if (await getWorkshopsPublic()) return true;
  return Boolean(await getAdminSession());
}

/** Pages render alongside the layout, so each workshop page and its metadata must check too or its content streams with the 404. */
export async function requireWorkshopsVisible(): Promise<void> {
  if (!(await canViewWorkshops())) notFound();
}

export function isWorkshopsHref(href: string | undefined): boolean {
  if (!href) return false;
  return href === "/workshops" || href.startsWith("/workshops/") || href.startsWith("/workshops?");
}
