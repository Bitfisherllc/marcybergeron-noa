import { defineConfig } from "drizzle-kit";

/** Match runtime `getDb()` — remote Postgres (Railway, Vercel build) needs TLS. */
function databaseUrlForDrizzle(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "postgresql://localhost:5432/placeholder";
  try {
    const normalized = raw.replace(/^postgres:/, "http:").replace(/^postgresql:/, "http:");
    const u = new URL(normalized);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return raw;
    if (u.searchParams.has("sslmode")) return raw;
    return `${raw}${raw.includes("?") ? "&" : "?"}sslmode=require`;
  } catch {
    return raw;
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrlForDrizzle() },
});
