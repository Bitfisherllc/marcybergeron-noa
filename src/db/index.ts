import { createClient, type Client as LibsqlClient } from "@libsql/client";
import Database from "better-sqlite3";
import { drizzle as drizzleBetter } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

/** Single Drizzle surface for app code (libSQL + better-sqlite3 share the same query API). */
export type AppDb = BetterSQLite3Database<typeof schema>;

function tursoConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL?.trim() && process.env.TURSO_AUTH_TOKEN?.trim());
}

let betterSqlite: Database.Database | null = null;
let libsqlClient: LibsqlClient | null = null;
let _db: AppDb | null = null;

/** Local file SQLite only. Not available when `TURSO_*` is set (production remote DB). */
export function getSqlite(): Database.Database {
  if (tursoConfigured()) {
    throw new Error(
      "getSqlite() is only for the local file database. Unset TURSO_DATABASE_URL / TURSO_AUTH_TOKEN to run the seed script against ./data/site.db, or use Turso’s import/backup tools for production data.",
    );
  }
  if (!betterSqlite) {
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const dbPath = path.join(dir, "site.db");
    betterSqlite = new Database(dbPath);
    betterSqlite.pragma("journal_mode = WAL");
  }
  return betterSqlite;
}

/** Drizzle instance: Turso (libSQL) when env is set, otherwise local better-sqlite3. */
export function getDb(): AppDb {
  if (_db) return _db;
  if (tursoConfigured()) {
    libsqlClient = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    _db = drizzleLibsql(libsqlClient, { schema }) as unknown as AppDb;
  } else {
    _db = drizzleBetter(getSqlite(), { schema });
  }
  return _db;
}

export type Series = typeof schema.series.$inferSelect;
export type Artwork = typeof schema.artwork.$inferSelect;
export type Post = typeof schema.post.$inferSelect;
export type MailingListSignup = typeof schema.mailingListSignup.$inferSelect;
