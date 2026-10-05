"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { contactPage } from "@/db/schema";
import { getDb } from "@/db";
import { requireAdminSession } from "@/lib/auth";
import { CACHE_REVALIDATE_PROFILE, CACHE_TAGS } from "@/lib/cacheConfig";
import { CONTACT_PAGE_ID, CONTACT_PAGE_PARTS, type ContactPagePart } from "@/lib/contactDefaults";
import { getSiteContactForAdmin, splitStudioLines } from "@/lib/contactPage";
import { normalizeSocialUrl, type SocialLink } from "@/lib/socialLinks";

const ADMIN_PATH = "/admin/contact-page";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readSocialLinks(formData: FormData): { links: SocialLink[]; invalid: number } {
  const indexes = [...formData.keys()]
    .map((key) => key.match(/^social_url_(\d+)$/)?.[1])
    .filter((i): i is string => i !== undefined)
    .map(Number)
    .sort((a, b) => a - b);
  let invalid = 0;
  const links: SocialLink[] = [];
  for (const i of indexes) {
    const raw = text(formData, `social_url_${i}`);
    if (!raw) continue;
    const url = normalizeSocialUrl(raw);
    if (!url) {
      invalid += 1;
      continue;
    }
    links.push({ url, label: text(formData, `social_label_${i}`) });
  }
  return { links, invalid };
}

export async function saveContactPageAction(formData: FormData) {
  await requireAdminSession();
  const part = String(formData.get("part") ?? "") as ContactPagePart;
  if (!CONTACT_PAGE_PARTS.includes(part)) redirect(`${ADMIN_PATH}?error=part`);

  const next = await getSiteContactForAdmin();
  if (part === "heading") {
    next.eyebrow = text(formData, "eyebrow");
    next.title = text(formData, "title");
    next.intro = String(formData.get("intro") ?? "");
    if (!next.title) redirect(`${ADMIN_PATH}?error=title`);
  } else if (part === "details") {
    next.phone = text(formData, "phone");
    next.studioLines = splitStudioLines(String(formData.get("studio_lines") ?? ""));
  } else if (part === "social") {
    const { links, invalid } = readSocialLinks(formData);
    if (invalid > 0) redirect(`${ADMIN_PATH}?error=social`);
    next.socialLinks = links;
  } else {
    next.directionsEyebrow = text(formData, "directions_eyebrow");
    next.directionsTitle = text(formData, "directions_title");
    next.directionsIntro = String(formData.get("directions_intro") ?? "");
    if (!next.directionsTitle) redirect(`${ADMIN_PATH}?error=directions_title`);
  }

  const values = {
    eyebrow: next.eyebrow,
    title: next.title,
    intro: next.intro,
    phone: next.phone,
    studioLines: next.studioLines.join("\n"),
    socialLinks: next.socialLinks,
    directionsEyebrow: next.directionsEyebrow,
    directionsTitle: next.directionsTitle,
    directionsIntro: next.directionsIntro,
    updatedAt: new Date(),
  };
  await getDb()
    .insert(contactPage)
    .values({ id: CONTACT_PAGE_ID, ...values })
    .onConflictDoUpdate({ target: contactPage.id, set: values });

  revalidateTag(CACHE_TAGS.site, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/contact");
  revalidatePath("/directions");
  redirect(`${ADMIN_PATH}?saved=${part}`);
}
