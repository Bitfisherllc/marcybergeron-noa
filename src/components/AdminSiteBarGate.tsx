"use client";

import { useEffect, useState } from "react";
import { AdminSiteBar } from "@/components/AdminSiteBar";

/** Loads admin session client-side so the public layout can stay cacheable. */
export function AdminSiteBarGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/session", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { loggedIn: false }))
      .then((data: { loggedIn?: boolean }) => {
        if (!cancelled) setShow(Boolean(data.loggedIn));
      })
      .catch(() => {
        if (!cancelled) setShow(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;
  return <AdminSiteBar />;
}
