"use client";

import { AdminSiteBar } from "@/components/AdminSiteBar";
import { useAdminLoggedIn } from "@/lib/useAdminLoggedIn";

/** Loads admin session client-side so the public layout can stay cacheable. */
export function AdminSiteBarGate() {
  const show = useAdminLoggedIn();
  if (!show) return null;
  return <AdminSiteBar />;
}
