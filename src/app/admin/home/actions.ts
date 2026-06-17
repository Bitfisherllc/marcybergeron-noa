"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { saveUpload } from "@/lib/save-upload";
import {
  homeFeaturedPostSlot,
  homeFeaturedSeriesSlot,
  homeSection,
  homeSelectedArtworkSlot,
  homeSlideshow,
} from "@/db/schema";
import { getDb } from "@/db";
import { HOME_SECTION_KEYS, type HomeSectionKey } from "@/lib/homeDefaults";
import { heroSlideAlt } from "@/lib/heroSlides";
import { getArtwork } from "@/lib/queries";
import { captionSubtitle } from "@/components/ArtCaption";

function now() {
  return new Date();
}

function readSlotId(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v || null;
}

async function upsertHomeTextSection(db: ReturnType<typeof getDb>, key: HomeSectionKey, formData: FormData, t: Date) {
  const eyebrow = String(formData.get("eyebrow") ?? "");
  const title = String(formData.get("title") ?? "");
  const quote = String(formData.get("quote") ?? "");
  const body = String(formData.get("body") ?? "");
  await db
    .insert(homeSection)
    .values({
      section: key,
      eyebrow,
      title,
      quote,
      body,
      updatedAt: t,
    })
    .onConflictDoUpdate({
      target: homeSection.section,
      set: { eyebrow, title, quote, body, updatedAt: t },
    });
}

export async function saveHomeTextSectionAction(formData: FormData) {
  const key = String(formData.get("section") ?? "");
  if (!HOME_SECTION_KEYS.includes(key as HomeSectionKey)) redirect("/admin/home?error=section");

  const db = getDb();
  const t = now();
  await upsertHomeTextSection(db, key as HomeSectionKey, formData, t);
  revalidatePath("/");
  redirect(`/admin/home?saved=${encodeURIComponent(key)}`);
}

export async function saveHomeFeaturedSeriesAction(formData: FormData) {
  const db = getDb();
  for (let slot = 0; slot < 3; slot++) {
    const seriesId = readSlotId(formData, `series_slot_${slot}`);
    await db
      .insert(homeFeaturedSeriesSlot)
      .values({ slot, seriesId })
      .onConflictDoUpdate({
        target: homeFeaturedSeriesSlot.slot,
        set: { seriesId },
      });
  }
  revalidatePath("/");
  redirect("/admin/home?saved=featured_series_picks");
}

export async function saveHomeJournalAction(formData: FormData) {
  const db = getDb();
  for (let slot = 0; slot < 3; slot++) {
    const postId = readSlotId(formData, `post_slot_${slot}`);
    await db
      .insert(homeFeaturedPostSlot)
      .values({ slot, postId })
      .onConflictDoUpdate({
        target: homeFeaturedPostSlot.slot,
        set: { postId },
      });
  }
  revalidatePath("/");
  redirect("/admin/home?saved=journal_picks");
}

export async function saveHomeSelectedWorksAction(formData: FormData) {
  const db = getDb();
  for (let slot = 0; slot < 3; slot++) {
    const artworkId = readSlotId(formData, `artwork_slot_${slot}`);
    await db
      .insert(homeSelectedArtworkSlot)
      .values({ slot, artworkId })
      .onConflictDoUpdate({
        target: homeSelectedArtworkSlot.slot,
        set: { artworkId },
      });
  }
  revalidatePath("/");
  redirect("/admin/home?saved=selected_works_picks");
}

