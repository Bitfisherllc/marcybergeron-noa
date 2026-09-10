/**
 * Ensures `post_category` exists and seeds starter categories.
 * Safe to run multiple times.
 * Run: npm run db:ensure-post-categories
 */
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { closeDb, getDb } from "@/db";
import { post, postCategory } from "@/db/schema";
import { STARTER_POST_CATEGORIES, slugifyPostCategory } from "@/lib/postCategories";

export async function ensurePostCategoryTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "post_category" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamptz NOT NULL
    )
  `);

  const t = new Date();
  const existing = await db.select().from(postCategory);
  const bySlug = new Map(existing.map((row) => [row.slug, row]));
  const byName = new Map(existing.map((row) => [row.name.trim().toLowerCase(), row]));

  for (let i = 0; i < STARTER_POST_CATEGORIES.length; i++) {
    const starter = STARTER_POST_CATEGORIES[i]!;
    if (bySlug.has(starter.slug) || byName.has(starter.name.toLowerCase())) continue;
    await db.insert(postCategory).values({
      id: nanoid(),
      name: starter.name,
      slug: starter.slug,
      sortOrder: i,
      createdAt: t,
    });
    bySlug.set(starter.slug, {
      id: "",
      name: starter.name,
      slug: starter.slug,
      sortOrder: i,
      createdAt: t,
    });
    byName.set(starter.name.toLowerCase(), {
      id: "",
      name: starter.name,
      slug: starter.slug,
      sortOrder: i,
      createdAt: t,
    });
  }

  await db.update(post).set({ category: "In The Studio" }).where(eq(post.category, "Studio"));

  const posts = await db.select({ category: post.category }).from(post);
  const usedNames = [...new Set(posts.map((row) => row.category.trim()).filter(Boolean))];
  let extraSort = 100;
  for (const name of usedNames) {
    if (byName.has(name.toLowerCase()) || bySlug.has(slugifyPostCategory(name))) continue;
    const slug = slugifyPostCategory(name);
    if (bySlug.has(slug)) continue;
    await db.insert(postCategory).values({
      id: nanoid(),
      name,
      slug,
      sortOrder: extraSort,
      createdAt: t,
    });
    extraSort += 1;
    bySlug.set(slug, { id: "", name, slug, sortOrder: extraSort, createdAt: t });
    byName.set(name.toLowerCase(), { id: "", name, slug, sortOrder: extraSort, createdAt: t });
  }
}

async function main() {
  await ensurePostCategoryTable();
  console.log("Post categories ready.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
