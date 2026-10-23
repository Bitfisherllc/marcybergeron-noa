"use server";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { artwork, artworkSeries, contactMessage, post, postCategory, postGalleryImage, postIndexCopy, series, seriesHeroSlide, workshopInquiry } from "@/db/schema";
import { getDb } from "@/db";
import {
  getArtworkPortfolioOnlySeriesIds,
  getArtworkPortfolioSeriesIds,
  parsePortfolioSeriesIdsFromForm,
  partitionExhibitionSeriesIds,
  resolveArtworkAssignment,
  setArtworkPortfolioSeriesIds,
} from "@/lib/artworkMembership";
import { createAdminSession, destroyAdminSession, requireAdminSession, verifyAdminPassword } from "@/lib/auth";
import { readExistingImageField } from "@/lib/resolveAdminImage";
import { saveUpload } from "@/lib/save-upload";
import { slugifyPostCategory } from "@/lib/postCategories";
import { parsePostKind, postAdminBasePath, postPublicBasePath, postPublicHref, type PostKind } from "@/lib/postKind";
import { parseArtworkPrice } from "@/lib/artworkPrice";
import { parseWorkshopPrice } from "@/lib/workshopPrice";
import { CACHE_REVALIDATE_PROFILE, CACHE_TAGS } from "@/lib/cacheConfig";
import { measureImageBuffer, measureImageSrc } from "@/lib/imageDimensions";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import {
  adminPathForSeriesId,
  ensureExhibitionsParent,
  exhibitionPublicHref,
  EXHIBITIONS_PARENT_SLUG,
  isExhibitionsParentSlug,
} from "@/lib/exhibitions";
import {
  HERO_SLIDESHOW_MAX,
  parseFeaturedArtworkMode,
  resolveHeroSlideshowWrite,
} from "@/lib/featuredArtwork";
import { isMediumGallerySlug, isStudioGallerySlug } from "@/lib/mediumGalleries";
import { artSeriesHref } from "@/lib/routeSlug";
import { generatePrivateGalleryAccessToken } from "@/lib/privateGalleries";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  getSeriesById,
  listArtworksForHeroPicks,
  listArtworksForSeries,
  listExhibitions,
  listPostCategories,
  listPostGalleryImages,
} from "@/lib/queries";
import {
  getSeriesDeleteImpact,
  reassignArtworksBeforeSeriesDelete,
  type SeriesDeleteReassignType,
} from "@/lib/seriesDelete";

export async function loginAction(formData: FormData) {
  if (!(await verifyTurnstile(formData))) redirect("/admin/login?error=robot");
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) redirect("/admin/login?error=1");
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

function now() {
  return new Date();
}

function swapOrderedIds(ids: string[], idx: number, swapWith: number): string[] {
  const next = [...ids];
  [next[idx], next[swapWith]] = [next[swapWith]!, next[idx]!];
  return next;
}

async function parseMediumSeriesId(raw: string): Promise<string | null> {
  const id = raw.trim();
  if (!id) return null;
  const row = await getDb()
    .select({ slug: series.slug })
    .from(series)
    .where(eq(series.id, id))
    .then((r) => r[0]);
  if (!row || !isMediumGallerySlug(row.slug)) return null;
  return id;
}

