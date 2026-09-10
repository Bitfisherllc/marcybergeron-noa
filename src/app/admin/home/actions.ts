"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { CACHE_REVALIDATE_PROFILE, CACHE_TAGS } from "@/lib/cacheConfig";
import { nanoid } from "nanoid";
import { readExistingImageField } from "@/lib/resolveAdminImage";
import { saveUpload } from "@/lib/save-upload";
import {
  artwork,
  homeFeaturedPostSlot,
  homeFeaturedSeriesSlot,
  homeSection,
  homeSelectedArtworkSlot,
  homeSlideshow,
} from "@/db/schema";
import { getDb } from "@/db";
import { HERO_SLIDESHOW_MAX, resolveHeroSlideshowWrite } from "@/lib/featuredArtwork";
import { HOME_SECTION_KEYS, type HomeSectionKey } from "@/lib/homeDefaults";
import { heroSlideAlt } from "@/lib/heroSlides";
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
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
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
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
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
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
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
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
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
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/");
  redirect("/admin/home?saved=1");
}

function homeSlideCaption(
  resolved: { artworkId: string | null; image: string },
  pieces: { id: string; title: string; image: string; medium: string; size: string }[],
  previous: { image: string; title: string; subtitle: string }[],
): { title: string; subtitle: string } {
  const prev = previous.find((row) => row.image === resolved.image);
  if (prev) return { title: prev.title, subtitle: prev.subtitle };
  const piece = resolved.artworkId
    ? pieces.find((row) => row.id === resolved.artworkId)
    : pieces.find((row) => row.image === resolved.image);
  if (piece) return { title: piece.title, subtitle: captionSubtitle({ medium: piece.medium, size: piece.size }) };
  return { title: "", subtitle: "" };
}

export async function saveHomeSlideshowAction(formData: FormData) {
  try {
    const db = getDb();
    const [pieces, previous] = await Promise.all([
      db
        .select({
          id: artwork.id,
          title: artwork.title,
          image: artwork.image,
          medium: artwork.medium,
          size: artwork.size,
        })
        .from(artwork),
      db.select().from(homeSlideshow).orderBy(asc(homeSlideshow.sortOrder), asc(homeSlideshow.createdAt)),
    ]);

    const slides: { image: string; title: string; subtitle: string }[] = [];
    for (let i = 0; i < HERO_SLIDESHOW_MAX; i += 1) {
      const uploaded = await saveUpload(formData.get(`homeSlide${i}`) as File | null, "home-slideshow");
      const resolved = resolveHeroSlideshowWrite({
        uploaded,
        libraryImage: readExistingImageField(formData, `homeSlide${i}Existing`),
        initialImage: String(formData.get(`homeSlide${i}Initial`) ?? "").trim(),
        artworkId: String(formData.get(`homeSlideArtwork${i}`) ?? "").trim(),
        pieces,
      });
      if (!resolved) continue;
      const caption = homeSlideCaption(resolved, pieces, previous);
      slides.push({ image: resolved.image, ...caption });
    }

    await db.delete(homeSlideshow).where(sql`true`);
    const t = now();
    if (slides.length > 0) {
      await db.insert(homeSlideshow).values(
        slides.map((slide, sortOrder) => ({
          id: nanoid(),
          sortOrder,
          image: slide.image,
          title: slide.title,
          subtitle: slide.subtitle,
          alt: heroSlideAlt(slide.title, slide.subtitle),
          createdAt: t,
          updatedAt: t,
        })),
      );
    }
  } catch (e) {
    console.error("[saveHomeSlideshowAction]", e);
    redirect(`/admin/home?error=${encodeURIComponent(e instanceof Error ? e.message : "slideshow")}`);
  }

  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/");
  redirect("/admin/home?saved=slideshow");
}
