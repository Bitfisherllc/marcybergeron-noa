/**
 * Bulk-import paintings from a folder using filenames only — no CSV.
 *
 * Usage:
 *   npm run import:gallery -- "Encaustic Monotypes"
 *   npm run import:gallery -- standing-tall-as-trees
 *   npm run import:gallery -- "Encaustic Paintings on Panel" --update-existing
 *   npm run import:gallery -- all
 */
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { artwork, artworkSeries } from "@/db/schema";
import { closeDb, getDb } from "@/db";
import { captionSubtitle } from "@/components/ArtCaption";
import { getSeriesBySlug } from "@/lib/queries";
import { measureImageBuffer } from "@/lib/imageDimensions";
import {
  isMediumGallerySlug,
  MEDIUM_GALLERY_IMPORT_FOLDERS,
  MEDIUM_GALLERY_SLUGS,
  mediumGalleryImportFolder,
  type MediumGallerySlug,
} from "@/lib/mediumGalleries";
import {
  isOilColdWaxChildSlug,
  OIL_COLD_WAX_CHILDREN,
  OIL_COLD_WAX_CHILD_SLUGS,
  OIL_COLD_WAX_PARENT_SLUG,
  oilColdWaxChildUploadFolder,
} from "@/lib/oilColdWaxSeries";
import { uploadFolderForSlug } from "@/lib/save-upload";
import { parseGalleryImportFilename, parsePhotoImportFilename } from "./lib/parseGalleryImportFilename";

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif"]);

const GALLERY_DEFAULTS: Record<string, { medium: string }> = {
  "Oil and Cold Wax": { medium: "Oil & cold wax on board" },
  "Encaustic Paintings on Panel": { medium: "Encaustic on panel" },
  "Encaustic Monotypes": { medium: "Encaustic on board" },
  "Wax Based Collage on Panel": { medium: "Wax based collage on panel" },
  Sculpture: { medium: "Sculpture" },
  "The Studio": { medium: "" },
};

for (const child of OIL_COLD_WAX_CHILDREN) {
  GALLERY_DEFAULTS[child.slug] = { medium: "Oil & cold wax on board" };
}

type ImportRow = {
  sourcePath: string;
  filename: string;
  sortOrder: number;
  title: string;
  size: string;
  extension: string;
};

type ImportTarget = {
  slug: string;
  galleryId: string;
  storageSeriesId: string;
  mediumSeriesId: string;
  uploadSlug: string;
  membershipSeriesId: string;
  folder: string;
  medium: string;
  allowPhotos: boolean;
  existingScope: "medium" | "series";
};

function usage(): never {
  console.error(`Usage: npm run import:gallery -- <gallery-slug|all> [folder] [--dry-run] [--update-existing] [--medium "..."]

Gallery slug examples: "Encaustic Monotypes", standing-tall-as-trees, all
Default folders:
${Object.entries(MEDIUM_GALLERY_IMPORT_FOLDERS)
  .map(([slug, folder]) => `  ${slug} → import/${folder}/`)
  .join("\n")}
${OIL_COLD_WAX_CHILDREN.map((c) => `  ${c.slug} → import/oil-and-cold-wax/${c.uploadFolder}/`).join("\n")}

Filename format: {order}-{title} {width}x{height}.{ext}
Example: 1-Gut Feeling 24x18.webp`);
  process.exit(1);
}

function defaultFolderForSlug(slug: string): string {
  if (isMediumGallerySlug(slug)) {
    return path.join("import", mediumGalleryImportFolder(slug as MediumGallerySlug));
  }
  if (isOilColdWaxChildSlug(slug)) {
    return path.join("import", "oil-and-cold-wax", oilColdWaxChildUploadFolder(slug)!);
  }
  return path.join("import", slug.toLowerCase().replace(/\s+/g, "-"));
}

