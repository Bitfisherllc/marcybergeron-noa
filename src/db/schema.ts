import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const series = pgTable("series", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull().default(""),
  featuredImage: text("featured_image").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const artwork = pgTable("artwork", {
  id: text("id").primaryKey(),
  seriesId: text("series_id")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  medium: text("medium").notNull().default(""),
  size: text("size").notNull().default(""),
  year: text("year").notNull().default(""),
  description: text("description").notNull().default(""),
  image: text("image").notNull(),
  alt: text("alt").notNull(),
  status: text("status").notNull().default("unknown"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const post = pgTable("post", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
  category: text("category").notNull().default("News"),
  tags: text("tags").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const contactMessage = pgTable("contact_message", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

/** Public mailing-list signups; admin-only until an ESP (e.g. Mailchimp) is wired in. */
export const mailingListSignup = pgTable("mailing_list_signup", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

/** Eyebrow + title + body (markdown ok for body on artist_words). Quote used for artist pull line. */
export const homeSection = pgTable("home_section", {
  section: text("section").primaryKey(),
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull().default(""),
  quote: text("quote").notNull().default(""),
  body: text("body").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const homeSlideshow = pgTable("home_slideshow", {
  id: text("id").primaryKey(),
  sortOrder: integer("sort_order").notNull().default(0),
  image: text("image").notNull(),
  alt: text("alt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const homeFeaturedSeriesSlot = pgTable("home_featured_series_slot", {
  slot: integer("slot").primaryKey(),
  seriesId: text("series_id").references(() => series.id, { onDelete: "set null" }),
});

export const homeFeaturedPostSlot = pgTable("home_featured_post_slot", {
  slot: integer("slot").primaryKey(),
  postId: text("post_id").references(() => post.id, { onDelete: "set null" }),
});

export const homeSelectedArtworkSlot = pgTable("home_selected_artwork_slot", {
  slot: integer("slot").primaryKey(),
  artworkId: text("artwork_id").references(() => artwork.id, { onDelete: "set null" }),
});
