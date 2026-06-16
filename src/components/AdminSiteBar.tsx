"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAdminBarTargetAction, logoutFromSiteAction } from "@/lib/adminBarActions";
import type { AdminEditTarget } from "@/lib/adminEditLink";

const btnClose =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center border border-paper/25 bg-paper/10 text-lg leading-none text-paper transition hover:bg-paper/20 focus-ring";

const btnAction =
  "inline-flex items-center border border-paper bg-paper px-4 py-2 text-xs tracking-[0.16em] text-ink uppercase transition hover:bg-paper/90 focus-ring";

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
          <Link href="/admin" className="text-xs tracking-wide text-paper/65 underline-offset-2 hover:text-paper hover:underline">
            Admin menu
          </Link>
        ) : null}
        <div className="flex-1" />
        {action ? (
          <Link href={action.href} className={btnAction}>
            {action.label}
          </Link>
        ) : (
          <span className="text-xs text-paper/50">…</span>
        )}
      </div>
    </div>
  );
}