/** @deprecated Use per-section save actions instead. */
export async function saveHomeAllAction(formData: FormData) {
  const db = getDb();
  const t = now();
  for (const key of HOME_SECTION_KEYS) {
    const eyebrow = String(formData.get(`${key}_eyebrow`) ?? "");
    const title = String(formData.get(`${key}_title`) ?? "");
    const quote = String(formData.get(`${key}_quote`) ?? "");
    const body = String(formData.get(`${key}_body`) ?? "");
    await db
      .insert(homeSection)
      .values({
        section: key,
        eyebrow,
        title,
        quote,
        body,
        updatedAt: t,
      })
      .onConflictDoUpdate({
        target: homeSection.section,
        set: { eyebrow, title, quote, body, updatedAt: t },
      });
  }
  for (let slot = 0; slot < 3; slot++) {
    const seriesId = readSlotId(formData, `series_slot_${slot}`);
    await db
      .insert(homeFeaturedSeriesSlot)
      .values({ slot, seriesId })
      .onConflictDoUpdate({
        target: homeFeaturedSeriesSlot.slot,
        set: { seriesId },
      });
  }
  for (let slot = 0; slot < 3; slot++) {
    const postId = readSlotId(formData, `post_slot_${slot}`);
    await db
      .insert(homeFeaturedPostSlot)
      .values({ slot, postId })
      .onConflictDoUpdate({
        target: homeFeaturedPostSlot.slot,
        set: { postId },
      });
  }
  for (let slot = 0; slot < 3; slot++) {
    const artworkId = readSlotId(formData, `artwork_slot_${slot}`);
    await db
      .insert(homeSelectedArtworkSlot)
      .values({ slot, artworkId })
      .onConflictDoUpdate({
        target: homeSelectedArtworkSlot.slot,
        set: { artworkId },
      });
  }
  revalidatePath("/");
  redirect("/admin/home?saved=1");
}

export async function saveHomeSlideshowSlideAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/home?error=slide");

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const alt = heroSlideAlt(title, subtitle);
  const t = now();

  await getDb()
    .update(homeSlideshow)
    .set({ title, subtitle, alt, updatedAt: t })
    .where(eq(homeSlideshow.id, id));

  revalidatePath("/");
  redirect("/admin/home?saved=slideshow");
}

export async function addHomeSlideshowAction(formData: FormData) {
  try {
    const file = formData.get("slide") as File | null;
    const rel = await saveUpload(file, "home-slideshow");
    if (!rel) redirect("/admin/home?error=slide");

    const db = getDb();
    const rows = await db.select().from(homeSlideshow).orderBy(asc(homeSlideshow.sortOrder));
    const nextOrder = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sortOrder)) + 1;
    const t = now();
    await db.insert(homeSlideshow).values({
      id: nanoid(),
      sortOrder: nextOrder,
      image: rel,
      title: "",
      subtitle: "",
      alt: heroSlideAlt("", ""),
      createdAt: t,
      updatedAt: t,
    });
    revalidatePath("/");
    redirect("/admin/home?saved=1");
  } catch (e) {
    console.error("[addHomeSlideshowAction]", e);
    redirect(`/admin/home?error=${encodeURIComponent(e instanceof Error ? e.message : "upload")}`);
  }
}

export async function addHomeSlideshowFromArtworkAction(formData: FormData) {
  const artworkId = String(formData.get("artwork_id") ?? "").trim();
  if (!artworkId) redirect("/admin/home?error=slide");

  const piece = await getArtwork(artworkId);
  if (!piece) redirect("/admin/home?error=slide");

  const title = piece.title;
  const subtitle = captionSubtitle({ medium: piece.medium, size: piece.size, year: piece.year });

  const db = getDb();
  const rows = await db.select().from(homeSlideshow).orderBy(asc(homeSlideshow.sortOrder));
  const nextOrder = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sortOrder)) + 1;
  const t = now();
  await db.insert(homeSlideshow).values({
    id: nanoid(),
    sortOrder: nextOrder,
    image: piece.image,
    title,
    subtitle,
    alt: heroSlideAlt(title, subtitle),
    createdAt: t,
    updatedAt: t,
  });
  revalidatePath("/");
  redirect("/admin/home?saved=1");
}

export async function deleteHomeSlideshowAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/home");
  await getDb().delete(homeSlideshow).where(eq(homeSlideshow.id, id));
  revalidatePath("/");
  redirect("/admin/home?saved=1");
}

export async function reorderHomeSlideshowAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || (dir !== "up" && dir !== "down")) redirect("/admin/home");

  const db = getDb();
  const rows = await db.select().from(homeSlideshow).orderBy(asc(homeSlideshow.sortOrder), asc(homeSlideshow.createdAt));
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) redirect("/admin/home");
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= rows.length) redirect("/admin/home");

  const a = rows[idx]!;
  const b = rows[swapWith]!;
  const t = now();
  await db.update(homeSlideshow).set({ sortOrder: b.sortOrder, updatedAt: t }).where(eq(homeSlideshow.id, a.id));
  await db.update(homeSlideshow).set({ sortOrder: a.sortOrder, updatedAt: t }).where(eq(homeSlideshow.id, b.id));

  revalidatePath("/");
  redirect("/admin/home?saved=1");
}
