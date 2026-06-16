import type { ReactNode } from "react";
import { AdminSiteBar } from "@/components/AdminSiteBar";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getAdminSession } from "@/lib/auth";

/** Public pages read Turso/SQLite at request time so content updates without a stale static shell from an empty build. */
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      {session ? <AdminSiteBar /> : null}
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
