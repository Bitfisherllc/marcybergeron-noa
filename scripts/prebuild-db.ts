/**
 * Runs before `next build`. If `DATABASE_URL` is set (e.g. Vercel + Railway Postgres),
 * applies schema with `drizzle-kit push --force` so the app does not hit missing tables.
 * If unset, skips (local builds without Postgres must set DATABASE_URL for production-like builds).
 */
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim();

function main() {
  if (!url) {
    console.log("[prebuild] Skipping drizzle-kit push (DATABASE_URL not set).");
    return;
  }
  execSync("npx drizzle-kit push --force", {
    stdio: "inherit",
    env: { ...process.env, CI: "true" },
  });
  console.log("[prebuild] Postgres schema push OK.");
}

try {
  main();
} catch (e) {
  console.error("[prebuild] drizzle-kit push failed:", e);
  process.exit(1);
}
