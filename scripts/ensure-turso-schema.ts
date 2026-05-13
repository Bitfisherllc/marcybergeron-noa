/**
 * Creates all app tables on Turso (libSQL) when the remote DB is empty.
 *
 *   export TURSO_DATABASE_URL="libsql://..."
 *   export TURSO_AUTH_TOKEN="..."
 *   npm run db:ensure-turso
 *
 * Tables only — no data. For schema + rows, import local `data/site.db`:
 * https://docs.turso.tech/cli/db/import
 *
 * Vercel also runs this automatically before `next build` via `prebuild` when TURSO_* is set.
 */
import { applyTursoSchema } from "./turso-schema";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

async function main() {
  if (!url || !authToken) {
    console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, then run: npm run db:ensure-turso");
    process.exit(1);
  }
  await applyTursoSchema(url, authToken);
  console.log("Turso schema applied (tables + indexes).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
