/**
 * One-time DDL for home CMS tables (for environments where `drizzle-kit push` is non-interactive).
 * Safe to run multiple times (IF NOT EXISTS).
 *
 * Run: npx tsx scripts/ensure-home-tables.ts
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "site.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

const stmts = [
  `CREATE TABLE IF NOT EXISTS "home_section" (
    "section" text PRIMARY KEY NOT NULL,
    "eyebrow" text DEFAULT '' NOT NULL,
    "title" text DEFAULT '' NOT NULL,
    "quote" text DEFAULT '' NOT NULL,
    "body" text DEFAULT '' NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "home_slideshow" (
    "id" text PRIMARY KEY NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "image" text NOT NULL,
    "alt" text NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "home_featured_series_slot" (
    "slot" integer PRIMARY KEY NOT NULL,
    "series_id" text REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "home_featured_post_slot" (
    "slot" integer PRIMARY KEY NOT NULL,
    "post_id" text REFERENCES "post"("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "home_selected_artwork_slot" (
    "slot" integer PRIMARY KEY NOT NULL,
    "artwork_id" text REFERENCES "artwork"("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
];

for (const sql of stmts) {
  db.exec(sql);
}
db.close();
console.log("Home CMS tables ensured at", dbPath);
