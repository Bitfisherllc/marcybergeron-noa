"use client";

import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not load.")));
    script.onerror = () => {
      script.remove();
      scriptPromise = null;
      reject(new Error("Turnstile script failed to load."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget. Place inside a `<form>`: it adds the hidden `cf-turnstile-response` field.
 * Renders nothing until `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set.
 */
export function Turnstile({ className = "" }: { className?: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!siteKey || !container) return;

    let cancelled = false;
    let widgetId: string | undefined;
    let api: TurnstileApi | undefined;

    // Tokens are single-use, so issue a fresh one for the next attempt once the browser has read this one.
    const form = container.closest("form");
    const onSubmit = () => {
      window.setTimeout(() => {
        if (api && widgetId) api.reset(widgetId);
      }, 0);
    };
    form?.addEventListener("submit", onSubmit);

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        api = turnstile;
        widgetId = turnstile.render(container, {
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          appearance: "always",
        });
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
      form?.removeEventListener("submit", onSubmit);
      if (api && widgetId) api.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className={className} />;
}
