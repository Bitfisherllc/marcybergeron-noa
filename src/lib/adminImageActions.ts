"use server";

import { requireAdminSession } from "@/lib/auth";
import { listArtworksWithSeriesForPicker } from "@/lib/queries";
import { listSiteImages, type SiteImageOption } from "@/lib/siteImages";

export async function listSiteImagesAction(): Promise<SiteImageOption[]> {
  await requireAdminSession();
  return listSiteImages();
}

/** Paintings for the “Choose a painting” dialog on any image field. */
export async function listPaintingsForPickerAction() {
  await requireAdminSession();
  return listArtworksWithSeriesForPicker();
}
