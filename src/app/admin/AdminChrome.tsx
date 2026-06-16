"use client";

import { usePathname } from "next/navigation";
import { AdminSiteBar } from "@/components/AdminSiteBar";

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin/login")) {
    return <div className="min-h-screen bg-paper text-ink">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AdminSiteBar />
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-12">{children}</div>
    </div>
  );
}
