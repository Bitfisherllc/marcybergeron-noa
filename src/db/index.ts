import postgres from "postgres";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { assertReachableDatabaseUrl, isLocalPostgresHost, resolveDatabaseUrl } from "./connection-url";
import * as schema from "./schema";

export type AppDb = PostgresJsDatabase<typeof schema>;

let _sql: ReturnType<typeof postgres> | null = null;
let _db: AppDb | null = null;

function postgresSsl(url: string): false | "require" {
  try {
    const normalized = url.replace(/^postgres:/, "http:").replace(/^postgresql:/, "http:");
    const u = new URL(normalized);
    if (isLocalPostgresHost(u.hostname)) return false;
  } catch {
    /* fall through */
  }
  return "require";
}

/** Drizzle instance: PostgreSQL (e.g. Railway) via `DATABASE_URL`. */
export function getDb(): AppDb {
  if (_db) return _db;
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (e.g. Railway Postgres public URL) or see docker-compose.yml for local Postgres.",
    );
  }
  assertReachableDatabaseUrl(url, process.env.VERCEL ? "vercel" : "local");
  /** Single connection per serverless invocation is typical for `postgres` on Vercel. */
  _sql = postgres(url, { max: 1, ssl: postgresSsl(url) });
  _db = drizzlePg(_sql, { schema });
  return _db;
}

/**
 * Local scripts only (e.g. migrate from SQLite). Closes the pooled connection.
 * Do not call from Next.js request handlers.
 */
export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end({ timeout: 5 });
    _sql = null;
    _db = null;
  }
}

export type Series = typeof schema.series.$inferSelect;
export type Artwork = typeof schema.artwork.$inferSelect;
export type Post = typeof schema.post.$inferSelect;
export type MailingListSignup = typeof schema.mailingListSignup.$inferSelect;
