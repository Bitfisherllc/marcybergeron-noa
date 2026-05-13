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
    navigator.geolocation!.getCurrentPosition(resolve, reject, options);
  });
}

function geoErrorCode(err: GeolocationPositionError | unknown): number | null {
  if (err && typeof err === "object" && "code" in err && typeof (err as GeolocationPositionError).code === "number") {
    return (err as GeolocationPositionError).code;
  }
  return null;
}

export function StudioDirectionsClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "denied" | "error" | "unsupported" | "insecure">(
    "idle",
  );
  const [meters, setMeters] = useState<number | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const googleDest = useMemo(
    () => encodeURIComponent(STUDIO.mapsSearchQuery),
    [],
  );

  const directionsBase = useMemo(
    () => `https://www.google.com/maps/dir/?api=1&destination=${googleDest}`,
    [googleDest],
  );

  const directionsFromUser = useCallback(
    (lat: number, lng: number) =>
      `${directionsBase}&origin=${encodeURIComponent(`${lat},${lng}`)}`,
    [directionsBase],
  );

  const applyPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude } = pos.coords;
    const d = haversineMeters(latitude, longitude, STUDIO.latitude, STUDIO.longitude);
    setUserPos({ lat: latitude, lng: longitude });
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

    const tryLo = (): Promise<GeolocationPosition> =>
      getPosition({
        enableHighAccuracy: false,
        maximumAge: 120_000,
        timeout: 22_000,
      });

    const tryHi = (): Promise<GeolocationPosition> =>
      getPosition({
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 18_000,
      });

    try {
      const pos = await tryLo();
      applyPosition(pos);
      return;
    } catch (first) {
      const c1 = geoErrorCode(first);
      if (c1 === 1) {
        setStatus("denied");
        return;
      }
    }

    try {
      const pos = await tryHi();
      applyPosition(pos);
    } catch (second) {
      const c2 = geoErrorCode(second);
      if (c2 === 1) setStatus("denied");
      else setStatus("error");
    }
  };

  const appleMapsUrl = `https://maps.apple.com/?daddr=${STUDIO.latitude},${STUDIO.longitude}`;

  return (
    <div className="mt-12 space-y-8 border-t border-line pt-10">
      <div>
        <h2 className="font-serif text-2xl tracking-tight text-ink">Your location</h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          If you allow location access in your browser, we can show an approximate straight-line distance to the
          studio. Your coordinates are not stored or sent to our server—everything runs locally in this tab.
        </p>
        {status === "insecure" ? (
          <p className="mt-4 text-sm text-muted">
            Geolocation only works on a <strong className="font-medium text-ink">secure (HTTPS)</strong> page (or{" "}
            <strong className="font-medium text-ink">localhost</strong> for development). Open this site with HTTPS
            and try again.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void requestLocation()}
          disabled={status === "loading" || status === "insecure"}
          className="focus-ring mt-5 border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90 disabled:opacity-50"
        >
          {status === "loading" ? "Locating…" : "Use my location for distance"}
        </button>
        {status === "unsupported" ? (
          <p className="mt-4 text-sm text-muted">This browser does not support geolocation.</p>
        ) : null}
        {status === "denied" ? (
          <p className="mt-4 text-sm text-muted">
            Location was blocked or unavailable. Check the lock / site settings icon in your address bar and allow
            location for this site, then try again. You can still open directions below—choose your start point in
            Google or Apple Maps.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-4 text-sm text-muted">
            Location could not be read in time (common on Wi‑Fi indoors). Try again near a window, disable VPN if
            one is on, or open directions below and set your start point in the maps app.
          </p>
        ) : null}
        {status === "ok" && meters !== null ? (
          <p className="mt-4 text-sm leading-relaxed text-ink">
            About <strong>{formatDistance(meters).miles} mi</strong> ({formatDistance(meters).km} km) straight-line
            from you to the studio pin.
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="font-serif text-2xl tracking-tight text-ink">Get directions</h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Opens your maps app or the web with driving, walking, or transit options.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <a
            href={userPos ? directionsFromUser(userPos.lat, userPos.lng) : directionsBase}
            className="focus-ring inline-flex border border-ink px-5 py-3 text-xs tracking-[0.18em] uppercase hover:bg-black/[0.03]"
            rel="noreferrer"
            target="_blank"
          >
            Google Maps{userPos ? " (from you)" : ""}
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
