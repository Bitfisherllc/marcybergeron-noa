import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

/** Slug-shaped folder under uploads/ (e.g. standing-tall-as-trees). Fallback: admin. */
export function uploadFolderForSlug(slug: string | undefined): string {
  if ((slug ?? "").trim().toLowerCase() === "home-slideshow") return "home-slideshow";
  const s = (slug ?? "").trim().toLowerCase();
  if (s && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return s;
  return "admin";
}

/**
 * Save an admin upload. Local dev writes to `public/uploads/`.
 * On Vercel, uses Blob storage — OIDC auth is automatic when a store is connected to the project.
 */
export async function saveUpload(file: File | null, seriesSlug?: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = path.extname(file.name) || ".jpg";
  const safe = `${nanoid()}${ext}`;
  const sub = uploadFolderForSlug(seriesSlug);
  const blobPath = `uploads/${sub}/${safe}`;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const onVercel = Boolean(process.env.VERCEL);
  const canUseBlob = onVercel || Boolean(blobToken);

  if (canUseBlob) {
    try {
      const blob = await put(blobPath, file, {
        access: "public",
        ...(blobToken ? { token: blobToken } : {}),
      });
      return blob.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (onVercel) {
        if (/private store/i.test(msg)) {
          throw new Error(
            "Your Vercel Blob store is Private, but site images must be Public. " +
              "Create a new Blob store with Public access, connect it to marcybergeron-noa, then redeploy. " +
              "(Private stores cannot serve images on the public website.)",
          );
        }
        throw new Error(
          "Blob upload failed. Connect a Public Blob store to this project in Vercel → Storage, then redeploy. " +
            msg,
        );
      }
      throw e;
    }
  }

  const rel = `/${blobPath}`;
  const abs = path.join(process.cwd(), "public", blobPath);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return rel;
}
