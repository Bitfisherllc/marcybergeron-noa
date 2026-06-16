/**
 * Resolve Postgres URL for app, drizzle-kit, and prebuild.
 * Prefer `DATABASE_PUBLIC_URL` (Railway public TCP proxy) over `DATABASE_URL`.
 */
export function resolveDatabaseUrl(): string | undefined {
  const raw = (process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL)?.trim();
  return raw || undefined;
}

export function isLocalPostgresHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function isRailwayInternalUrl(url: string): boolean {
  try {
    const normalized = url.replace(/^postgres:/, "http:").replace(/^postgresql:/, "http:");
    const u = new URL(normalized);
    return u.hostname.endsWith(".railway.internal");
  } catch {
    return url.includes("railway.internal");
  }
}

/** Remote managed Postgres (Railway, etc.) needs TLS from Vercel and local dev. */
export function withSslQueryParam(url: string): string {
  try {
    const normalized = url.replace(/^postgres:/, "http:").replace(/^postgresql:/, "http:");
    const u = new URL(normalized);
    if (isLocalPostgresHost(u.hostname)) return url;
    if (u.searchParams.has("sslmode")) return url;
    return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
  } catch {
    return url;
  }
}

export function assertReachableDatabaseUrl(url: string, context: "vercel" | "local"): void {
  if (!isRailwayInternalUrl(url)) return;
  const where = context === "vercel" ? "Vercel builds" : "your Mac";
  throw new Error(
    `[database] DATABASE_URL uses postgres.railway.internal, which only works inside Railway — not from ${where}.\n` +
      "In Railway: open Postgres → Connect → enable Public Network → copy the public URL (host like *.proxy.rlwy.net).\n" +
      "Set that as DATABASE_URL on Vercel and in .env.local (or set DATABASE_PUBLIC_URL).",
  );
}
