"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { aboutPortrait, aboutSection } from "@/db/schema";
import { getDb } from "@/db";
import { ABOUT_SECTION_KEYS, type AboutSectionKey } from "@/lib/aboutDefaults";
import { readExistingImageField } from "@/lib/resolveAdminImage";
import { saveUpload } from "@/lib/save-upload";

const PORTRAIT_ID = "default";

function now() {
  return new Date();
}

export async function saveAboutSectionAction(formData: FormData) {
  const key = String(formData.get("section") ?? "");
  if (!ABOUT_SECTION_KEYS.includes(key as AboutSectionKey)) redirect("/admin/about?error=section");

  const eyebrow = String(formData.get("eyebrow") ?? "");
  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");
  const t = now();

  await getDb()
    .insert(aboutSection)
    .values({
      section: key,
      eyebrow,
      title,
      body,
      updatedAt: t,
    })
    .onConflictDoUpdate({
      target: aboutSection.section,
      set: { eyebrow, title, body, updatedAt: t },
    });

  revalidatePath("/about");
  redirect(`/admin/about?saved=${encodeURIComponent(key)}`);
}

export async function saveAboutPortraitAction(formData: FormData) {
  const db = getDb();
  const t = now();
  const portraitFile = formData.get("portrait") as File | null;
  const portraitAlt = String(formData.get("portrait_alt") ?? "").trim();
  const portraitExisting = readExistingImageField(formData, "portraitExisting");
  const portraitImage =
    (portraitFile && portraitFile.size > 0 ? await saveUpload(portraitFile, "about-portrait") : null) ||
    portraitExisting;

  if (portraitImage) {
    try {
      const rows = await db.select().from(aboutPortrait).where(eq(aboutPortrait.id, PORTRAIT_ID));
      const alt = portraitAlt || rows[0]?.alt || "Portrait of Marcy Bergeron-Noa";
      await db
        .insert(aboutPortrait)
        .values({ id: PORTRAIT_ID, image: portraitImage, alt, updatedAt: t })
        .onConflictDoUpdate({
          target: aboutPortrait.id,
          set: { image: portraitImage, alt, updatedAt: t },
        });
    } catch (e) {
      console.error("[saveAboutPortraitAction]", e);
      redirect(`/admin/about?error=${encodeURIComponent(e instanceof Error ? e.message : "upload")}`);
    }
  } else if (portraitAlt) {
    const rows = await db.select().from(aboutPortrait).where(eq(aboutPortrait.id, PORTRAIT_ID));
    if (rows[0]) {
      await db
        .update(aboutPortrait)
        .set({ alt: portraitAlt, updatedAt: t })
        .where(eq(aboutPortrait.id, PORTRAIT_ID));
    } else {
      redirect("/admin/about?error=portrait");
    }
  }

  revalidatePath("/about");
  redirect("/admin/about?saved=portrait");
}

/** @deprecated Use per-section save actions instead. */
export async function saveAboutAllAction(formData: FormData) {
  const db = getDb();
  const t = now();

  for (const key of ABOUT_SECTION_KEYS) {
    const eyebrow = String(formData.get(`${key}_eyebrow`) ?? "");
    const title = String(formData.get(`${key}_title`) ?? "");
    const body = String(formData.get(`${key}_body`) ?? "");
    await db
      .insert(aboutSection)
      .values({
        section: key,
        eyebrow,
        title,
        body,
        updatedAt: t,
      })
      .onConflictDoUpdate({
        target: aboutSection.section,
        set: { eyebrow, title, body, updatedAt: t },
      });
  }

  const portraitFile = formData.get("portrait") as File | null;
  const portraitAlt = String(formData.get("portrait_alt") ?? "").trim();
  if (portraitFile && portraitFile.size > 0) {
    try {
      const rel = await saveUpload(portraitFile, "about-portrait");
      if (!rel) redirect("/admin/about?error=portrait");

      const rows = await db.select().from(aboutPortrait).where(eq(aboutPortrait.id, PORTRAIT_ID));
      const alt = portraitAlt || rows[0]?.alt || "Portrait of Marcy Bergeron-Noa";
      await db
        .insert(aboutPortrait)
        .values({ id: PORTRAIT_ID, image: rel, alt, updatedAt: t })
        .onConflictDoUpdate({
          target: aboutPortrait.id,
          set: { image: rel, alt, updatedAt: t },
        });
    } catch (e) {
      console.error("[saveAboutAllAction portrait]", e);
      redirect(`/admin/about?error=${encodeURIComponent(e instanceof Error ? e.message : "upload")}`);
    }
  } else if (portraitAlt) {
    const rows = await db.select().from(aboutPortrait).where(eq(aboutPortrait.id, PORTRAIT_ID));
    if (rows[0]) {
      await db
        .update(aboutPortrait)
        .set({ alt: portraitAlt, updatedAt: t })
        .where(eq(aboutPortrait.id, PORTRAIT_ID));
    }
  }

  revalidatePath("/about");
  redirect("/admin/about?saved=1");
}
