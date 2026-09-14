import { eq } from "drizzle-orm";
import { postIndexCopy } from "@/db/schema";
import { getDb } from "@/db";
import { postIndexHeaderDefaults, type PostIndexHeader, type PostKind } from "@/lib/postKind";

export async function getResolvedPostIndexCopy(kind: PostKind): Promise<PostIndexHeader> {
  const defaults = postIndexHeaderDefaults(kind);
  const rows = await getDb().select().from(postIndexCopy).where(eq(postIndexCopy.kind, kind));
  const row = rows[0];
  if (!row) return defaults;
  return {
    eyebrow: row.eyebrow.trim() || defaults.eyebrow,
    heading: row.title.trim() || defaults.heading,
    intro: row.intro,
  };
}
