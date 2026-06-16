"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { STUDIO } from "@/lib/site";

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(meters: number): { miles: string; km: string } {
  const miles = meters / 1609.344;
  const km = meters / 1000;
  return {
    miles: miles < 10 ? miles.toFixed(1) : miles.toFixed(0),
    km: km < 10 ? km.toFixed(1) : km.toFixed(0),
  };
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function geoErrorCode(err: unknown): number | null {
  if (err && typeof err === "object" && "code" in err && typeof (err as GeolocationPositionError).code === "number") {
    return (err as GeolocationPositionError).code;
  }
  return null;
}

type LocationStatus = "idle" | "loading" | "ok" | "denied" | "error" | "unsupported" | "insecure";

/** Button + distance readout — place directly under the map on /directions. */
export function StudioLocationPanel() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [meters, setMeters] = useState<number | null>(null);

  const applyPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude } = pos.coords;
    const d = haversineMeters(latitude, longitude, STUDIO.latitude, STUDIO.longitude);
    setMeters(d);
    setStatus("ok");
  }, []);

  const requestLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    const { hostname } = window.location;
    if (!window.isSecureContext && !isLocalHostname(hostname)) {
      setStatus("insecure");
      return;
    }

    setStatus("loading");
    setMeters(null);

    const attempts: PositionOptions[] = [
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30_000 },
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 30_000 },
    ];

    for (let i = 0; i < attempts.length; i++) {
      try {
        const pos = await getPosition(attempts[i]!);
        applyPosition(pos);
        return;
      } catch (err) {
        const code = geoErrorCode(err);
        if (code === 1) {
          setStatus("denied");
          return;
        }
        if (i === attempts.length - 1) setStatus("error");
      }
    }
  };

  const distance = meters !== null ? formatDistance(meters) : null;

  return (
    <div className="mt-4 border border-line bg-white/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Your distance</p>
          {status === "ok" && distance ? (
            <p className="mt-2 font-serif text-3xl tracking-tight text-ink md:text-4xl">
              {distance.miles} <span className="text-2xl md:text-3xl">miles</span>
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Press the button to see how far you are from the studio (straight-line).
            </p>
          )}
          {status === "ok" && distance ? (
            <p className="mt-1 text-sm text-muted">About {distance.km} km to Porter Mill Studios</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void requestLocation()}
          disabled={status === "loading" || status === "insecure"}
          className="focus-ring shrink-0 border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90 disabled:opacity-50"
        >
          {status === "loading" ? "Locating…" : "Use my location"}
        </button>
      </div>

      {status === "insecure" ? (
        <p className="mt-4 text-sm text-muted">
          Location only works on a secure <strong className="font-medium text-ink">HTTPS</strong> page (or localhost
          while developing).
        </p>
      ) : null}
      {status === "unsupported" ? (
        <p className="mt-4 text-sm text-muted">This browser does not support location.</p>
      ) : null}
      {status === "denied" ? (
        <p className="mt-4 text-sm text-muted">
          Location was blocked. Click the lock icon in your address bar, allow location for this site, then try again.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-4 text-sm text-muted">
          Could not read your location. Try again near a window, or use Google / Apple Maps below for driving directions.
        </p>
      ) : null}
    </div>
  );
}

export function StudioDirectionsLinks() {
  const googleDest = useMemo(() => encodeURIComponent(STUDIO.mapsSearchQuery), []);
  const directionsBase = useMemo(
    () => `https://www.google.com/maps/dir/?api=1&destination=${googleDest}`,
    [googleDest],
  );

  const appleMapsUrl = `https://maps.apple.com/?daddr=${STUDIO.latitude},${STUDIO.longitude}`;

  return (
    <div className="mt-12 space-y-8 border-t border-line pt-10">
      <div>
        <h2 className="font-serif text-2xl tracking-tight text-ink">Get directions</h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Opens your maps app with driving, walking, or transit options to Porter Mill Studios.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <a
            href={directionsBase}
            className="focus-ring inline-flex border border-ink px-5 py-3 text-xs tracking-[0.18em] uppercase hover:bg-black/[0.03]"
            rel="noreferrer"
            target="_blank"
          >
            Google Maps
          </a>
          <a
            href={appleMapsUrl}
            className="focus-ring inline-flex border border-line px-5 py-3 text-xs tracking-[0.18em] uppercase hover:bg-black/[0.03]"
            rel="noreferrer"
            target="_blank"
          >
            Apple Maps
          </a>
          <Link href="/contact" className="link-quiet self-center text-sm">
            ← Back to contact
          </Link>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use StudioLocationPanel + StudioDirectionsLinks on the directions page. */
export function StudioDirectionsClient() {
  return (
    <>
      <StudioLocationPanel />
      <StudioDirectionsLinks />
    </>
  );
}
