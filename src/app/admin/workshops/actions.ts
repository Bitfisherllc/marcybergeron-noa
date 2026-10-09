"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { siteFeature } from "@/db/schema";
import { getDb } from "@/db";
import { requireAdminSession } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cacheConfig";
import { WORKSHOPS_FEATURE } from "@/lib/siteFeatures";

export async function saveWorkshopsVisibilityAction(formData: FormData) {
  await requireAdminSession();
  const enabled = String(formData.get("visible") ?? "") === "on";
  const updatedAt = new Date();
  await getDb()
    .insert(siteFeature)
    .values({ key: WORKSHOPS_FEATURE, enabled, updatedAt })
    .onConflictDoUpdate({ target: siteFeature.key, set: { enabled, updatedAt } });
  // Expire immediately (not stale-while-revalidate) so hiding takes effect on the very next visit.
  updateTag(CACHE_TAGS.site);
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/workshops?saved=${enabled ? "workshops-on" : "workshops-off"}`);
}
