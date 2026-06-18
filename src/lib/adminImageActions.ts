"use server";

import { requireAdminSession } from "@/lib/auth";
import { listSiteImages, type SiteImageOption } from "@/lib/siteImages";

export async function listSiteImagesAction(): Promise<SiteImageOption[]> {
  await requireAdminSession();
  return listSiteImages();
}
