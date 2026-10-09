import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getWorkshopsPublic } from "@/lib/siteFeatures";

/** Cookies are read only while Workshops are hidden, so an ISR page would hit a static-to-dynamic error when the switch flips. */
export const dynamic = "force-dynamic";

export default async function WorkshopsLayout({ children }: { children: ReactNode }) {
  if (await getWorkshopsPublic()) return children;
  if (!(await getAdminSession())) notFound();

  return (
    <>
      <div className="border-b border-amber-300 bg-amber-50">
        <p
          role="note"
          className="mx-auto max-w-6xl px-5 py-3 text-sm leading-snug text-amber-950 md:px-8"
        >
          <strong className="font-semibold">Workshops are hidden from visitors.</strong> Only you can see these pages
          while signed in.{" "}
          <Link href="/admin/workshops" className="underline underline-offset-2 hover:text-ink">
            Turn them on in admin
          </Link>{" "}
          when you are ready to go live.
        </p>
      </div>
      {children}
    </>
  );
}
