"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession, getAdminSession } from "@/lib/auth";
import { resolveAdminBarTarget, resolveAdminAddArtTarget, type AdminEditTarget } from "@/lib/adminEditLink";
import { needsGallerySwitcher } from "@/lib/adminEditTarget";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { listSeries } from "@/lib/queries";

export type AdminGallerySwitcherOption = {
  id: string;
  title: string;
};

function safeReturnPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/admin")) return "/";
  return path;
}

/** Clear the admin cookie without navigating (client handles the redirect). */
export async function clearAdminSessionAction() {
  await destroyAdminSession();
}

/** Sign out from the preview bar and return to the public site. */
export async function logoutFromSiteAction(formData: FormData) {
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? "/"));
  await destroyAdminSession();
  redirect(returnTo);
}

export async function getAdminBarTargetAction(pathname: string): Promise<AdminEditTarget | null> {
  const session = await getAdminSession();
  if (!session) return null;
  return resolveAdminBarTarget(pathname);
}

export type AdminSiteBarState = {
  action: AdminEditTarget;
  addArt: AdminEditTarget;
  galleries: AdminGallerySwitcherOption[];
};

/** One round trip for the signed-in admin bar (edit/view link + optional gallery list). */
export async function getAdminSiteBarStateAction(pathname: string): Promise<AdminSiteBarState | null> {
  const session = await getAdminSession();
  if (!session) return null;

  const [action, addArt, galleries] = await Promise.all([
    resolveAdminBarTarget(pathname),
    resolveAdminAddArtTarget(pathname),
    needsGallerySwitcher(pathname)
      ? listSeries().then((rows) =>
          rows
            .filter((s) => isMediumGallerySlug(s.slug) || s.isPrivate)
            .map((s) => ({ id: s.id, title: s.title })),
        )
      : Promise.resolve([] as AdminGallerySwitcherOption[]),
  ]);

  return { action, addArt, galleries };
}
