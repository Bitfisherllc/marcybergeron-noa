"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminGallerySwitcher } from "@/components/AdminGallerySwitcher";
import { AdminLink } from "@/components/AdminLink";
import {
  getAdminSiteBarStateAction,
  type AdminGallerySwitcherOption,
  logoutFromSiteAction,
} from "@/lib/adminBarActions";
import type { AdminEditTarget } from "@/lib/adminEditLink";

const btnClose =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center border border-paper/25 bg-paper/10 text-lg leading-none text-paper transition hover:bg-paper/20 focus-ring";

const newMessagesBarClass =
  "border-red-400/50 bg-red-500/20 text-red-300 hover:bg-red-500/30";

const viewBarLinkClass =
  "focus-ring inline-flex items-center justify-center border border-green-400/50 bg-green-500/15 px-4 py-2 text-xs tracking-[0.16em] text-green-300 uppercase transition hover:bg-green-500/25";

function formatViewBarLabel(label: string): string {
  let pageName = label.replace(/^View\s+/i, "").trim();
  if (pageName && pageName.charAt(0) === pageName.charAt(0).toLowerCase()) {
    pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  }
  return `VIEW (${pageName})`;
}

type AdminSiteBarProps = {
  /** Fetched on the server for admin routes so the bar does not wait on a client round trip. */
  contactCount?: number;
};

export function AdminSiteBar({ contactCount = 0 }: AdminSiteBarProps) {
  const pathname = usePathname() ?? "/";
  const [action, setAction] = useState<AdminEditTarget | null>(null);
  const [addArt, setAddArt] = useState<AdminEditTarget | null>(null);
  const [galleries, setGalleries] = useState<AdminGallerySwitcherOption[]>([]);
  const inAdmin = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  useEffect(() => {
    let cancelled = false;
    void getAdminSiteBarStateAction(pathname).then((state) => {
      if (cancelled || !state) return;
      setAction(state.action);
      setAddArt(state.addArt);
      setGalleries(state.galleries);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <>
      <div className="border-b border-ink/20 bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-2.5 md:px-8">
          <form action={logoutFromSiteAction}>
            <input type="hidden" name="returnTo" value={pathname} />
            <button type="submit" className={btnClose} aria-label="Sign out and hide admin bar" title="Sign out">
              <span aria-hidden="true">×</span>
            </button>
          </form>
          <p className="text-sm tracking-wide text-paper/95">Hi Marcy :)</p>
          <AdminLink variant="bar" href="/admin">
            ADMIN MENU
          </AdminLink>
          <AdminLink variant="bar" href={addArt?.href ?? "/admin/artworks/new"}>
            ADD ART
          </AdminLink>
          <AdminLink variant="bar" href="/medium">
            ORGANIZE ART
          </AdminLink>
          <AdminLink variant="bar" href="/admin/series">
            EDIT GALLERIES
          </AdminLink>
          {inAdmin ? (
            <AdminLink
              variant="bar"
              href="/admin/contact"
              className={contactCount > 0 ? newMessagesBarClass : undefined}
            >
              {contactCount > 0 ? "READ NEW MESSAGES" : "READ MESSAGES"}
            </AdminLink>
          ) : null}
          <AdminGallerySwitcher galleries={galleries} />
          <div className="flex-1" />
          {!inAdmin && action ? (
            <AdminLink variant="barAction" href={action.href}>
              {action.label}
            </AdminLink>
          ) : null}
        </div>
      </div>
      {inAdmin && action ? (
        <div className="border-b border-green-400/40 bg-green-950 text-green-100">
          <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-2 md:px-8">
            <AdminLink variant="bar" href={action.href} className={viewBarLinkClass}>
              {formatViewBarLabel(action.label)}
            </AdminLink>
          </div>
        </div>
      ) : null}
    </>
  );
}