async function revalidateArtworkPaths(
  portfolioSeriesIds: string[],
  mediumSeriesId: string | null,
  previousMediumSeriesId?: string | null,
  previousPortfolioSeriesIds?: string[],
) {
  revalidateTag(CACHE_TAGS.series, CACHE_REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.artwork, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/");
  revalidatePath("/medium");
  revalidatePath("/series");
  revalidatePath("/exhibitions");
  revalidatePath("/art/[slug]", "page");
  revalidatePath("/exhibitions/[slug]", "page");

  const portfolioIds = new Set([...portfolioSeriesIds, ...(previousPortfolioSeriesIds ?? [])]);
  for (const id of portfolioIds) {
    const s = await getSeriesById(id);
    if (!s) continue;
    revalidatePath(artSeriesHref(s.slug));
    revalidatePath(`/art/${s.slug}`);
    if (s.parentSeriesId) {
      const parent = await getSeriesById(s.parentSeriesId);
      if (parent && isExhibitionsParentSlug(parent.slug)) {
        revalidatePath(exhibitionPublicHref(s.slug));
      }
    }
  }

  const mediumIds = new Set<string>();
  if (mediumSeriesId) mediumIds.add(mediumSeriesId);
  if (previousMediumSeriesId) mediumIds.add(previousMediumSeriesId);

  for (const id of mediumIds) {
    const m = await getSeriesById(id);
    if (m) {
      revalidatePath(artSeriesHref(m.slug));
      revalidatePath(`/art/${m.slug}`);
    }
  }
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Series may only hang off a public portfolio medium (not The Studio, not another series). */
async function parseSeriesParentId(raw: string): Promise<string | null> {
  const id = raw.trim();
  if (!id) return null;
  const row = await getDb()
    .select({ slug: series.slug })
    .from(series)
    .where(eq(series.id, id))
    .then((r) => r[0]);
  if (!row || !isMediumGallerySlug(row.slug) || isStudioGallerySlug(row.slug)) return null;
  return id;
}

export async function upsertSeries(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || slugFromTitle(title);
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0")) || 0;
  const privacyField = formData.get("isPrivate");
  const featured = formData.get("featured") as File | null;

  let featuredArtworkMode =
    parseFeaturedArtworkMode(String(formData.get("featuredArtworkMode") ?? "")) ?? "upload";
  const featuredArtworkIdRaw = String(formData.get("featuredArtworkId") ?? "").trim();
  const showHeroSlideshow = String(formData.get("showHeroSlideshow") ?? "") === "on";

  const exhibitionChild = String(formData.get("exhibitionParent") ?? "") === "1";
  const exhibitionsIndex = String(formData.get("exhibitionsIndex") ?? "") === "1";
  const formPath = exhibitionsIndex
    ? "/admin/exhibitions"
    : exhibitionChild
      ? id
        ? `/admin/exhibitions/${id}`
        : "/admin/exhibitions/new"
      : id
        ? `/admin/series/${id}`
        : "/admin/series/new";
  const resolvedSlug = exhibitionsIndex ? EXHIBITIONS_PARENT_SLUG : slug;
  if (!resolvedSlug || !title) redirect(`${formPath}?error=missing`);

  const db = getDb();
  const existingRow = id
    ? await db
        .select({
          isPrivate: series.isPrivate,
          accessToken: series.accessToken,
          featuredImage: series.featuredImage,
          featuredArtworkMode: series.featuredArtworkMode,
          featuredArtworkId: series.featuredArtworkId,
          parentSeriesId: series.parentSeriesId,
        })
        .from(series)
        .where(eq(series.id, id))
        .then((r) => r[0])
    : null;

  if (
    exhibitionChild &&
    (isExhibitionsParentSlug(resolvedSlug) || isMediumGallerySlug(resolvedSlug) || isStudioGallerySlug(resolvedSlug))
  ) {
    redirect(`${formPath}?error=slug`);
  }

  const slugOwner = await db
    .select({ id: series.id })
    .from(series)
    .where(eq(series.slug, resolvedSlug))
    .then((r) => r[0]);
  if (slugOwner && slugOwner.id !== id) redirect(`${formPath}?error=slug`);

  let parentSeriesId = existingRow?.parentSeriesId ?? null;
  if (exhibitionChild) {
    parentSeriesId = (await ensureExhibitionsParent()).id;
  } else if (exhibitionsIndex) {
    parentSeriesId = null;
  } else if (formData.has("parentSeriesId")) {
    parentSeriesId = await parseSeriesParentId(String(formData.get("parentSeriesId") ?? ""));
    if (!parentSeriesId) redirect(`${formPath}?error=medium`);
  }

  const isPrivate =
    !parentSeriesId &&
    (privacyField === null ? (existingRow?.isPrivate ?? false) : String(privacyField) === "on");

  const uploaded = await saveUpload(featured, resolvedSlug);
  const existing = readExistingImageField(formData, "featuredExisting");
  const featuredImage = uploaded || existing || existingRow?.featuredImage || GALLERY_PLACEHOLDER_IMAGE;

  let featuredArtworkId: string | null = null;
  if (!formData.has("featuredArtworkMode") && existingRow) {
    featuredArtworkMode =
      parseFeaturedArtworkMode(existingRow.featuredArtworkMode) ?? featuredArtworkMode;
    featuredArtworkId = existingRow.featuredArtworkId;
  }
  const heroSlides: { artworkId: string | null; image: string }[] = [];
  if (id) {
    const ser = await getSeriesById(id);
    if (ser) {
      const pieces = exhibitionsIndex
        ? (await Promise.all((await listExhibitions()).map((row) => listArtworksForSeries(row.id)))).flat()
        : await listArtworksForHeroPicks(ser);
      const allowed = new Set(pieces.map((piece) => piece.id));
      if (formData.has("featuredArtworkMode")) {
        featuredArtworkId = null;
        if (featuredArtworkMode === "static" && featuredArtworkIdRaw && allowed.has(featuredArtworkIdRaw)) {
          featuredArtworkId = featuredArtworkIdRaw;
        }
      }
      for (let i = 0; i < HERO_SLIDESHOW_MAX; i += 1) {
        const uploaded = await saveUpload(formData.get(`heroSlide${i}`) as File | null, resolvedSlug);
        const resolved = resolveHeroSlideshowWrite({
          uploaded,
          libraryImage: readExistingImageField(formData, `heroSlide${i}Existing`),
          initialImage: String(formData.get(`heroSlide${i}Initial`) ?? "").trim(),
          artworkId: String(formData.get(`heroSlideArtwork${i}`) ?? "").trim(),
          pieces,
        });
        if (resolved) heroSlides.push(resolved);
      }
    }
  }

  let accessToken = existingRow?.accessToken ?? null;
  if (isPrivate && !accessToken) accessToken = generatePrivateGalleryAccessToken();
  if (!isPrivate) accessToken = null;

  if (id) {
    await db
      .update(series)
      .set({
        slug: resolvedSlug,
        title,
        excerpt,
        content,
        featuredImage,
        featuredArtworkMode,
        featuredArtworkId,
        showHeroSlideshow,
        sortOrder,
        parentSeriesId,
        isPrivate,
        accessToken,
        updatedAt: now(),
      })
      .where(eq(series.id, id));
    await db.delete(seriesHeroSlide).where(eq(seriesHeroSlide.seriesId, id));
    if (heroSlides.length > 0) {
      await db.insert(seriesHeroSlide).values(
        heroSlides.map((slide, slot) => ({
          seriesId: id,
          slot,
          artworkId: slide.artworkId,
          image: slide.image,
        })),
      );
    }
  } else {
    const newId = nanoid();
    await db.insert(series).values({
      id: newId,
      slug: resolvedSlug,
      title,
      excerpt,
      content,
      featuredImage,
      featuredArtworkMode,
      featuredArtworkId,
      showHeroSlideshow,
      sortOrder,
      parentSeriesId,
      isPrivate,
      accessToken,
      createdAt: now(),
      updatedAt: now(),
    });
    await revalidateSeriesPaths(resolvedSlug, [parentSeriesId], accessToken);
    revalidatePath("/admin/series");
    revalidatePath("/admin/exhibitions");
    redirect(exhibitionChild ? `/admin/exhibitions/${newId}` : `/admin/series/${newId}`);
  }

  await revalidateSeriesPaths(resolvedSlug, [parentSeriesId, existingRow?.parentSeriesId ?? null], accessToken);
  if (exhibitionsIndex) redirect("/admin/exhibitions");
  if (exhibitionChild) redirect(`/admin/exhibitions/${id}`);
  redirect(`/admin/series/${id}`);
}

async function revalidateSeriesPaths(slug: string, parentIds: (string | null)[], accessToken: string | null) {
  revalidateTag(CACHE_TAGS.series, CACHE_REVALIDATE_PROFILE);
  revalidatePath("/");
  revalidatePath("/medium");
  revalidatePath("/series");
  revalidatePath(`/art/${slug}`);
  if (isExhibitionsParentSlug(slug)) {
    revalidatePath("/exhibitions");
    revalidatePath("/admin/exhibitions");
  }
  for (const parentId of new Set(parentIds)) {
    if (!parentId) continue;
    const parent = await getSeriesById(parentId);
    if (!parent) continue;
    if (isExhibitionsParentSlug(parent.slug)) {
      revalidatePath("/exhibitions");
      revalidatePath(exhibitionPublicHref(slug));
      revalidatePath("/admin/exhibitions");
    } else {
      revalidatePath(`/art/${parent.slug}`);
    }
  }
  if (accessToken) revalidatePath(`/private/${accessToken}`);
}

export async function setSeriesPrivacy(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const privacy = String(formData.get("privacy") ?? "");
  if (!id || (privacy !== "private" && privacy !== "public")) redirect("/admin/series");

  const db = getDb();
  const row = await db
    .select({
      slug: series.slug,
      isPrivate: series.isPrivate,
      accessToken: series.accessToken,
      parentSeriesId: series.parentSeriesId,
    })
    .from(series)
    .where(eq(series.id, id))
    .then((r) => r[0]);
  if (!row || isMediumGallerySlug(row.slug) || row.parentSeriesId) redirect("/admin/series");

  const isPrivate = privacy === "private";
  const previousToken = row.accessToken;
  let accessToken = row.accessToken;
  if (isPrivate && !accessToken) accessToken = generatePrivateGalleryAccessToken();
  if (!isPrivate) accessToken = null;

  await db
    .update(series)
    .set({ isPrivate, accessToken, updatedAt: now() })
    .where(eq(series.id, id));

  revalidatePath("/");
  revalidatePath("/medium");
  revalidatePath("/series");
  revalidatePath(`/art/${row.slug}`);
  if (previousToken) revalidatePath(`/private/${previousToken}`);
  if (accessToken) revalidatePath(`/private/${accessToken}`);
  revalidatePath("/admin/series");
  redirect(`/admin/series/${id}`);
}

export async function regeneratePrivateGalleryToken(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/series");

  const db = getDb();
  const row = await db
    .select({ isPrivate: series.isPrivate, accessToken: series.accessToken })
    .from(series)
    .where(eq(series.id, id))
    .then((r) => r[0]);
  if (!row || !row.isPrivate) redirect(`/admin/series/${id}`);

  const accessToken = generatePrivateGalleryAccessToken();
  await db.update(series).set({ accessToken, updatedAt: now() }).where(eq(series.id, id));

  if (row.accessToken) revalidatePath(`/private/${row.accessToken}`);
  revalidatePath(`/private/${accessToken}`);
  revalidatePath(`/admin/series/${id}`);
  redirect(`/admin/series/${id}`);
}

export async function deleteSeries(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/admin/series";
  const redirectAfter = String(formData.get("redirectAfter") ?? "").trim() || "/admin/series";
  const reassignType = String(formData.get("reassignType") ?? "") as SeriesDeleteReassignType | "";
  const reassignTargetId = String(formData.get("reassignTargetId") ?? "").trim() || null;

  if (!id) redirect("/admin/series");

  const impact = await getSeriesDeleteImpact(id);
  if (!impact) redirect("/admin/series");
  if (impact.isMediumGallery) redirect(returnTo);

  const deletedRow = await getDb()
    .select({ accessToken: series.accessToken, slug: series.slug, parentSeriesId: series.parentSeriesId })
    .from(series)
    .where(eq(series.id, id))
    .then((r) => r[0]);

  try {
    if (impact.primaryArtworks.length > 0) {
      if (reassignType !== "portfolio" && reassignType !== "medium") {
        redirect(`${returnTo}?deleteError=reassign-required`);
      }
      await reassignArtworksBeforeSeriesDelete(id, reassignType, reassignTargetId);
    } else if (
      impact.isMediumGallery &&
      impact.mediumAssignments.length > 0 &&
      reassignType === "medium" &&
      reassignTargetId
    ) {
      await reassignArtworksBeforeSeriesDelete(id, "medium", reassignTargetId);
    }

    await getDb().delete(series).where(eq(series.id, id));
  } catch {
    redirect(`${returnTo}?deleteError=reassign-failed`);
  }

  revalidatePath("/");
  revalidatePath("/medium");
  revalidatePath("/series");
  revalidatePath("/exhibitions");
  revalidatePath("/admin/exhibitions");
  if (deletedRow?.parentSeriesId) {
    const parent = await getSeriesById(deletedRow.parentSeriesId);
    if (parent && isExhibitionsParentSlug(parent.slug) && deletedRow.slug) {
      revalidatePath(exhibitionPublicHref(deletedRow.slug));
    }
  }
  if (deletedRow?.accessToken) revalidatePath(`/private/${deletedRow.accessToken}`);
  redirect(redirectAfter);
}

export async function reorderSeries(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || (dir !== "up" && dir !== "down")) redirect("/admin/series");

  const db = getDb();
  const items = await db.select().from(series).orderBy(asc(series.sortOrder), asc(series.title));
  const idx = items.findIndex((s) => s.id === id);
  if (idx === -1) redirect("/admin/series");
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) redirect("/admin/series");

  const ordered = swapOrderedIds(
    items.map((s) => s.id),
    idx,
    swapWith,
  );
  const t = now();
  for (let i = 0; i < ordered.length; i++) {
    await db.update(series).set({ sortOrder: i, updatedAt: t }).where(eq(series.id, ordered[i]!));
  }

  revalidatePath("/");
  revalidatePath("/medium");
  revalidatePath("/series");
  revalidatePath("/admin/series");
  redirect("/admin/series");
}

