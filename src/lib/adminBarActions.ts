"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession, getAdminSession } from "@/lib/auth";
import { resolveAdminBarTarget, type AdminEditTarget } from "@/lib/adminEditLink";
import { countUnreadInbox } from "@/lib/inbox";

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
  /** Where the Public / Admin switch goes from this page. */
  toggle: AdminEditTarget;
  inboxCount: number;
};

/** One round trip for the signed-in admin bar. */
export async function getAdminSiteBarStateAction(pathname: string): Promise<AdminSiteBarState | null> {
  const session = await getAdminSession();
  if (!session) return null;

  const [toggle, inboxCount] = await Promise.all([resolveAdminBarTarget(pathname), countUnreadInbox()]);
  return { toggle, inboxCount };
}