async function resolveImportTarget(slug: string, folderOverride?: string): Promise<ImportTarget | null> {
  const mediumDefault = GALLERY_DEFAULTS[slug]?.medium ?? "Oil & cold wax on board";

  if (isOilColdWaxChildSlug(slug)) {
    const gallery = await getSeriesBySlug(slug);
    const parent = await getSeriesBySlug(OIL_COLD_WAX_PARENT_SLUG);
    if (!gallery || !parent) return null;
    return {
      slug,
      galleryId: gallery.id,
      storageSeriesId: gallery.id,
      mediumSeriesId: parent.id,
      uploadSlug: slug,
      membershipSeriesId: gallery.id,
      folder: folderOverride ?? defaultFolderForSlug(slug),
      medium: mediumDefault,
      allowPhotos: false,
      existingScope: "series",
    };
  }

  const gallery = await getSeriesBySlug(slug);
  if (!gallery) return null;
  return {
    slug,
    galleryId: gallery.id,
    storageSeriesId: gallery.id,
    mediumSeriesId: gallery.id,
    uploadSlug: gallery.slug,
    membershipSeriesId: gallery.id,
    folder: folderOverride ?? defaultFolderForSlug(slug),
    medium: GALLERY_DEFAULTS[slug]?.medium ?? "",
    allowPhotos: slug === "The Studio",
    existingScope: "medium",
  };
}

async function imagePathForImport(
  sourcePath: string,
  uploadSlug: string,
  filename: string,
): Promise<string> {
  const uploadSub = uploadFolderForSlug(uploadSlug);
  const destName = filename.replace(/[^\w.\-()+ ]/g, "-");
  const rel = `/uploads/${uploadSub}/${destName}`;
  const absDest = path.join(process.cwd(), "public", rel);
  const absSource = path.resolve(sourcePath);

  if (absSource === absDest) return rel;

  const sourceInUploads = absSource.includes(`${path.sep}public${path.sep}uploads${path.sep}${uploadSub}${path.sep}`);
  if (sourceInUploads) {
    return `/uploads/${uploadSub}/${path.basename(absSource)}`;
  }

  const buf = await fs.readFile(sourcePath);
  const blobPath = `uploads/${uploadSub}/${destName}`;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blobToken) {
    const blob = await put(blobPath, buf, { access: "public", token: blobToken });
    return blob.url;
  }

  await fs.mkdir(path.dirname(absDest), { recursive: true });
  await fs.writeFile(absDest, buf);
  return rel;
}

async function listImportRows(
  folder: string,
  options?: { allowPhotos?: boolean },
): Promise<{ rows: ImportRow[]; skipped: string[] }> {
  const absFolder = path.resolve(folder);
  let entries: string[];
  try {
    entries = await fs.readdir(absFolder);
  } catch {
    throw new Error(`Folder not found: ${absFolder}`);
  }

  const rows: ImportRow[] = [];
  const skipped: string[] = [];
  let photoIndex = 0;

  for (const name of entries) {
    if (name.startsWith(".")) continue;
    const ext = path.extname(name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) {
      if (!/readme/i.test(name)) skipped.push(`${name} (not an image)`);
      continue;
    }

    let parsed = parseGalleryImportFilename(name);
    if (!parsed && options?.allowPhotos) {
      parsed = parsePhotoImportFilename(name, photoIndex++);
    }
    if (!parsed) {
      skipped.push(`${name} (name must be like 1-Gut Feeling 24x18.webp)`);
      continue;
    }

    rows.push({
      sourcePath: path.join(absFolder, name),
      filename: name,
      sortOrder: parsed.sortOrder,
      title: parsed.title,
      size: parsed.size,
      extension: parsed.extension,
    });
  }

  rows.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  return { rows, skipped };
}

async function loadExisting(target: ImportTarget) {
  const db = getDb();
  if (target.existingScope === "series") {
    const rows = await db
      .select({ id: artwork.id, title: artwork.title, sortOrder: artwork.sortOrder, image: artwork.image })
      .from(artwork)
      .innerJoin(artworkSeries, eq(artworkSeries.artworkId, artwork.id))
      .where(eq(artworkSeries.seriesId, target.galleryId));
    return rows;
  }
  return db
    .select({ id: artwork.id, title: artwork.title, sortOrder: artwork.sortOrder, image: artwork.image })
    .from(artwork)
    .where(eq(artwork.mediumSeriesId, target.galleryId));
}

