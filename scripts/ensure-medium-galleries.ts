import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { series } from "@/db/schema";
import { closeDb, getDb } from "@/db";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import { MEDIUM_GALLERY_SLUGS, MEDIUM_GALLERY_TITLES, mediumGalleryTitle } from "@/lib/mediumGalleries";

const MEDIUM_COPY: Partial<
  Record<(typeof MEDIUM_GALLERY_SLUGS)[number], { title: string; excerpt: string; content: string; featuredImage: string }>
> = {};

/** Create any missing Medium nav gallery rows (`series` table). Safe to run multiple times. */
async function main() {
  const db = getDb();
  const t = new Date();
  let created = 0;

  for (let i = 0; i < MEDIUM_GALLERY_SLUGS.length; i++) {
    const slug = MEDIUM_GALLERY_SLUGS[i]!;
    const existing = await db.select({ id: series.id, title: series.title }).from(series).where(eq(series.slug, slug)).then((r) => r[0]);
    if (existing) {
      const desiredTitle = MEDIUM_GALLERY_TITLES[slug] ?? mediumGalleryTitle({ slug, title: slug });
      if (desiredTitle !== existing.title) {
        await db.update(series).set({ title: desiredTitle, updatedAt: t }).where(eq(series.id, existing.id));
        console.log(`Updated medium gallery title: ${existing.title} → ${desiredTitle}`);
      }
      continue;
    }

    const copy = MEDIUM_COPY[slug];
    const title = MEDIUM_GALLERY_TITLES[slug] ?? copy?.title ?? slug;
    await db.insert(series).values({
      id: nanoid(),
      slug,
      title,
      excerpt: copy?.excerpt ?? `Works in ${title}.`,
      content: copy?.content ?? "",
      featuredImage: copy?.featuredImage ?? GALLERY_PLACEHOLDER_IMAGE,
      sortOrder: i,
      createdAt: t,
      updatedAt: t,
    });
    console.log(`Created medium gallery: ${title}`);
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
