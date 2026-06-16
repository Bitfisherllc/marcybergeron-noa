"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin/login")) {
    return <div className="min-h-screen bg-paper text-ink">{children}</div>;
  }

  const onMenu = pathname === "/admin";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="border-b border-line bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          {onMenu ? (
            <span className="font-serif text-lg tracking-tight text-ink">Admin</span>
          ) : (
            <Link
              className="border border-ink bg-ink px-4 py-2.5 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90"
              href="/admin"
            >
              Admin Menu
            </Link>
          )}
          <form action={logoutAction}>
            <button className="text-xs tracking-[0.18em] text-muted uppercase hover:text-ink" type="submit">
              Log out
            </button>
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-12">{children}</div>
    </div>
  );
}
