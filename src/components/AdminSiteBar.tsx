"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearAdminSessionAction, getAdminSiteBarStateAction } from "@/lib/adminBarActions";
import { hasUnsavedForms, saveDirtyForms, useAdminSaveState } from "@/lib/adminDirtyForms";
import { needsRemoteAdminBarState, resolveLiveViewTargetSync } from "@/lib/adminEditTarget";

const LEAVE_WARNING = "You have unsaved changes on this page. Leave without saving?";

const barBtn =
  "focus-ring inline-flex h-9 items-center justify-center border border-paper/25 bg-paper/10 px-4 text-xs tracking-[0.16em] text-paper uppercase transition hover:bg-paper/20";

type AdminSiteBarProps = {
  /** Fetched on the server for admin routes so the bar does not wait on a client round trip. */
  inboxCount?: number;
};

export function AdminSiteBar({ inboxCount: serverInboxCount }: AdminSiteBarProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const inAdmin = pathname.startsWith("/admin");
  const saveState = useAdminSaveState();
  const [remote, setRemote] = useState<{ pathname: string; toggleHref: string; inboxCount: number } | null>(null);
  const [switchingFrom, setSwitchingFrom] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const leavingConfirmed = useRef(false);
  const [prevSaveState, setPrevSaveState] = useState(saveState);
  const [justSaved, setJustSaved] = useState(false);
  if (prevSaveState !== saveState) {
    setPrevSaveState(saveState);
    setJustSaved(prevSaveState === "saving" && saveState === "clean");
  }

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const remoteForPage = remote?.pathname === pathname ? remote : null;
  const toggleHref = remoteForPage?.toggleHref ?? resolveLiveViewTargetSync(pathname)?.href ?? null;
  const inboxCount = serverInboxCount ?? remote?.inboxCount ?? 0;
  const switching = switchingFrom === pathname;

  useEffect(() => {
    if (!needsRemoteAdminBarState(pathname)) return;
    let cancelled = false;
    void getAdminSiteBarStateAction(pathname).then((state) => {
      if (cancelled || !state) return;
      setRemote({ pathname, toggleHref: state.toggle.href, inboxCount: state.inboxCount });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    leavingConfirmed.current = false;
  }, [pathname]);

  useEffect(() => {
    if (saveState === "clean") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!leavingConfirmed.current) event.preventDefault();
    };
    // In-site links navigate without a page unload, so the browser would not warn on its own.
    const onLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.closest("[data-admin-bar]")) return;
      if (new URL(link.href).origin !== window.location.origin || link.getAttribute("href")?.startsWith("#")) return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onLinkClick, true);
    };
  }, [saveState]);

  /** Asks once (our dialog, not the browser's) before leaving with unsaved changes. */
  function confirmLeave(): boolean {
    if (hasUnsavedForms() && !window.confirm(LEAVE_WARNING)) return false;
    leavingConfirmed.current = true;
    return true;
  }

  function switchMode() {
    if (!confirmLeave()) return;
    const href = toggleHref ?? (inAdmin ? "/" : "/admin");
    setSwitchingFrom(pathname);
    // Public pages are cached; a full load guarantees the just-saved version is shown.
    if (inAdmin) window.location.assign(href);
    else router.push(href);
  }

  async function signOut() {
    if (!confirmLeave()) return;
    setClosed(true);
    try {
      await clearAdminSessionAction();
    } finally {
      window.location.assign(inAdmin ? "/" : pathname);
    }
  }

  if (closed) return null;

  const adminOn = switching ? !inAdmin : inAdmin;

  return (
    <div data-admin-bar className="sticky top-0 z-50 border-b border-ink/20 bg-ink text-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5 md:gap-5 md:px-8">
        <p className="hidden text-sm tracking-wide text-paper/90 sm:block">Hi Marcy :)</p>

        <button
          type="button"
          role="switch"
          aria-checked={adminOn}
          aria-label="Admin editing"
          onClick={switchMode}
          disabled={switching}
          className="focus-ring group inline-flex items-center gap-2.5 rounded-full text-xs tracking-[0.16em] uppercase disabled:cursor-wait"
        >
          <span className={adminOn ? "text-paper/50" : "text-paper"}>Public</span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
              adminOn ? "border-green-400/70 bg-green-500/70" : "border-paper/30 bg-paper/15"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-paper shadow transition-transform ${
                adminOn ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
          <span className={adminOn ? "text-green-300" : "text-paper/50"}>Admin</span>
        </button>

        <div className="flex-1" />

        {saveState !== "clean" ? (
          <button
            type="button"
            onClick={saveDirtyForms}
            disabled={saveState === "saving"}
            className={`focus-ring inline-flex h-9 items-center justify-center border border-red-500 px-5 text-xs font-medium tracking-[0.18em] text-white uppercase disabled:cursor-wait ${
              saveState === "saving" ? "bg-red-800" : "admin-save-flash bg-red-600"
            }`}
          >
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
        ) : justSaved ? (
          <span role="status" className="text-xs tracking-[0.16em] text-green-300 uppercase">
            Saved ✓
          </span>
        ) : null}

        <Link
          href="/admin/inbox"
          className={`${barBtn} relative px-2.5`}
          aria-label={inboxCount > 0 ? `Inbox, ${inboxCount} unread` : "Inbox"}
          title="Inbox"
          onClick={(event) => {
            if (!confirmLeave()) event.preventDefault();
          }}
        >
          <MailIcon />
          {inboxCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-semibold tracking-normal text-white">
              {inboxCount > 99 ? "99+" : inboxCount}
            </span>
          ) : null}
        </Link>

        <button type="button" className={barBtn} onClick={() => void signOut()}>
          Log out
        </button>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" strokeLinejoin="round" />
    </svg>
  );
}
