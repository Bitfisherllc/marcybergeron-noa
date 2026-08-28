/**
 * One-time fixes for critical site issues (hero placeholder, test artworks, admin paths).
 *
 * Usage: npx dotenv-cli -e .env.local -- tsx scripts/fix-critical-issues.ts
 */
import fs from "node:fs/promises";
import path from "node:path";
import { eq, ilike, or, inArray } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { artwork, homeSection } from "@/db/schema";

const UPLOADS = path.join(process.cwd(), "public", "uploads");
const ENCAUSTIC_DIR = "encaustic-paintings-on-panel";
const ADMIN_DIR = "admin";

async function fixHeroSection() {
  const db = getDb();
  const t = new Date();
  await db
    .update(homeSection)
    .set({
      eyebrow: "Abstract paintings",
      body: "Marcy Bergeron-Noa works in layers—color, mark, and silence—searching for direction, solace, and connection. This portfolio is organized as a set of doorways: each series is a room with its own light.",
      updatedAt: t,
    })
    .where(eq(homeSection.section, "hero"));
  console.log("✓ Fixed hero section eyebrow and body copy");
}

async function deleteTestArtworks() {
  const db = getDb();
  const rows = await db
    .select({ id: artwork.id, title: artwork.title })
    .from(artwork)
    .where(or(ilike(artwork.title, "test"), eq(artwork.title, "test")));

  if (rows.length === 0) {
    console.log("✓ No test artworks found");
    return;
  }

  const ids = rows.map((r) => r.id);
  await db.delete(artwork).where(inArray(artwork.id, ids));
  console.log(`✓ Deleted ${rows.length} test artwork(s): ${rows.map((r) => r.title).join(", ")}`);
}

async function fixAdminImagePaths() {
  const db = getDb();
  const rows = await db
    .select({ id: artwork.id, title: artwork.title, image: artwork.image })
    .from(artwork)
    .where(ilike(artwork.image, "%/uploads/admin/%"));

  if (rows.length === 0) {
    console.log("✓ No artworks pointing at /uploads/admin/");
    return;
  }

  const t = new Date();
  for (const row of rows) {
    const filename = path.basename(row.image.replace(/^\//, "").replace(/^uploads\/admin\//, ""));
    const newPath = `/uploads/${ENCAUSTIC_DIR}/${filename}`;
    const absTarget = path.join(UPLOADS, ENCAUSTIC_DIR, filename);
    try {
      await fs.access(absTarget);
      await db.update(artwork).set({ image: newPath, updatedAt: t }).where(eq(artwork.id, row.id));
      console.log(`✓ Updated path: ${row.title} → ${newPath}`);
    } catch {
      console.warn(`⚠ Skipped ${row.title}: ${filename} not found in ${ENCAUSTIC_DIR}/`);
    }
  }
}

async function cleanupAdminUploadFolder() {
  const adminPath = path.join(UPLOADS, ADMIN_DIR);
  const encausticPath = path.join(UPLOADS, ENCAUSTIC_DIR);
  let adminFiles: string[];
  let encausticFiles: Set<string>;
  try {
    adminFiles = await fs.readdir(adminPath);
    encausticFiles = new Set(await fs.readdir(encausticPath));
  } catch {
    console.log("✓ Admin upload folder cleanup skipped (folder missing)");
    return;
  }

  let removed = 0;
  for (const name of adminFiles) {
    if (name.startsWith(".")) continue;
    const isDuplicate = encausticFiles.has(name);
    const isTestUpload = name === "OJWjG9NDz493KITctZd9J.jpg";
    if (isDuplicate || isTestUpload) {
      await fs.unlink(path.join(adminPath, name));
      removed++;
    }
  }
  console.log(`✓ Removed ${removed} duplicate/orphan file(s) from public/uploads/admin/`);
}

async function main() {
  await fixHeroSection();
  await deleteTestArtworks();
  await fixAdminImagePaths();
  await cleanupAdminUploadFolder();
}

main()
  .then(() => closeDb())
  .catch((e) => {
    console.error(e);
    closeDb().finally(() => process.exit(1));
  });
