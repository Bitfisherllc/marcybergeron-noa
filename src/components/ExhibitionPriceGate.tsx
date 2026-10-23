"use client";

import { useEffect, useId, useRef, useState } from "react";
import { loginToViewPrices, logoutPriceView } from "@/app/(site)/exhibitions/actions";

const buttonClass =
  "inline-flex border border-ink bg-ink px-4 py-3 text-sm text-paper transition hover:bg-ink/90 focus-ring";

export function ExhibitionPriceGate({
  returnTo,
  signedIn,
  error,
}: {
  returnTo: string;
  signedIn: boolean;
  error?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(error));
  const titleId = useId();
  const passwordRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(Boolean(error));
  }, [error, signedIn]);

  useEffect(() => {
    if (!open) return;
    passwordRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  if (signedIn) {
    return (
      <form action={logoutPriceView} className="mt-8">
        <input type="hidden" name="returnTo" value={returnTo} />
        <button type="submit" className="link-quiet text-sm">
          Hide prices
        </button>
      </form>
    );
  }

  return (
    <>
      <button ref={triggerRef} type="button" className={`${buttonClass} mt-8`} onClick={() => setOpen(true)}>
        Exhibition Attendees Price Guide
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={close}
        >
          <div
            className="w-full max-w-md border border-line bg-paper px-6 py-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="font-serif text-2xl tracking-tight">
                Exhibition Attendees Price Guide
              </h2>
              <button
                type="button"
                className="focus-ring border border-line px-3 py-1.5 text-xs tracking-wide uppercase"
                onClick={close}
              >
                Close
              </button>
            </div>
            <form action={loginToViewPrices} className="mt-5">
              <p className="text-sm leading-relaxed text-muted">
                Thank you for attending. Enter the password shared at the exhibition to see prices.
              </p>
              {error ? <p className="mt-2 text-sm leading-relaxed text-ink">That password is not right.</p> : null}
              <label className="mt-4 block text-sm text-muted">
                Password
                <input
                  ref={passwordRef}
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  aria-invalid={error || undefined}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" className={`${buttonClass} mt-4`}>
                See prices
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
