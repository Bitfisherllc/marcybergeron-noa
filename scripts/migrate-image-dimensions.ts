/**
 * Adds image_width / image_height to artwork and backfills from local files.
 * Run: npm run db:ensure-image-dimensions
 */
import { eq, isNull, or } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { artwork } from "@/db/schema";
import { measureImageSrc, normalizeDimensions } from "@/lib/imageDimensions";
import { sql } from "drizzle-orm";

export async function ensureArtworkImageDimensionColumns(): Promise<void> {
  const db = getDb();
  await db.execute(sql`ALTER TABLE artwork ADD COLUMN IF NOT EXISTS image_width integer;`);
  await db.execute(sql`ALTER TABLE artwork ADD COLUMN IF NOT EXISTS image_height integer;`);
}

export async function backfillArtworkImageDimensions(opts?: { dryRun?: boolean }): Promise<{ updated: number; skipped: number }> {
  const db = getDb();
  const rows = await db
    .select({
      id: artwork.id,
      title: artwork.title,
      image: artwork.image,
      imageWidth: artwork.imageWidth,
      imageHeight: artwork.imageHeight,
    })
    .from(artwork)
    .where(or(isNull(artwork.imageWidth), isNull(artwork.imageHeight)));

  let updated = 0;
  let skipped = 0;
  const t = new Date();

  for (const row of rows) {
    const dim = normalizeDimensions(await measureImageSrc(row.image));
    if (!dim) {
      skipped++;
      continue;
    }
    if (!opts?.dryRun) {
      await db
        .update(artwork)
        .set({ imageWidth: dim.width, imageHeight: dim.height, updatedAt: t })
        .where(eq(artwork.id, row.id));
    }
    console.log(`${opts?.dryRun ? "[dry run] " : ""}${row.title}: ${dim.width}×${dim.height}`);
    updated++;
  }

  return { updated, skipped };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const columnsOnly = process.argv.includes("--columns-only");
  await ensureArtworkImageDimensionColumns();
  console.log("Artwork image dimension columns ready.");
  if (columnsOnly) {
    await closeDb();
    return;
  }
  const { updated, skipped } = await backfillArtworkImageDimensions({ dryRun });
  console.log(`Backfill complete: ${updated} updated, ${skipped} skipped (no local dimensions).`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
