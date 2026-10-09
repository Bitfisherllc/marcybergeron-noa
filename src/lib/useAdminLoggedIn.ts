"use client";

import { useEffect, useState } from "react";

let pending: Promise<boolean> | null = null;

/** Callers mounted together share one request; it is not reused afterward so a later login is picked up. */
function fetchAdminLoggedIn(): Promise<boolean> {
  pending ??= fetch("/api/admin/session", { credentials: "same-origin" })
    .then((res) => (res.ok ? res.json() : { loggedIn: false }))
    .then((data: { loggedIn?: boolean }) => Boolean(data.loggedIn))
    .catch(() => false)
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** Admin session checked client-side so public pages stay cacheable. */
export function useAdminLoggedIn(): boolean {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminLoggedIn().then((value) => {
      if (!cancelled) setLoggedIn(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return loggedIn;
}
