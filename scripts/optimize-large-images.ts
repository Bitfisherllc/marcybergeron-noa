/**
 * Resize oversized images under public/uploads/ in place (macOS sips).
 *
 * Usage:
 *   npm run optimize:images
 *   npm run optimize:images -- --dry-run
 *   npm run optimize:images -- --min-kb 800 --max-px 2400
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const minKbIdx = args.indexOf("--min-kb");
  const maxPxIdx = args.indexOf("--max-px");
  const minKb = minKbIdx >= 0 ? Number(args[minKbIdx + 1]) : 900;
  const maxPx = maxPxIdx >= 0 ? Number(args[maxPxIdx + 1]) : 2400;
  return { dryRun, minKb: Number.isFinite(minKb) ? minKb : 900, maxPx: Number.isFinite(maxPx) ? maxPx : 2400 };
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(abs, out);
    else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) out.push(abs);
  }
  return out;
}

async function main() {
  const { dryRun, minKb, maxPx } = parseArgs();
  const uploads = path.join(process.cwd(), "public", "uploads");
  const files = await walk(uploads);
  let optimized = 0;

  for (const abs of files) {
    const stat = await fs.stat(abs);
    if (stat.size < minKb * 1024) continue;

    const rel = path.relative(process.cwd(), abs);
    if (dryRun) {
      console.log(`[dry run] would optimize ${rel} (${Math.round(stat.size / 1024)} KB)`);
      optimized++;
      continue;
    }

    await execFileAsync("/usr/bin/sips", ["-Z", String(maxPx), abs], { env: process.env });
    const after = await fs.stat(abs);
    console.log(`Optimized ${rel}: ${Math.round(stat.size / 1024)} KB → ${Math.round(after.size / 1024)} KB`);
    optimized++;
  }

  console.log(`Done. ${optimized} file(s) ${dryRun ? "would be" : ""} optimized.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
