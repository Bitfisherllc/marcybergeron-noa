"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin/login")) {
    return <div className="min-h-screen bg-paper text-ink">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="border-b border-line bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-6 text-sm">
            <Link className="font-serif text-lg tracking-tight" href="/admin">
              Admin
            </Link>
            <nav className="flex flex-wrap gap-4 text-xs tracking-[0.18em] text-muted uppercase">
              <Link className="hover:text-ink" href="/admin/home">
                Home page
              </Link>
              <Link className="hover:text-ink" href="/admin/series">
                Series
              </Link>
              <Link className="hover:text-ink" href="/admin/posts">
                Posts
              </Link>
              <Link className="hover:text-ink" href="/admin/mailing-list">
                Mailing list
              </Link>
              <Link className="hover:text-ink" href="/">
                Site
              </Link>
            </nav>
          </div>
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