export async function upsertArtwork(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const contextSeriesId = String(formData.get("contextSeriesId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const medium = String(formData.get("medium") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "unknown").trim();
  const price = parseArtworkPrice(formData.get("price"));
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0")) || 0;
  const imageFile = formData.get("image") as File | null;
  const existingImage = readExistingImageField(formData, "imageExisting");
  const mediumSeriesIdRaw = await parseMediumSeriesId(String(formData.get("mediumSeriesId") ?? ""));
  let mediumSeriesId = mediumSeriesIdRaw;

  const existingMembershipIds = id ? await getArtworkPortfolioOnlySeriesIds(id) : [];
  let portfolioSeriesIds = await parsePortfolioSeriesIdsFromForm(formData);
  if (portfolioSeriesIds.length === 0) portfolioSeriesIds = existingMembershipIds;
  if (contextSeriesId && !portfolioSeriesIds.includes(contextSeriesId)) {
    const context = await getSeriesById(contextSeriesId);
    if (context && !isMediumGallerySlug(context.slug)) {
      portfolioSeriesIds = [...portfolioSeriesIds, contextSeriesId];
    }
  }

  const contextAdminPath = contextSeriesId ? await adminPathForSeriesId(contextSeriesId) : null;
  const failRedirect = contextAdminPath
    ? contextAdminPath
    : contextSeriesId
      ? `/admin/series/${contextSeriesId}`
      : id
        ? `/admin/artworks/${id}`
        : `/admin/artworks/new`;
  if (!title) redirect(failRedirect);

  const { exhibitionIds, otherIds } = await partitionExhibitionSeriesIds(portfolioSeriesIds);
  const assignmentSource = otherIds.length > 0 ? otherIds : mediumSeriesId ? [] : exhibitionIds;
  const assignment = await resolveArtworkAssignment(assignmentSource, mediumSeriesId);
  if (!assignment) redirect(failRedirect);
  const membershipIds = [...new Set([...assignment.portfolioSeriesIds, ...exhibitionIds])];

  const db = getDb();
  const previousMediumSeriesId = id
    ? await db
        .select({ mediumSeriesId: artwork.mediumSeriesId })
        .from(artwork)
        .where(eq(artwork.id, id))
        .then((r) => r[0]?.mediumSeriesId ?? null)
    : null;
  const previousPortfolioSeriesIds = id ? await getArtworkPortfolioSeriesIds(id) : [];

  const image = (await saveUpload(imageFile, assignment.uploadSlug)) || existingImage;
  if (!image) redirect(failRedirect);

  let imageWidth: number | null = null;
  let imageHeight: number | null = null;
  if (imageFile && imageFile.size > 0) {
    const dim = measureImageBuffer(Buffer.from(await imageFile.arrayBuffer()));
    imageWidth = dim?.width ?? null;
    imageHeight = dim?.height ?? null;
  } else if (id) {
    const priorDims = await db
      .select({ imageWidth: artwork.imageWidth, imageHeight: artwork.imageHeight, image: artwork.image })
      .from(artwork)
      .where(eq(artwork.id, id))
      .then((r) => r[0]);
    if (priorDims && priorDims.image === image) {
      imageWidth = priorDims.imageWidth;
      imageHeight = priorDims.imageHeight;
    } else if (image.startsWith("/")) {
      const dim = await measureImageSrc(image);
      imageWidth = dim?.width ?? null;
      imageHeight = dim?.height ?? null;
    }
  } else if (image.startsWith("/")) {
    const dim = await measureImageSrc(image);
    imageWidth = dim?.width ?? null;
    imageHeight = dim?.height ?? null;
  }

  const alt = String(formData.get("alt") ?? "").trim() || `${title} — ${[medium, size].filter(Boolean).join(" · ")}`;
  const artworkId = id || nanoid();
  const t = now();

  if (id) {
    await db
      .update(artwork)
      .set({
        seriesId: assignment.storageSeriesId,
        title,
        medium,
        size,
        year: "",
        description,
        image,
        alt,
        imageWidth,
        imageHeight,
        status,
        price,
        sortOrder,
        mediumSeriesId: assignment.mediumSeriesId,
        updatedAt: t,
      })
      .where(eq(artwork.id, id));
  } else {
    await db.insert(artwork).values({
      id: artworkId,
      seriesId: assignment.storageSeriesId,
      mediumSeriesId: assignment.mediumSeriesId,
      title,
      medium,
      size,
      year: "",
      description,
      image,
      alt,
      imageWidth,
      imageHeight,
      status,
      price,
      sortOrder,
      createdAt: t,
      updatedAt: t,
    });
  }

  await setArtworkPortfolioSeriesIds(artworkId, membershipIds);
  await revalidateArtworkPaths(
    membershipIds,
    assignment.mediumSeriesId,
    previousMediumSeriesId,
    previousPortfolioSeriesIds,
  );

  redirect(`/admin/artworks/${artworkId}`);
}

/** Add a painting that already exists to an exhibition or series, without copying it. */
export async function addExistingArtworkToGallery(formData: FormData) {
  await requireAdminSession();
  const artworkId = String(formData.get("artworkId") ?? "").trim();
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const back = seriesId ? ((await adminPathForSeriesId(seriesId)) ?? `/admin/series/${seriesId}`) : "/admin/series";
  if (!artworkId || !seriesId) redirect(back);

  const db = getDb();
  const [piece, gallery] = await Promise.all([
    db
      .select({ id: artwork.id, mediumSeriesId: artwork.mediumSeriesId })
      .from(artwork)
      .where(eq(artwork.id, artworkId))
      .then((rows) => rows[0]),
    getSeriesById(seriesId),
  ]);
  if (!piece || !gallery) redirect(back);

  const existing = await getArtworkPortfolioSeriesIds(artworkId);
  if (isMediumGallerySlug(gallery.slug)) {
    if (piece.mediumSeriesId === seriesId) redirect(back);
    if (!piece.mediumSeriesId) {
      await db.update(artwork).set({ mediumSeriesId: seriesId, updatedAt: now() }).where(eq(artwork.id, artworkId));
    } else if (!existing.includes(seriesId)) {
      await db.insert(artworkSeries).values({ artworkId, seriesId }).onConflictDoNothing();
    }
  } else if (!existing.includes(seriesId)) {
    await db.insert(artworkSeries).values({ artworkId, seriesId }).onConflictDoNothing();
  }

  const nextMedium =
    isMediumGallerySlug(gallery.slug) && !piece.mediumSeriesId ? seriesId : piece.mediumSeriesId;
  await revalidateArtworkPaths([...existing, seriesId], nextMedium, piece.mediumSeriesId);
  redirect(back);
}

/** Hide a painting from the public site, or show it again. The painting stays in admin. */
export async function setArtworkHidden(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const hidden = String(formData.get("hidden") ?? "") === "1";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const requested = String(formData.get("returnPath") ?? "").trim();
  const returnPath =
    requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("?") && !requested.includes("\\")
      ? requested
      : seriesId
        ? ((await adminPathForSeriesId(seriesId)) ?? `/admin/series/${seriesId}`)
        : "/admin/series";
  if (!id) redirect(returnPath);

  const db = getDb();
  const piece = await db
    .select({ mediumSeriesId: artwork.mediumSeriesId })
    .from(artwork)
    .where(eq(artwork.id, id))
    .then((rows) => rows[0]);
  if (!piece) redirect(returnPath);

  await db.update(artwork).set({ hidden, updatedAt: now() }).where(eq(artwork.id, id));
  const portfolioSeriesIds = await getArtworkPortfolioSeriesIds(id);
  await revalidateArtworkPaths(portfolioSeriesIds, piece.mediumSeriesId);
  revalidatePath(returnPath);
  revalidatePath("/");
  redirect(returnPath);
}

/** Quick membership edit from a signed-in public gallery card. */
export async function updateArtworkMembershipFromSite(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/medium").trim() || "/medium";
  if (!id) redirect(returnPath);

  let portfolioSeriesIds = await parsePortfolioSeriesIdsFromForm(formData);
  if (portfolioSeriesIds.length === 0) {
    portfolioSeriesIds = await getArtworkPortfolioOnlySeriesIds(id);
  }
  const mediumSeriesId = await parseMediumSeriesId(String(formData.get("mediumSeriesId") ?? ""));
  const { exhibitionIds, otherIds } = await partitionExhibitionSeriesIds(portfolioSeriesIds);
  const assignmentSource = otherIds.length > 0 ? otherIds : mediumSeriesId ? [] : exhibitionIds;
  const assignment = await resolveArtworkAssignment(assignmentSource, mediumSeriesId);
  if (!assignment) redirect(returnPath);
  const membershipIds = [...new Set([...assignment.portfolioSeriesIds, ...exhibitionIds])];

  const status = String(formData.get("status") ?? "unknown").trim();
  const priceField = formData.get("price");
  const price = priceField === null ? undefined : parseArtworkPrice(priceField);

  const db = getDb();
  const previousMediumSeriesId = await db
    .select({ mediumSeriesId: artwork.mediumSeriesId })
    .from(artwork)
    .where(eq(artwork.id, id))
    .then((r) => r[0]?.mediumSeriesId ?? null);
  const previousPortfolioSeriesIds = await getArtworkPortfolioSeriesIds(id);

  await db
    .update(artwork)
    .set({
      seriesId: assignment.storageSeriesId,
      mediumSeriesId: assignment.mediumSeriesId,
      status,
      ...(price !== undefined ? { price } : {}),
      updatedAt: now(),
    })
    .where(eq(artwork.id, id));

  await setArtworkPortfolioSeriesIds(id, membershipIds);
  await revalidateArtworkPaths(
    membershipIds,
    assignment.mediumSeriesId,
    previousMediumSeriesId,
    previousPortfolioSeriesIds,
  );
  revalidatePath(returnPath);
  revalidatePath("/");
  redirect(returnPath);
}

export async function deleteArtworkFromSite(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const returnPath = String(formData.get("returnPath") ?? "/medium").trim() || "/medium";
  if (!id) redirect(returnPath);

  if (seriesId) {
    await removeArtworkFromGallery(id, seriesId);
    revalidatePath(returnPath);
    revalidatePath("/");
    redirect(returnPath);
  }

  const db = getDb();
  const piece = await db
    .select({ mediumSeriesId: artwork.mediumSeriesId })
    .from(artwork)
    .where(eq(artwork.id, id))
    .then((r) => r[0]);
  const portfolioSeriesIds = await getArtworkPortfolioSeriesIds(id);
  await db.delete(artwork).where(eq(artwork.id, id));
  await revalidateArtworkPaths(portfolioSeriesIds, piece?.mediumSeriesId ?? null);
  revalidatePath(returnPath);
  revalidatePath("/");
  redirect(returnPath);
}

/**
 * Take a painting out of one gallery. If it still belongs to another gallery, the
 * painting stays on the site. If this was its only gallery, the painting is deleted.
 */
async function removeArtworkFromGallery(id: string, contextSeriesId: string) {
  const db = getDb();
  const piece = await db
    .select({ seriesId: artwork.seriesId, mediumSeriesId: artwork.mediumSeriesId })
    .from(artwork)
    .where(eq(artwork.id, id))
    .then((r) => r[0]);
  const portfolioSeriesIds = piece ? await getArtworkPortfolioSeriesIds(id) : [];
  const gallery = await getSeriesById(contextSeriesId);
  if (!piece || !gallery) {
    return { portfolioSeriesIds, previousMediumSeriesId: piece?.mediumSeriesId ?? null, mediumSeriesId: piece?.mediumSeriesId ?? null };
  }

  const otherMemberships = portfolioSeriesIds.filter((seriesId) => seriesId !== contextSeriesId);
  const mediumRemains = piece.mediumSeriesId && piece.mediumSeriesId !== contextSeriesId ? piece.mediumSeriesId : null;
  if (otherMemberships.length === 0 && !mediumRemains) {
    await db.delete(artwork).where(eq(artwork.id, id));
    await revalidateArtworkPaths(portfolioSeriesIds, piece.mediumSeriesId);
    return { portfolioSeriesIds, previousMediumSeriesId: piece.mediumSeriesId, mediumSeriesId: null };
  }

  await setArtworkPortfolioSeriesIds(id, otherMemberships);
  const nextSeriesId = piece.seriesId !== contextSeriesId ? piece.seriesId : (otherMemberships[0] ?? mediumRemains!);
  await db
    .update(artwork)
    .set({
      seriesId: nextSeriesId,
      mediumSeriesId: mediumRemains,
      updatedAt: now(),
    })
    .where(eq(artwork.id, id));
  await revalidateArtworkPaths(portfolioSeriesIds, mediumRemains, piece.mediumSeriesId, portfolioSeriesIds);
  return { portfolioSeriesIds, previousMediumSeriesId: piece.mediumSeriesId, mediumSeriesId: mediumRemains };
}

export async function deleteArtwork(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const contextSeriesId = String(formData.get("contextSeriesId") ?? "");
  if (!id || !contextSeriesId) redirect("/admin/series");
  const back = (await adminPathForSeriesId(contextSeriesId)) ?? `/admin/series/${contextSeriesId}`;

  if (String(formData.get("everywhere") ?? "") === "1") {
    const db = getDb();
    const piece = await db
      .select({ mediumSeriesId: artwork.mediumSeriesId })
      .from(artwork)
      .where(eq(artwork.id, id))
      .then((r) => r[0]);
    const portfolioSeriesIds = await getArtworkPortfolioSeriesIds(id);
    await db.delete(artwork).where(eq(artwork.id, id));
    await revalidateArtworkPaths(portfolioSeriesIds, piece?.mediumSeriesId ?? null);
    redirect(back);
  }

  await removeArtworkFromGallery(id, contextSeriesId);
  redirect(back);
}

/** Save a gallery's full painting order in one write. Called in the background by the admin arrow buttons. */
export async function saveGalleryArtworkOrder(seriesId: string, orderedIds: string[]): Promise<{ ok: boolean }> {
  await requireAdminSession();
  const db = getDb();
  const gallery = await db
    .select({ slug: series.slug, parentSeriesId: series.parentSeriesId })
    .from(series)
    .where(eq(series.id, seriesId))
    .then((r) => r[0]);
  if (!gallery) return { ok: false };

  const current = isMediumGallerySlug(gallery.slug)
    ? await db.select({ id: artwork.id }).from(artwork).where(eq(artwork.mediumSeriesId, seriesId))
    : await db
        .select({ id: artwork.id })
        .from(artwork)
        .innerJoin(artworkSeries, eq(artworkSeries.artworkId, artwork.id))
        .where(eq(artworkSeries.seriesId, seriesId));
  const currentIds = new Set(current.map((r) => r.id));
  const ids = [...new Set(orderedIds)];
  if (ids.length !== currentIds.size || ids.some((id) => !currentIds.has(id))) return { ok: false };

  if (ids.length > 0) {
    const cases = sql.join(
      ids.map((id, i) => sql`when ${id} then ${i}::integer`),
      sql` `,
    );
    await db
      .update(artwork)
      .set({ sortOrder: sql`case ${artwork.id} ${cases} end`, updatedAt: now() })
      .where(inArray(artwork.id, ids));
  }

  updateTag(CACHE_TAGS.artwork);
  revalidatePath(`/art/${gallery.slug}`);
  if (gallery.parentSeriesId) {
    const parent = await getSeriesById(gallery.parentSeriesId);
    if (parent && isExhibitionsParentSlug(parent.slug)) {
      revalidatePath("/exhibitions");
      revalidatePath(exhibitionPublicHref(gallery.slug));
    }
  }
  revalidatePath("/medium");
  revalidatePath("/");
  return { ok: true };
}

/** Save the order of the series listed under a medium gallery. Called in the background by the admin arrow buttons. */
export async function saveChildSeriesOrder(mediumId: string, orderedIds: string[]): Promise<{ ok: boolean }> {
  await requireAdminSession();
  const db = getDb();
  const medium = await db
    .select({ slug: series.slug })
    .from(series)
    .where(eq(series.id, mediumId))
    .then((r) => r[0]);
  if (!medium) return { ok: false };

  const children = await db
    .select({ id: series.id, slug: series.slug, sortOrder: series.sortOrder })
    .from(series)
    .where(and(eq(series.parentSeriesId, mediumId), eq(series.isPrivate, false)))
    .orderBy(asc(series.sortOrder), asc(series.title));
  const childIds = new Set(children.map((c) => c.id));
  const ids = [...new Set(orderedIds)];
  if (ids.length !== childIds.size || ids.some((id) => !childIds.has(id))) return { ok: false };

  // Sort order is shared by every gallery, so reuse this medium's existing slots instead of renumbering from 0.
  const slots: number[] = [];
  for (const child of children) {
    const prev = slots[slots.length - 1];
    slots.push(prev === undefined ? child.sortOrder : Math.max(child.sortOrder, prev + 1));
  }

  if (ids.length > 0) {
    const cases = sql.join(
      ids.map((id, i) => sql`when ${id} then ${slots[i]!}::integer`),
      sql` `,
    );
    await db
      .update(series)
      .set({ sortOrder: sql`case ${series.id} ${cases} end`, updatedAt: now() })
      .where(inArray(series.id, ids));
  }

  updateTag(CACHE_TAGS.series);
  if (isExhibitionsParentSlug(medium.slug)) {
    revalidatePath("/exhibitions");
    revalidatePath("/admin/exhibitions");
    for (const child of children) revalidatePath(exhibitionPublicHref(child.slug));
  } else {
    revalidatePath(`/art/${medium.slug}`);
    revalidatePath("/medium");
  }
  revalidatePath("/");
  revalidatePath("/admin/series");
  return { ok: true };
}

function adminPostsPath(kind: PostKind, suffix = "") {
  return `${postAdminBasePath(kind)}${suffix}`;
}

function revalidatePostPublic(kind: PostKind, slug?: string, previousSlug?: string) {
  revalidateTag(CACHE_TAGS.posts, CACHE_REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.home, CACHE_REVALIDATE_PROFILE);
  revalidatePath(postPublicBasePath(kind));
  const slugs = [...new Set([slug, previousSlug].filter((value): value is string => Boolean(value)))];
  for (const s of slugs) {
    revalidatePath(postPublicHref(kind, s));
    if (kind === "workshop") revalidatePath(`${postPublicHref(kind, s)}/interest`);
  }
  revalidatePath("/");
}

export async function savePostIndexCopy(formData: FormData) {
  const kind = parsePostKind(formData.get("kind"));
  const eyebrow = String(formData.get("eyebrow") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const t = now();

  await getDb()
    .insert(postIndexCopy)
    .values({
      kind,
      eyebrow,
      title,
      intro,
      updatedAt: t,
    })
    .onConflictDoUpdate({
      target: postIndexCopy.kind,
      set: { eyebrow, title, intro, updatedAt: t },
    });

  revalidatePostPublic(kind);
  redirect(`${adminPostsPath(kind)}?saved=page`);
}

export async function upsertPost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "on";
  const showDate = String(formData.get("showDate") ?? "") === "on";
  const featured = formData.get("featured") as File | null;
  const featuredExisting = readExistingImageField(formData, "featuredExisting");
  const db = getDb();

  let kind = parsePostKind(formData.get("kind"));
  let previousSlug: string | undefined;
  if (id) {
    const existing = await db
      .select({ kind: post.kind, slug: post.slug })
      .from(post)
      .where(eq(post.id, id))
      .then((r) => r[0]);
    if (!existing) redirect(adminPostsPath(kind));
    kind = parsePostKind(existing.kind);
    previousSlug = existing.slug;
  }

  if (!title || !slug || !excerpt || !content) redirect(`${adminPostsPath(kind)}?error=1`);
  const knownCategories = await listPostCategories(kind);
  const categoryRow = knownCategories.find((row) => row.name === category);
  if (!categoryRow) {
    redirect(id ? `${adminPostsPath(kind)}/${id}?error=category` : `${adminPostsPath(kind)}/new?error=category`);
  }

  const featuredImage = (await saveUpload(featured)) || (featuredExisting.trim() ? featuredExisting : null);
  const price = kind === "workshop" ? parseWorkshopPrice(formData.get("price")) : null;
  const sessionDates = kind === "workshop" ? String(formData.get("sessionDates") ?? "").trim() : "";
  const materialsNote = kind === "workshop" ? String(formData.get("materialsNote") ?? "").trim() : "";

  if (id) {
    await db
      .update(post)
      .set({
        title,
        slug,
        excerpt,
        content,
        category,
        tags,
        published,
        showDate,
        ...(published ? { publishedAt: sql`coalesce(${post.publishedAt}, now())` } : {}),
        featuredImage,
        price,
        sessionDates,
        materialsNote,
        updatedAt: now(),
      })
      .where(eq(post.id, id));
  } else {
    await db.insert(post).values({
      id: nanoid(),
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      kind,
      published,
      showDate,
      publishedAt: published ? now() : null,
      featuredImage,
      price,
      sessionDates,
      materialsNote,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  revalidatePostPublic(kind, slug, previousSlug);
  redirect(id ? `${adminPostsPath(kind)}/${id}?saved=1` : adminPostsPath(kind));
}

async function revalidatePostById(postId: string, fallbackSlug?: string) {
  const row = await getDb()
    .select({ slug: post.slug, kind: post.kind })
    .from(post)
    .where(eq(post.id, postId))
    .then((r) => r[0]);
  const kind = parsePostKind(row?.kind);
  const slug = row?.slug ?? fallbackSlug ?? "";
  revalidatePostPublic(kind, slug);
  redirect(`${adminPostsPath(kind)}/${postId}`);
}

export async function addPostGalleryImage(formData: FormData) {
  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) redirect("/admin/posts");

  const existingPost = await getDb()
    .select({ slug: post.slug, kind: post.kind })
    .from(post)
    .where(eq(post.id, postId))
    .then((r) => r[0]);
  if (!existingPost) redirect("/admin/posts");
  const kind = parsePostKind(existingPost.kind);

  const file = formData.get("image") as File | null;
  const image = (await saveUpload(file, existingPost.slug)) || readExistingImageField(formData, "imageExisting");
  if (!image) redirect(`${adminPostsPath(kind)}/${postId}?error=gallery`);

  const caption = String(formData.get("caption") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim() || caption || "Gallery image";

  let imageWidth: number | null = null;
  let imageHeight: number | null = null;
  if (file && file.size > 0) {
    const dim = measureImageBuffer(Buffer.from(await file.arrayBuffer()));
    imageWidth = dim?.width ?? null;
    imageHeight = dim?.height ?? null;
  } else if (image.startsWith("/")) {
    const dim = await measureImageSrc(image);
    imageWidth = dim?.width ?? null;
    imageHeight = dim?.height ?? null;
  }

  const db = getDb();
  const rows = await db
    .select({ sortOrder: postGalleryImage.sortOrder })
    .from(postGalleryImage)
    .where(eq(postGalleryImage.postId, postId));
  const nextOrder = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sortOrder)) + 1;
  const t = now();
  await db.insert(postGalleryImage).values({
    id: nanoid(),
    postId,
    sortOrder: nextOrder,
    image,
    alt,
    caption,
    imageWidth,
    imageHeight,
    createdAt: t,
    updatedAt: t,
  });
  await revalidatePostById(postId);
}

export async function savePostGalleryImage(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const postId = String(formData.get("postId") ?? "").trim();
  if (!id || !postId) redirect("/admin/posts");

  const caption = String(formData.get("caption") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim() || caption || "Gallery image";
  await getDb()
    .update(postGalleryImage)
    .set({ caption, alt, updatedAt: now() })
    .where(eq(postGalleryImage.id, id));
  await revalidatePostById(postId);
}

export async function deletePostGalleryImage(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const postId = String(formData.get("postId") ?? "").trim();
  if (!id || !postId) redirect("/admin/posts");
  await getDb().delete(postGalleryImage).where(eq(postGalleryImage.id, id));
  await revalidatePostById(postId);
}

export async function reorderPostGalleryImage(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const postId = String(formData.get("postId") ?? "").trim();
  const dir = String(formData.get("dir") ?? "");
  const kindRow = postId
    ? await getDb()
        .select({ kind: post.kind })
        .from(post)
        .where(eq(post.id, postId))
        .then((r) => r[0])
    : null;
  const editPath = postId ? `${adminPostsPath(parsePostKind(kindRow?.kind))}/${postId}` : "/admin/posts";
  if (!id || !postId || (dir !== "up" && dir !== "down")) redirect(editPath);

  const items = await listPostGalleryImages(postId);
  const idx = items.findIndex((row) => row.id === id);
  if (idx === -1) redirect(editPath);
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) redirect(editPath);

  const ordered = swapOrderedIds(
    items.map((row) => row.id),
    idx,
    swapWith,
  );
  const db = getDb();
  const t = now();
  for (let i = 0; i < ordered.length; i++) {
    await db
      .update(postGalleryImage)
      .set({ sortOrder: i, updatedAt: t })
      .where(eq(postGalleryImage.id, ordered[i]!));
  }
  await revalidatePostById(postId);
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const kindFromForm = parsePostKind(formData.get("kind"));
  if (!id) redirect(adminPostsPath(kindFromForm));
  const existing = await getDb()
    .select({ slug: post.slug, kind: post.kind })
    .from(post)
    .where(eq(post.id, id))
    .then((r) => r[0]);
  const kind = parsePostKind(existing?.kind ?? kindFromForm);
  await getDb().delete(post).where(eq(post.id, id));
  revalidatePostPublic(kind, existing?.slug);
  redirect(adminPostsPath(kind));
}

/** Hide a post or workshop from the public site (or show it again) without opening the editor. */
export async function setPostVisibility(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const visible = formData.get("visible") === "1";
  const kindFromForm = parsePostKind(formData.get("kind"));
  if (!id) redirect(adminPostsPath(kindFromForm));
  const db = getDb();
  const existing = await db
    .select({ slug: post.slug, kind: post.kind })
    .from(post)
    .where(eq(post.id, id))
    .then((r) => r[0]);
  if (!existing) redirect(adminPostsPath(kindFromForm));
  const kind = parsePostKind(existing.kind);
  await db
    .update(post)
    .set({
      published: visible,
      ...(visible ? { publishedAt: sql`coalesce(${post.publishedAt}, now())` } : {}),
    })
    .where(eq(post.id, id));
  revalidatePostPublic(kind, existing.slug);
  redirect(`${adminPostsPath(kind)}?saved=${visible ? "shown" : "hidden"}`);
}

export async function markContactMessageRead(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/contact");
  await getDb()
    .update(contactMessage)
    .set({ readAt: new Date() })
    .where(eq(contactMessage.id, id));
  revalidatePath("/admin");
  revalidatePath("/admin/contact");
  redirect("/admin/contact");
}

export async function deleteContactMessage(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/contact");
  await getDb().delete(contactMessage).where(eq(contactMessage.id, id));
  revalidatePath("/admin");
  revalidatePath("/admin/contact");
  redirect("/admin/contact");
}

export async function markWorkshopInquiryRead(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/workshop-inquiries");
  await getDb()
    .update(workshopInquiry)
    .set({ readAt: new Date() })
    .where(eq(workshopInquiry.id, id));
  revalidatePath("/admin");
  revalidatePath("/admin/workshop-inquiries");
  revalidatePath("/admin/workshops");
  redirect("/admin/workshop-inquiries");
}

export async function deleteWorkshopInquiry(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/workshop-inquiries");
  await getDb().delete(workshopInquiry).where(eq(workshopInquiry.id, id));
  revalidatePath("/admin");
  revalidatePath("/admin/workshop-inquiries");
  revalidatePath("/admin/workshops");
  redirect("/admin/workshop-inquiries");
}

async function revalidatePostTaxonomy(kind: PostKind) {
  revalidatePostPublic(kind);
}

export async function addPostCategory(formData: FormData) {
  const kind = parsePostKind(formData.get("kind"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`${adminPostsPath(kind)}?error=category-name`);

  const db = getDb();
  const rows = await listPostCategories(kind);
  if (rows.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
    redirect(`${adminPostsPath(kind)}?error=category-exists`);
  }

  const allSlugs = await db.select({ slug: postCategory.slug }).from(postCategory);
  let slug = slugifyPostCategory(name);
  const slugs = new Set(allSlugs.map((row) => row.slug));
  if (slugs.has(slug)) {
    let n = 2;
    while (slugs.has(`${slug}-${n}`)) n += 1;
    slug = `${slug}-${n}`;
  }

  const nextOrder = rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.sortOrder)) + 1;
  await db.insert(postCategory).values({
    id: nanoid(),
    name,
    slug,
    kind,
    sortOrder: nextOrder,
    createdAt: now(),
  });
  await revalidatePostTaxonomy(kind);
  redirect(`${adminPostsPath(kind)}?saved=category`);
}

export async function savePostCategory(formData: FormData) {
  const kindFromForm = parsePostKind(formData.get("kind"));
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) redirect(`${adminPostsPath(kindFromForm)}?error=category-name`);

  const db = getDb();
  const current = await db.select().from(postCategory).where(eq(postCategory.id, id)).then((r) => r[0]);
  if (!current) redirect(adminPostsPath(kindFromForm));
  const kind = parsePostKind(current.kind);

  const others = (await listPostCategories(kind)).filter((row) => row.id !== id);
  if (others.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
    redirect(`${adminPostsPath(kind)}?error=category-exists`);
  }

  const allOthers = await db.select({ id: postCategory.id, slug: postCategory.slug }).from(postCategory);
  let slug = slugifyPostCategory(name);
  const slugs = new Set(allOthers.filter((row) => row.id !== id).map((row) => row.slug));
  if (slugs.has(slug)) {
    let n = 2;
    while (slugs.has(`${slug}-${n}`)) n += 1;
    slug = `${slug}-${n}`;
  }

  await db.update(postCategory).set({ name, slug }).where(eq(postCategory.id, id));
  if (current.name !== name) {
    await db
      .update(post)
      .set({ category: name, updatedAt: now() })
      .where(and(eq(post.category, current.name), eq(post.kind, kind)));
  }
  await revalidatePostTaxonomy(kind);
  redirect(`${adminPostsPath(kind)}?saved=category`);
}

export async function deletePostCategory(formData: FormData) {
  const kindFromForm = parsePostKind(formData.get("kind"));
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(adminPostsPath(kindFromForm));
  const db = getDb();
  const current = await db.select().from(postCategory).where(eq(postCategory.id, id)).then((r) => r[0]);
  if (!current) redirect(adminPostsPath(kindFromForm));
  const kind = parsePostKind(current.kind);
  const inUse = await db
    .select({ id: post.id })
    .from(post)
    .where(and(eq(post.category, current.name), eq(post.kind, kind)))
    .then((r) => r[0]);
  if (inUse) redirect(`${adminPostsPath(kind)}?error=category-in-use`);
  await db.delete(postCategory).where(eq(postCategory.id, id));
  await revalidatePostTaxonomy(kind);
  redirect(`${adminPostsPath(kind)}?saved=category`);
}

export async function reorderPostCategory(formData: FormData) {
  const kindFromForm = parsePostKind(formData.get("kind"));
  const id = String(formData.get("id") ?? "").trim();
  const dir = String(formData.get("dir") ?? "");
  if (!id || (dir !== "up" && dir !== "down")) redirect(adminPostsPath(kindFromForm));

  const items = await listPostCategories(kindFromForm);
  const idx = items.findIndex((row) => row.id === id);
  if (idx === -1) redirect(adminPostsPath(kindFromForm));
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) redirect(adminPostsPath(kindFromForm));

  const ordered = swapOrderedIds(
    items.map((row) => row.id),
    idx,
    swapWith,
  );
  const db = getDb();
  for (let i = 0; i < ordered.length; i++) {
    await db.update(postCategory).set({ sortOrder: i }).where(eq(postCategory.id, ordered[i]!));
  }
  await revalidatePostTaxonomy(kindFromForm);
  redirect(`${adminPostsPath(kindFromForm)}?saved=category`);
}
