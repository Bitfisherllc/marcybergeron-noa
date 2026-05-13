/**
 * Runs before `next build`. If Turso env vars are set (e.g. on Vercel), ensures tables exist
 * so prerender does not hit "no such table: series". Idempotent (CREATE IF NOT EXISTS).
 * If TURSO_* unset, exits 0 (local builds using file SQLite only).
 */
import { applyTursoSchema } from "./turso-schema";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

async function main() {
  if (!url || !authToken) {
    console.log("[prebuild] Skipping Turso schema (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not both set).");
    return;
  }
  await applyTursoSchema(url, authToken);
  console.log("[prebuild] Turso schema OK.");
}

main().catch((e) => {
  console.error("[prebuild] Turso schema failed:", e);
  process.exit(1);
});
