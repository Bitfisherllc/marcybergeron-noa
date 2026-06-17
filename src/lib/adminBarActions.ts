"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession, getAdminSession } from "@/lib/auth";
import { resolveAdminBarTarget, type AdminEditTarget } from "@/lib/adminEditLink";
import { listSeries } from "@/lib/queries";

export type AdminGallerySwitcherOption = {
  id: string;
  title: string;
};

function safeReturnPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/admin")) return "/";
  return path;
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

export async function listGalleriesForSwitcherAction(): Promise<AdminGallerySwitcherOption[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const rows = await listSeries();
  return rows.map((s) => ({ id: s.id, title: s.title }));
}
