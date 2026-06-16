import { eq } from "drizzle-orm";
import { aboutPortrait, aboutSection } from "@/db/schema";
import { getDb } from "@/db";
import {
  ABOUT_PORTRAIT_DEFAULT,
  ABOUT_SECTION_DEFAULTS,
  ABOUT_SECTION_KEYS,
  type AboutSectionKey,
} from "@/lib/aboutDefaults";

export type AboutSectionResolved = {
  eyebrow: string;
  title: string;
  body: string;
};

export type AboutPortraitResolved = {
  image: string;
  alt: string;
};

const PORTRAIT_ID = "default";

export async function getResolvedAboutSection(key: AboutSectionKey): Promise<AboutSectionResolved> {
  const def = ABOUT_SECTION_DEFAULTS[key];
  const rows = await getDb().select().from(aboutSection).where(eq(aboutSection.section, key));
  const row = rows[0];
  if (!row) return { ...def };
  return {
    eyebrow: row.eyebrow,
    title: row.title,
    body: row.body,
  };
}

export async function getResolvedAboutPortrait(): Promise<AboutPortraitResolved> {
  const rows = await getDb().select().from(aboutPortrait).where(eq(aboutPortrait.id, PORTRAIT_ID));
  const row = rows[0];
  if (!row) return { ...ABOUT_PORTRAIT_DEFAULT };
  return { image: row.image, alt: row.alt };
}

export async function listAboutSectionsForAdmin(): Promise<Record<AboutSectionKey, AboutSectionResolved>> {
  const db = getDb();
  const rows = await db.select().from(aboutSection);
  const map = new Map(rows.map((r) => [r.section as AboutSectionKey, r]));
  const out = {} as Record<AboutSectionKey, AboutSectionResolved>;
  for (const key of ABOUT_SECTION_KEYS) {
    const row = map.get(key);
    const def = ABOUT_SECTION_DEFAULTS[key];
    out[key] = row ? { eyebrow: row.eyebrow, title: row.title, body: row.body } : { ...def };
  }
  return out;
}

export async function getAboutPortraitForAdmin(): Promise<AboutPortraitResolved> {
  return getResolvedAboutPortrait();
}
