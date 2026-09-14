import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { series } from "@/db/schema";
import { closeDb, getDb } from "@/db";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import { isPlaceholderGalleryStatement } from "@/lib/galleryCopy";
import { MEDIUM_GALLERY_ABOUT } from "@/lib/mediumGalleryCopy";
import {
  LEGACY_MEDIUM_GALLERY_SLUG_REDIRECTS,
  MEDIUM_GALLERY_SLUGS,
  type MediumGallerySlug,
} from "@/lib/mediumGalleries";

/** Create any missing portfolio gallery rows and sync slug/title/order/About copy. Safe to run multiple times. */
async function main() {
  const db = getDb();
  const t = new Date();
  let created = 0;

  for (const [legacy, next] of Object.entries(LEGACY_MEDIUM_GALLERY_SLUG_REDIRECTS)) {
    const row = await db.select({ id: series.id }).from(series).where(eq(series.slug, legacy)).then((r) => r[0]);
    if (!row) continue;
    const targetTaken = await db
      .select({ id: series.id })
      .from(series)
      .where(eq(series.slug, next))
      .then((r) => r[0]);
    if (targetTaken && targetTaken.id !== row.id) {
      console.warn(`Skip rename ${legacy} → ${next}: another row already uses that slug`);
      continue;
    }
    await db.update(series).set({ slug: next, title: next, updatedAt: t }).where(eq(series.id, row.id));
    console.log(`Renamed gallery slug: ${legacy} → ${next}`);
  }

  for (let i = 0; i < MEDIUM_GALLERY_SLUGS.length; i++) {
    const slug = MEDIUM_GALLERY_SLUGS[i]!;
    const about = MEDIUM_GALLERY_ABOUT[slug as MediumGallerySlug];
    const existing = await db
      .select({
        id: series.id,
        title: series.title,
        sortOrder: series.sortOrder,
        content: series.content,
      })
      .from(series)
      .where(eq(series.slug, slug))
      .then((r) => r[0]);
    if (existing) {
      const updates: { title?: string; sortOrder?: number; content?: string; updatedAt: Date } = { updatedAt: t };
      if (existing.title !== slug) updates.title = slug;
      if (existing.sortOrder !== i) updates.sortOrder = i;
      if (about && isPlaceholderGalleryStatement(existing.content)) updates.content = about;
      if (updates.title !== undefined || updates.sortOrder !== undefined || updates.content !== undefined) {
        await db.update(series).set(updates).where(eq(series.id, existing.id));
        if (updates.title) console.log(`Updated gallery title: ${existing.title} → ${slug}`);
        if (updates.sortOrder !== undefined) console.log(`Updated sort order for ${slug}: ${existing.sortOrder} → ${i}`);
        if (updates.content) console.log(`Seeded About copy for ${slug}`);
      }
      continue;
    }

    await db.insert(series).values({
      id: nanoid(),
      slug,
      title: slug,
      excerpt: `Works in ${slug}.`,
      content: about ?? "",
      featuredImage: GALLERY_PLACEHOLDER_IMAGE,
      sortOrder: i,
      createdAt: t,
      updatedAt: t,
    });
    console.log(`Created portfolio gallery: ${slug}`);
    created++;
  }

  console.log(created ? `Done. Created ${created} gallery row(s).` : "All portfolio galleries already exist.");
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});