async function importGallery(
  slug: string,
  options: { dryRun: boolean; updateExisting: boolean; folderOverride?: string; mediumOverride?: string },
): Promise<{ imported: number; updated: number; skippedExisting: number; skipped: string[] }> {
  const target = await resolveImportTarget(slug, options.folderOverride);
  if (!target) {
    console.error(`Gallery not found in database: ${slug}`);
    return { imported: 0, updated: 0, skippedExisting: 0, skipped: [] };
  }

  const medium = options.mediumOverride || target.medium;
  const { rows, skipped } = await listImportRows(target.folder, { allowPhotos: target.allowPhotos });
  if (rows.length === 0) {
    console.error(`No importable images in ${path.resolve(target.folder)}`);
    if (skipped.length) {
      console.error("Skipped files:");
      for (const line of skipped) console.error(`  - ${line}`);
    }
    return { imported: 0, updated: 0, skippedExisting: 0, skipped };
  }

  console.log(`\n=== ${slug} ===`);
  console.log(`Folder:  ${path.resolve(target.folder)}`);
  console.log(`Medium:  ${medium || "(blank)"}`);
  console.log(`Found ${rows.length} painting(s)${options.dryRun ? " [dry run]" : ""}`);

  if (options.dryRun) return { imported: 0, updated: 0, skippedExisting: 0, skipped };

  const db = getDb();
  const existing = await loadExisting(target);
  const existingByTitle = new Map(existing.map((row) => [row.title.toLowerCase(), row]));
  const t = new Date();
  let imported = 0;
  let updated = 0;
  let skippedExisting = 0;

  for (const row of rows) {
    const prior = existingByTitle.get(row.title.toLowerCase());
    const image = await imagePathForImport(row.sourcePath, target.uploadSlug, row.filename);
    const fileBuf = await fs.readFile(row.sourcePath);
    const dim = measureImageBuffer(fileBuf);
    const subtitle = captionSubtitle({ medium, size: row.size });
    const alt = `${row.title} — ${subtitle}`.trim();

    if (prior) {
      if (options.updateExisting && prior.image !== image) {
        await db
          .update(artwork)
          .set({
            image,
            alt,
            medium,
            size: row.size,
            sortOrder: row.sortOrder,
            imageWidth: dim?.width ?? null,
            imageHeight: dim?.height ?? null,
            updatedAt: t,
          })
          .where(eq(artwork.id, prior.id));
        console.log(`Updated image: ${row.title}`);
        updated++;
      } else {
        console.log(`Skip (already in gallery): ${row.title}`);
        skippedExisting++;
      }
      continue;
    }

    const artworkId = nanoid();
    await db.insert(artwork).values({
      id: artworkId,
      seriesId: target.storageSeriesId,
      mediumSeriesId: target.mediumSeriesId,
      title: row.title,
      medium,
      size: row.size,
      year: "",
      description: "",
      image,
      alt,
      imageWidth: dim?.width ?? null,
      imageHeight: dim?.height ?? null,
      status: "unknown",
      sortOrder: row.sortOrder,
      createdAt: t,
      updatedAt: t,
    });

    if (isOilColdWaxChildSlug(slug)) {
      await db.insert(artworkSeries).values({ artworkId, seriesId: target.membershipSeriesId });
    }

    console.log(`Imported: ${row.title}`);
    imported++;
  }

  console.log(`Done ${slug}: imported ${imported}, updated ${updated}, skipped ${skippedExisting}.`);
  return { imported, updated, skippedExisting, skipped };
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Set DATABASE_URL in .env.local, then run again.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const updateExisting = args.includes("--update-existing");
  const mediumFlagIdx = args.indexOf("--medium");
  const mediumOverride = mediumFlagIdx >= 0 ? args[mediumFlagIdx + 1]?.trim() : undefined;
  const skipIdx = new Set<number>();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run" || args[i] === "--update-existing") skipIdx.add(i);
    if (args[i] === "--medium") {
      skipIdx.add(i);
      if (i + 1 < args.length) skipIdx.add(i + 1);
    }
  }
  const positional = args.filter((_, i) => !skipIdx.has(i));

  const gallerySlug = positional[0]?.trim();
  if (!gallerySlug) usage();

  const folderOverride = positional[1]?.trim();
  const slugs =
    gallerySlug === "all"
      ? [
          ...MEDIUM_GALLERY_SLUGS.filter((s) => s !== "Oil and Cold Wax"),
          ...OIL_COLD_WAX_CHILD_SLUGS,
        ]
      : [gallerySlug];

  let totalImported = 0;
  let totalUpdated = 0;

  for (const slug of slugs) {
    const result = await importGallery(slug, { dryRun, updateExisting, folderOverride, mediumOverride });
    totalImported += result.imported;
    totalUpdated += result.updated;
    if (gallerySlug !== "all" && result.imported === 0 && result.updated === 0 && result.skipped.length === 0) {
      process.exit(1);
    }
  }

  if (gallerySlug === "all") {
    console.log(`\nAll galleries complete. Imported ${totalImported}, updated ${totalUpdated}.`);
  }

  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb().catch(() => {});
  process.exit(1);
});
