"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAdminLoggedIn } from "@/lib/useAdminLoggedIn";

/**
 * Renders children only for a signed-in admin. Pass children from client code: children
 * handed down from a server component are still serialized into the page for visitors.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const loggedIn = useAdminLoggedIn();
  return loggedIn ? children : null;
}

/** Workshops menu item while Workshops are hidden from visitors. */
export function AdminWorkshopsNavItem({ className, onClick }: { className: string; onClick?: () => void }) {
  return (
    <AdminOnly>
      <li>
        <Link href="/workshops" className={className} onClick={onClick}>
          Workshops
        </Link>
      </li>
    </AdminOnly>
  );
}
