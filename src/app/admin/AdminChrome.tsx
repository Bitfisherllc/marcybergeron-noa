"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminActionBar } from "@/components/AdminActionBar";
import { AdminSiteBar } from "@/components/AdminSiteBar";
import { AdminUploadFormGuard } from "@/components/AdminUploadFormGuard";

/** Height of the sticky admin bar (h-14 plus its bottom border). */
const ADMIN_BAR_HEIGHT = 57;

export default function AdminChrome({
  children,
  header,
  footer,
  inboxCount = 0,
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  inboxCount?: number;
}) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/admin/login");
  const headerRef = useRef<HTMLDivElement>(null);

  // Sticky editor toolbars sit below both the admin bar and the site menu.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--admin-sticky-top", `${ADMIN_BAR_HEIGHT + el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--admin-sticky-top");
    };
  }, [isLogin]);

  if (isLogin) {
    return <div className="min-h-screen bg-paper text-ink">{children}</div>;
  }

  return (
    <>
      <AdminSiteBar inboxCount={inboxCount} />
      <AdminActionBar />
      <div ref={headerRef} className="sticky z-40" style={{ top: ADMIN_BAR_HEIGHT }}>
        {header}
      </div>
      <main id="main" className="flex-1">
        <AdminUploadFormGuard>
          <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-12">{children}</div>
        </AdminUploadFormGuard>
      </main>
      {footer}
    </>
  );
}
