"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminGallerySwitcher } from "@/components/AdminGallerySwitcher";
import { AdminLink } from "@/components/AdminLink";
import { getAdminBarTargetAction, logoutFromSiteAction } from "@/lib/adminBarActions";
import type { AdminEditTarget } from "@/lib/adminEditLink";

const btnClose =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center border border-paper/25 bg-paper/10 text-lg leading-none text-paper transition hover:bg-paper/20 focus-ring";

export function AdminSiteBar() {
  const pathname = usePathname() ?? "/";
  const [action, setAction] = useState<AdminEditTarget | null>(null);
  const inAdmin = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  useEffect(() => {
    let cancelled = false;
    void getAdminBarTargetAction(pathname).then((target) => {
      if (!cancelled) setAction(target);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="border-b border-ink/20 bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-2.5 md:px-8">
        <form action={logoutFromSiteAction}>
          <input type="hidden" name="returnTo" value={pathname} />
          <button type="submit" className={btnClose} aria-label="Sign out and hide admin bar" title="Sign out">
            <span aria-hidden="true">×</span>
          </button>
        </form>
        <p className="text-sm tracking-wide text-paper/95">Hi Marcy :)</p>
        {inAdmin ? (
          <AdminLink variant="bar" href="/admin">
            Admin menu
          </AdminLink>
        ) : null}
        <AdminGallerySwitcher />
        <div className="flex-1" />
        {action ? (
          <AdminLink variant="barAction" href={action.href}>
            {action.label}
          </AdminLink>
        ) : (
          <span className="text-xs text-paper/50">…</span>
        )}
      </div>
    </div>
  );
}
