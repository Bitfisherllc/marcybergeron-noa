import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { series } from "@/db/schema";
import { closeDb, getDb } from "@/db";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import { OIL_COLD_WAX_CHILDREN } from "@/lib/oilColdWaxSeries";

/** Create or sync Oil and Cold Wax child series rows. Safe to run multiple times. */
async function main() {
  const db = getDb();
  const t = new Date();
  let created = 0;

  for (const child of OIL_COLD_WAX_CHILDREN) {
    const existing = await db
      .select({ id: series.id, title: series.title, sortOrder: series.sortOrder })
      .from(series)
      .where(eq(series.slug, child.slug))
      .then((r) => r[0]);

    if (existing) {
      const updates: { title?: string; sortOrder?: number; isPrivate?: boolean; updatedAt: Date } = {
        updatedAt: t,
        isPrivate: false,
      };
      if (existing.title !== child.title) updates.title = child.title;
      if (existing.sortOrder !== child.sortOrder) updates.sortOrder = child.sortOrder;
      if (updates.title !== undefined || updates.sortOrder !== undefined) {
        await db.update(series).set(updates).where(eq(series.id, existing.id));
        console.log(`Updated series: ${child.title}`);
      }
      continue;
    }

    await db.insert(series).values({
      id: nanoid(),
      slug: child.slug,
      title: child.title,
      excerpt: `Works from ${child.title}.`,
      content: "",
      featuredImage: GALLERY_PLACEHOLDER_IMAGE,
      sortOrder: child.sortOrder,
      isPrivate: false,
      accessToken: null,
      createdAt: t,
      updatedAt: t,
    });
    console.log(`Created series: ${child.title}`);
    created++;
  }

  console.log(created ? `Done. Created ${created} series row(s).` : "All Oil and Cold Wax series already exist.");
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});
