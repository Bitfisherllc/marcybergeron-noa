import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { series } from "@/db/schema";
import { closeDb, getDb } from "@/db";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import { MEDIUM_GALLERY_SLUGS } from "@/lib/mediumGalleries";

const MEDIUM_COPY: Partial<
  Record<(typeof MEDIUM_GALLERY_SLUGS)[number], { title: string; excerpt: string; content: string; featuredImage: string }>
> = {
  "3 Dimensional Works": {
    title: "3 Dimensional Works",
    excerpt:
      "Relief and dimensional pieces where encaustic and oil lift away from the plane—objects that hold shadow, edge, and weight.",
    content:
      "Three-dimensional works where material builds into form—oil and encaustic mounted on board, shaped to catch light and cast quiet shadow.",
    featuredImage: "/uploads/3-dimensional-works/featured.jpg",
  },
};

/** Create any missing Medium nav gallery rows (`series` table). Safe to run multiple times. */
async function main() {
  const db = getDb();
  const t = new Date();
  let created = 0;

  for (let i = 0; i < MEDIUM_GALLERY_SLUGS.length; i++) {
    const slug = MEDIUM_GALLERY_SLUGS[i]!;
    const existing = await db.select({ id: series.id }).from(series).where(eq(series.slug, slug)).then((r) => r[0]);
    if (existing) continue;

    const copy = MEDIUM_COPY[slug];
    await db.insert(series).values({
      id: nanoid(),
      slug,
      title: copy?.title ?? slug,
      excerpt: copy?.excerpt ?? `Works in ${copy?.title ?? slug}.`,
      content: copy?.content ?? "",
      featuredImage: copy?.featuredImage ?? GALLERY_PLACEHOLDER_IMAGE,
      sortOrder: i,
      createdAt: t,
      updatedAt: t,
    });
    console.log(`Created medium gallery: ${copy?.title ?? slug}`);
    created++;
  }

  console.log(created ? `Done. Created ${created} medium gallery row(s).` : "All medium galleries already exist.");
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});
