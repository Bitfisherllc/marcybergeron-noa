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
import { HOME_SECTION_KEYS } from "@/lib/homeDefaults";

function now() {
  return new Date();
}

function readSlotId(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v || null;
}

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

export async function addHomeSlideshowAction(formData: FormData) {
  try {
    const file = formData.get("slide") as File | null;
    const alt = String(formData.get("slide_alt") ?? "").trim() || "Homepage slideshow image";
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
      alt,
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
