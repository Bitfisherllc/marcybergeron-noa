import { createClient } from "@libsql/client";

export const TURSO_SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "series" (
    "id" text PRIMARY KEY NOT NULL,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "excerpt" text NOT NULL,
    "content" text NOT NULL DEFAULT '',
    "featured_image" text NOT NULL,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "series_slug_unique" ON "series" ("slug")`,
  `CREATE TABLE IF NOT EXISTS "artwork" (
    "id" text PRIMARY KEY NOT NULL,
    "series_id" text NOT NULL REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    "title" text NOT NULL,
    "medium" text NOT NULL DEFAULT '',
    "size" text NOT NULL DEFAULT '',
    "year" text NOT NULL DEFAULT '',
    "description" text NOT NULL DEFAULT '',
    "image" text NOT NULL,
    "alt" text NOT NULL,
    "status" text NOT NULL DEFAULT 'unknown',
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "post" (
    "id" text PRIMARY KEY NOT NULL,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "excerpt" text NOT NULL,
    "content" text NOT NULL,
    "featured_image" text,
    "published" integer NOT NULL DEFAULT 0,
    "published_at" integer,
    "category" text NOT NULL DEFAULT 'News',
    "tags" text NOT NULL DEFAULT '',
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "post_slug_unique" ON "post" ("slug")`,
  `CREATE TABLE IF NOT EXISTS "contact_message" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "message" text NOT NULL,
    "created_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "mailing_list_signup" (
    "id" text PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "name" text NOT NULL DEFAULT '',
    "created_at" integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "mailing_list_signup_email_unique" ON "mailing_list_signup" ("email")`,
  `CREATE TABLE IF NOT EXISTS "home_section" (
    "section" text PRIMARY KEY NOT NULL,
    "eyebrow" text NOT NULL DEFAULT '',
    "title" text NOT NULL DEFAULT '',
    "quote" text NOT NULL DEFAULT '',
    "body" text NOT NULL DEFAULT '',
    "updated_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "home_slideshow" (
    "id" text PRIMARY KEY NOT NULL,
    "sort_order" integer NOT NULL DEFAULT 0,
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

export async function applyTursoSchema(url: string, authToken: string): Promise<void> {
  const client = createClient({ url, authToken });
  for (const sql of TURSO_SCHEMA_STATEMENTS) {
    await client.execute(sql);
  }
}
