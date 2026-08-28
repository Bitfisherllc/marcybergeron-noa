/**
 * Bulk-import paintings from a folder using filenames only — no CSV.
 *
 * Naming: `{order}-{title} {width}x{height}.{ext}`
 * Example: `1-Gut Feeling 24x18.webp`
 *
 * Usage:
 *   npm run import:gallery -- Encaustic
 *   npm run import:gallery -- Encaustic ./import/encaustic
 *   npm run import:gallery -- Encaustic ./import/encaustic --dry-run
 */
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { artwork } from "@/db/schema";
import { closeDb, getDb } from "@/db";
import { captionSubtitle } from "@/components/ArtCaption";
import { getSeriesBySlug } from "@/lib/queries";
import { uploadFolderForSlug } from "@/lib/save-upload";
import { parseGalleryImportFilename } from "./lib/parseGalleryImportFilename";

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif"]);

const GALLERY_DEFAULTS: Record<string, { folder: string; medium: string }> = {
  Encaustic: { folder: "encaustic", medium: "Encaustic on board" },
  "Oil and Cold Wax Medium": { folder: "oil-and-cold-wax-medium", medium: "Oil & cold wax on board" },
  "Works on Paper": { folder: "works-on-paper", medium: "Works on paper" },
  "Mixed Medium-Collage": { folder: "collage", medium: "Mixed medium & collage" },
  Sculpture: { folder: "sculpture", medium: "Sculpture" },
};

type ImportRow = {
  sourcePath: string;
  filename: string;
  sortOrder: number;
  title: string;
  size: string;
  extension: string;
};

function usage(): never {
  console.error(`Usage: npm run import:gallery -- <gallery-slug> [folder] [--dry-run] [--medium "Encaustic on board"]

Gallery slug examples: Encaustic, Sculpture, "Works on Paper"
Default folder: import/<gallery-folder>/

Filename format: {order}-{title} {width}x{height}.{ext}
Example: 1-Gut Feeling 24x18.webp`);
  process.exit(1);
}

async function copyImageToUploads(
  sourcePath: string,
  gallerySlug: string,
  filename: string,
): Promise<string> {
  const uploadSub = uploadFolderForSlug(gallerySlug);
  const destName = filename.replace(/[^\w.\-()+ ]/g, "-");
  const blobPath = `uploads/${uploadSub}/${destName}`;
  const buf = await fs.readFile(sourcePath);

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blobToken) {
    const blob = await put(blobPath, buf, { access: "public", token: blobToken });
    return blob.url;
  }

  const rel = `/${blobPath}`;
  const abs = path.join(process.cwd(), "public", blobPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return rel;
}

async function listImportRows(folder: string): Promise<{ rows: ImportRow[]; skipped: string[] }> {
  const absFolder = path.resolve(folder);
  let entries: string[];
  try {
    entries = await fs.readdir(absFolder);
  } catch {
    throw new Error(`Folder not found: ${absFolder}`);
  }

  const rows: ImportRow[] = [];
  const skipped: string[] = [];

  for (const name of entries) {
    if (name.startsWith(".")) continue;
    const ext = path.extname(name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) {
      skipped.push(`${name} (not an image)`);
      continue;
    }

    const parsed = parseGalleryImportFilename(name);
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

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Set DATABASE_URL in .env.local, then run again.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const mediumFlagIdx = args.indexOf("--medium");
  const mediumOverride = mediumFlagIdx >= 0 ? args[mediumFlagIdx + 1]?.trim() : undefined;
  const skipIdx = new Set<number>();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") skipIdx.add(i);
    if (args[i] === "--medium") {
      skipIdx.add(i);
      if (i + 1 < args.length) skipIdx.add(i + 1);
    }
  }
  const positional = args.filter((_, i) => !skipIdx.has(i));

  const gallerySlug = positional[0]?.trim();
  if (!gallerySlug) usage();

  const galleryDefaults = GALLERY_DEFAULTS[gallerySlug];
  const folder =
    positional[1]?.trim() ??
    path.join("import", galleryDefaults?.folder ?? gallerySlug.toLowerCase().replace(/\s+/g, "-"));
  const medium = mediumOverride || galleryDefaults?.medium || "";

  const gallery = await getSeriesBySlug(gallerySlug);
  if (!gallery) {
    console.error(`Gallery not found in database: ${gallerySlug}`);
    process.exit(1);
  }

  const { rows, skipped } = await listImportRows(folder);
  if (rows.length === 0) {
    console.error(`No importable images in ${path.resolve(folder)}`);
    if (skipped.length) {
      console.error("\nSkipped files:");
      for (const line of skipped) console.error(`  - ${line}`);
    }
    process.exit(1);
  }

  console.log(`Gallery: ${gallery.title} (${gallery.slug})`);
  console.log(`Folder:  ${path.resolve(folder)}`);
  console.log(`Medium:  ${medium || "(blank)"}`);
  console.log(`Found ${rows.length} painting(s)${dryRun ? " [dry run]" : ""}:\n`);

  for (const row of rows) {
    console.log(`  ${row.sortOrder}. ${row.title} — ${row.size}  (${row.filename})`);
  }

  if (skipped.length) {
    console.log("\nSkipped:");
    for (const line of skipped) console.log(`  - ${line}`);
  }

  if (dryRun) {
    console.log("\nDry run only — no files copied, no database changes.");
    await closeDb();
    return;
  }

  const db = getDb();
  const existing = await db
    .select({ id: artwork.id, title: artwork.title, sortOrder: artwork.sortOrder })
    .from(artwork)
    .where(eq(artwork.mediumSeriesId, gallery.id));

  const existingByTitle = new Map(existing.map((row) => [row.title.toLowerCase(), row]));
  const t = new Date();
  let imported = 0;
  let skippedExisting = 0;

  for (const row of rows) {
    if (existingByTitle.has(row.title.toLowerCase())) {
      console.log(`Skip (already in gallery): ${row.title}`);
      skippedExisting++;
      continue;
    }

    const image = await copyImageToUploads(row.sourcePath, gallery.slug, row.filename);
    const subtitle = captionSubtitle({ medium, size: row.size });
    const artworkId = nanoid();

    await db.insert(artwork).values({
      id: artworkId,
      seriesId: gallery.id,
      mediumSeriesId: gallery.id,
      title: row.title,
      medium,
      size: row.size,
      year: "",
      description: "",
      image,
      alt: `${row.title} — ${subtitle}`.trim(),
      status: "unknown",
      sortOrder: row.sortOrder,
      createdAt: t,
      updatedAt: t,
    });

    console.log(`Imported: ${row.title}`);
    imported++;
  }

  console.log(`\nDone. Imported ${imported}, skipped ${skippedExisting} existing.`);
  if (imported > 0 && !process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.log("Images saved under public/uploads/. Commit and push those files to deploy them.");
  }

  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb().catch(() => {});
  process.exit(1);
});
