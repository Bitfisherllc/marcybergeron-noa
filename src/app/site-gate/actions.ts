"use server";

import { redirect } from "next/navigation";
import { setSiteGateCookie, verifySiteGatePassword } from "@/lib/siteGate";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function unlockSiteGate(formData: FormData) {
  const password = formData.get("password")?.toString() ?? "";
  const next = safeNextPath(formData.get("next")?.toString() ?? null);

  if (!verifySiteGatePassword(password)) {
    redirect(`/site-gate?error=1&next=${encodeURIComponent(next)}`);
  }

  try {
    await setSiteGateCookie();
  } catch {
    redirect(`/site-gate?error=config&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}
