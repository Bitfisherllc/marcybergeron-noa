"use client";

import { usePathname, useRouter } from "next/navigation";
import { AdminLink } from "@/components/AdminLink";
import type { AdminGallerySwitcherOption } from "@/lib/adminBarActions";

function parseGalleryPath(pathname: string): { show: boolean; currentId: string | null; isNew: boolean } {
  if (pathname === "/admin/series/new") {
    return { show: true, currentId: null, isNew: true };
  }
  const match = pathname.match(/^\/admin\/series\/([^/]+)$/);
  if (!match || match[1] === "new") {
    return { show: false, currentId: null, isNew: false };
  }
  return { show: true, currentId: match[1]!, isNew: false };
}

export function AdminGallerySwitcher({ galleries }: { galleries: AdminGallerySwitcherOption[] }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { show, currentId, isNew } = parseGalleryPath(pathname);

  if (!show) return null;

  return (
    <div className="flex min-w-0 items-center gap-2 border-l border-paper/20 pl-4">
      <label className="sr-only" htmlFor="admin-gallery-switcher">
        Choose gallery
      </label>
      <select
        id="admin-gallery-switcher"
        value={isNew ? "__new__" : (currentId ?? "")}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "__new__") router.push("/admin/series/new");
          else router.push(`/admin/series/${value}`);
        }}
        className="focus-ring max-w-[11rem] truncate border border-paper/25 bg-paper/10 px-2 py-1.5 text-xs text-paper sm:max-w-[14rem]"
      >
        <option value="__new__" className="text-ink">
          + New gallery
        </option>
        {galleries.map((g) => (
          <option key={g.id} value={g.id} className="text-ink">
            {g.title}
          </option>
        ))}
      </select>
      <AdminLink variant="bar" href="/admin/series/new" className="hidden sm:inline-flex">
        New
      </AdminLink>
    </div>
  );
}
