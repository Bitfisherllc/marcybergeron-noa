/**
 * Ensures `post_category` exists and seeds starter categories.
 * Safe to run multiple times.
 * Run: npm run db:ensure-post-categories
 */
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { closeDb, getDb } from "@/db";
import { post, postCategory } from "@/db/schema";
import { starterCategoriesForKind, slugifyPostCategory } from "@/lib/postCategories";
import { parsePostKind } from "@/lib/postKind";

export async function ensurePostCategoryTable(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "post_category" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "kind" text DEFAULT 'news' NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamptz NOT NULL
    )
  `);
  await db.execute(sql`
    ALTER TABLE post_category ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'news';
  `);

  const t = new Date();
  const existing = await db.select().from(postCategory);
  const bySlug = new Map(existing.map((row) => [row.slug, row]));
  const byKindName = new Map(existing.map((row) => [`${parsePostKind(row.kind)}:${row.name.trim().toLowerCase()}`, row]));

  for (const kind of ["news", "workshop"] as const) {
    const starters = starterCategoriesForKind(kind);
    for (let i = 0; i < starters.length; i++) {
      const starter = starters[i]!;
      const nameKey = `${kind}:${starter.name.toLowerCase()}`;
      if (bySlug.has(starter.slug) || byKindName.has(nameKey)) continue;
      await db.insert(postCategory).values({
        id: nanoid(),
        name: starter.name,
        slug: starter.slug,
        kind,
        sortOrder: i,
        createdAt: t,
      });
      bySlug.set(starter.slug, {
        id: "",
        name: starter.name,
        slug: starter.slug,
        kind,
        sortOrder: i,
        createdAt: t,
      });
      byKindName.set(nameKey, {
        id: "",
        name: starter.name,
        slug: starter.slug,
        kind,
        sortOrder: i,
        createdAt: t,
      });
    }
  }

  await db.update(post).set({ category: "In The Studio" }).where(eq(post.category, "Studio"));

  const posts = await db.select({ category: post.category, kind: post.kind }).from(post);
  const used = [...new Map(posts.map((row) => [`${parsePostKind(row.kind)}:${row.category.trim()}`, row])).values()];
  let extraSort = 100;
  for (const row of used) {
    const kind = parsePostKind(row.kind);
    const name = row.category.trim();
    if (!name) continue;
    const nameKey = `${kind}:${name.toLowerCase()}`;
    const slug = slugifyPostCategory(name);
    if (byKindName.has(nameKey) || bySlug.has(slug)) continue;
    await db.insert(postCategory).values({
      id: nanoid(),
      name,
      slug,
      kind,
      sortOrder: extraSort,
      createdAt: t,
    });
    extraSort += 1;
    bySlug.set(slug, { id: "", name, slug, kind, sortOrder: extraSort, createdAt: t });
    byKindName.set(nameKey, { id: "", name, slug, kind, sortOrder: extraSort, createdAt: t });
  }

  await db
    .update(post)
    .set({ kind: "workshop", category: "Upcoming" })
    .where(and(eq(post.kind, "news"), eq(post.category, "Workshops")));
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
