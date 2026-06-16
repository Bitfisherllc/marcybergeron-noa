/**
 * Runs before `next build`. If `DATABASE_URL` is set (e.g. Vercel + Railway Postgres),
 * applies schema with `drizzle-kit push --force` so the app does not hit missing tables.
 * On Vercel, missing `DATABASE_URL` fails the build (otherwise push is skipped and `series` etc. are absent at runtime).
 * Local builds without Postgres: unset `DATABASE_URL` to skip push, or use docker-compose + `.env.local`.
 */
import { execSync } from "node:child_process";
import { assertReachableDatabaseUrl, resolveDatabaseUrl } from "../src/db/connection-url";

const url = resolveDatabaseUrl();

function main() {
  if (!url) {
    if (process.env.VERCEL) {
      console.error(
        "[prebuild] DATABASE_URL is not set on Vercel. Add it under Project → Settings → Environment Variables for Production (and Preview if you use it), then redeploy. Without it, drizzle-kit push is skipped and tables like `series` are missing at runtime.",
      );
      process.exit(1);
    }
    console.log("[prebuild] Skipping drizzle-kit push (DATABASE_URL not set).");
    return;
  }

  try {
    assertReachableDatabaseUrl(url, process.env.VERCEL ? "vercel" : "local");
  } catch (e) {
    console.error("[prebuild]", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  try {
    execSync("npx drizzle-kit push --force", {
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
    });
  } catch (e) {
    const hint =
      "Check Vercel → Environment Variables: DATABASE_URL must be Railway's **public** URL (*.proxy.rlwy.net), not postgres.railway.internal.";
    console.error("[prebuild] drizzle-kit push failed.", hint);
    if (e instanceof Error && "stderr" in e && typeof e.stderr === "string" && e.stderr.trim()) {
      console.error(e.stderr);
    }
    process.exit(1);
  }

  console.log("[prebuild] Postgres schema push OK.");
}

main();
