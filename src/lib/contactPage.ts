import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { contactPage } from "@/db/schema";
import { getDb } from "@/db";
import { CACHE_TAGS, SITE_REVALIDATE_SECONDS } from "@/lib/cacheConfig";
import { CONTACT_PAGE_ID, SITE_CONTACT_DEFAULTS, type SiteContact } from "@/lib/contactDefaults";
import { parseSocialLinks } from "@/lib/socialLinks";

export function splitStudioLines(value: string): string[] {
  return value
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function getSiteContactUncached(): Promise<SiteContact> {
  try {
    const row = await getDb()
      .select()
      .from(contactPage)
      .where(eq(contactPage.id, CONTACT_PAGE_ID))
      .then((rows) => rows[0] ?? null);
    if (!row) return { ...SITE_CONTACT_DEFAULTS };
    return {
      email: SITE_CONTACT_DEFAULTS.email,
      eyebrow: row.eyebrow,
      title: row.title,
      intro: row.intro,
      phone: row.phone,
      studioLines: splitStudioLines(row.studioLines),
      socialLinks: parseSocialLinks(row.socialLinks),
      directionsEyebrow: row.directionsEyebrow,
      directionsTitle: row.directionsTitle,
      directionsIntro: row.directionsIntro,
    };
  } catch (e) {
    // Footer and header read this on every page; a missing table must not take the site down.
    console.error("[getSiteContact]", e);
    return { ...SITE_CONTACT_DEFAULTS };
  }
}

export const getSiteContact = unstable_cache(getSiteContactUncached, ["site-contact", "v1"], {
  revalidate: SITE_REVALIDATE_SECONDS,
  tags: [CACHE_TAGS.site],
});

export async function getSiteContactForAdmin(): Promise<SiteContact> {
  return getSiteContactUncached();
}
