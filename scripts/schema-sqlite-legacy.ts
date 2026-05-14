/**
 * SQLite schema copy — **only** for `migrate-sqlite-to-postgres.ts`.
 * The app uses `src/db/schema.ts` (PostgreSQL).
 */
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const series = sqliteTable("series", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull().default(""),
  featuredImage: text("featured_image").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const artwork = sqliteTable("artwork", {
  id: text("id").primaryKey(),
  seriesId: text("series_id").notNull(),
  title: text("title").notNull(),
  medium: text("medium").notNull().default(""),
  size: text("size").notNull().default(""),
  year: text("year").notNull().default(""),
  description: text("description").notNull().default(""),
  image: text("image").notNull(),
  alt: text("alt").notNull(),
  status: text("status").notNull().default("unknown"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const post = sqliteTable("post", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  category: text("category").notNull().default("News"),
  tags: text("tags").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const contactMessage = sqliteTable("contact_message", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const mailingListSignup = sqliteTable("mailing_list_signup", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const homeSection = sqliteTable("home_section", {
  section: text("section").primaryKey(),
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull().default(""),
  quote: text("quote").notNull().default(""),
  body: text("body").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const homeSlideshow = sqliteTable("home_slideshow", {
  id: text("id").primaryKey(),
  sortOrder: integer("sort_order").notNull().default(0),
  image: text("image").notNull(),
  alt: text("alt").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const homeFeaturedSeriesSlot = sqliteTable("home_featured_series_slot", {
  slot: integer("slot").primaryKey(),
  seriesId: text("series_id"),
});

export const homeFeaturedPostSlot = sqliteTable("home_featured_post_slot", {
  slot: integer("slot").primaryKey(),
  postId: text("post_id"),
});

export const homeSelectedArtworkSlot = sqliteTable("home_selected_artwork_slot", {
  slot: integer("slot").primaryKey(),
  artworkId: text("artwork_id"),
});
