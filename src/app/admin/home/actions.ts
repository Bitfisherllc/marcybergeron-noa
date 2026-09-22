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
  siteFavicon,
} from "@/db/schema";
import { getDb } from "@/db";
import { HOME_SLIDESHOW_MAX, resolveHeroSlideshowWrite } from "@/lib/featuredArtwork";
import { allowedHomeSlideHrefs, listHomeSlideLinkGroups, sanitizeHomeSlideHref } from "@/lib/homeSlideLinks";
import { HOME_SECTION_DEFAULTS, HOME_SECTION_KEYS, isHomeToggleableSection, type HomeSectionKey } from "@/lib/homeDefaults";
import { SITE_FAVICON_ID } from "@/lib/siteFavicon";
import { heroSlideAlt } from "@/lib/heroSlides";
import { captionSubtitle } from "@/components/ArtCaption";

function now() {
  return new Date();
}

function readSlotId(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v || null;
}

function readVisibleFlag(formData: FormData): boolean {
  return String(formData.get("visible") ?? "") === "on";
}

async function upsertHomeTextSection(db: ReturnType<typeof getDb>, key: HomeSectionKey, formData: FormData, t: Date) {
  const eyebrow = String(formData.get("eyebrow") ?? "");
  const title = String(formData.get("title") ?? "");
  const quote = String(formData.get("quote") ?? "");
  const body = String(formData.get("body") ?? "");
  const visible = isHomeToggleableSection(key) ? readVisibleFlag(formData) : HOME_SECTION_DEFAULTS[key].visible;
  await db
    .insert(homeSection)
    .values({
      section: key,
      eyebrow,
      title,
      quote,
      body,
      visible,
      updatedAt: t,
    })
    .onConflictDoUpdate({
      target: homeSection.section,
      set: isHomeToggleableSection(key)
        ? { eyebrow, title, quote, body, visible, updatedAt: t }
        : { eyebrow, title, quote, body, updatedAt: t },
    });
}

async function saveFeaturedSeriesSlots(db: ReturnType<typeof getDb>, formData: FormData) {
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
}

async function saveJournalSlots(db: ReturnType<typeof getDb>, formData: FormData) {
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
}

async function saveSelectedWorksSlots(db: ReturnType<typeof getDb>, formData: FormData) {
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
}

export async function saveHomeTextSectionAction(formData: FormData) {
  const key = String(formData.get("section") ?? "");
  if (!HOME_SECTION_KEYS.includes(key as HomeSectionKey)) redirect("/admin/home?error=section");

  const db = getDb();
  const t = now();
  await upsertHomeTextSection(db, key as HomeSectionKey, formData, t);
  if (key === "featured_series") await saveFeaturedSeriesSlots(db, formData);
  if (key === "journal") await saveJournalSlots(db, formData);
  if (key === "selected_works") await saveSelectedWorksSlots(db, formData);
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/");
  redirect(`/admin/home?saved=${encodeURIComponent(key)}`);
}

export async function saveHomeFeaturedSeriesAction(formData: FormData) {
  const db = getDb();
  await saveFeaturedSeriesSlots(db, formData);
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/");
  redirect("/admin/home?saved=featured_series");
}

export async function saveHomeJournalAction(formData: FormData) {
  const db = getDb();
  await saveJournalSlots(db, formData);
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/");
  redirect("/admin/home?saved=journal");
}

export async function saveHomeSelectedWorksAction(formData: FormData) {
  const db = getDb();
  await saveSelectedWorksSlots(db, formData);
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/");
  redirect("/admin/home?saved=selected_works");
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

    const allowedHrefs = allowedHomeSlideHrefs(await listHomeSlideLinkGroups());
    const slides: { image: string; title: string; subtitle: string; href: string }[] = [];
    for (let i = 0; i < HOME_SLIDESHOW_MAX; i += 1) {
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
      const href = sanitizeHomeSlideHref(String(formData.get(`homeSlideHref${i}`) ?? ""), allowedHrefs);
      slides.push({ image: resolved.image, ...caption, href });
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
          href: slide.href,
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

function isFaviconUpload(file: File | null): boolean {
  if (!file || file.size === 0) return false;
  const name = file.name.toLowerCase();
  return /\.(ico|png|svg|webp|jpe?g|gif)$/.test(name) || file.type.startsWith("image/");
}

export async function saveFaviconAction(formData: FormData) {
  const db = getDb();
  const file = formData.get("favicon") as File | null;
  if (file && file.size > 0 && !isFaviconUpload(file)) {
    redirect("/admin/home?error=" + encodeURIComponent("Use a PNG, ICO, SVG, or WebP file for the site icon."));
  }

  try {
    const uploaded = file && file.size > 0 ? await saveUpload(file, "favicon") : null;
    const image = uploaded || readExistingImageField(formData, "faviconExisting");
    const t = now();
    if (image) {
      await db
        .insert(siteFavicon)
        .values({ id: SITE_FAVICON_ID, image, updatedAt: t })
        .onConflictDoUpdate({
          target: siteFavicon.id,
          set: { image, updatedAt: t },
        });
    } else {
      await db.delete(siteFavicon).where(eq(siteFavicon.id, SITE_FAVICON_ID));
    }
  } catch (e) {
    console.error("[saveFaviconAction]", e);
    redirect(`/admin/home?error=${encodeURIComponent(e instanceof Error ? e.message : "favicon")}`);
  }

  revalidateTag(CACHE_TAGS.site, CACHE_REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/", "layout");
  revalidatePath("/");
  redirect("/admin/home?saved=favicon");
}
