"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { artwork, contactMessage, post, series } from "@/db/schema";
import { getDb } from "@/db";
import {
  getArtworkPortfolioSeriesIds,
  parsePortfolioSeriesIdsFromForm,
  resolveArtworkAssignment,
  setArtworkPortfolioSeriesIds,
} from "@/lib/artworkMembership";
import { createAdminSession, destroyAdminSession, requireAdminSession, verifyAdminPassword } from "@/lib/auth";
import { readExistingImageField } from "@/lib/resolveAdminImage";
import { saveUpload } from "@/lib/save-upload";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { generatePrivateGalleryAccessToken } from "@/lib/privateGalleries";
import { getSeriesById, listArtworksForMediumGallery, listArtworksForSeries } from "@/lib/queries";
import {
  getSeriesDeleteImpact,
  reassignArtworksBeforeSeriesDelete,
  type SeriesDeleteReassignType,
} from "@/lib/seriesDelete";

export async function loginAction(formData: FormData) {
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
  revalidatePath("/");
  revalidatePath("/art");
  revalidatePath("/medium");
  revalidatePath("/art/all-work");

  const portfolioIds = new Set([...portfolioSeriesIds, ...(previousPortfolioSeriesIds ?? [])]);
  for (const id of portfolioIds) {
    const s = await getSeriesById(id);
    if (s) revalidatePath(`/art/${s.slug}`);
  }

  const mediumIds = new Set<string>();
  if (mediumSeriesId) mediumIds.add(mediumSeriesId);
  if (previousMediumSeriesId) mediumIds.add(previousMediumSeriesId);

  for (const id of mediumIds) {
    const m = await getSeriesById(id);
    if (m) revalidatePath(`/art/${m.slug}`);
  }
}

export async function upsertSeries(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0")) || 0;
  const privacyField = formData.get("isPrivate");
  const featured = formData.get("featured") as File | null;

  if (!slug || !title) redirect("/admin/series?error=1");

  const db = getDb();
  const existingRow = id
    ? await db
        .select({ isPrivate: series.isPrivate, accessToken: series.accessToken })
        .from(series)
        .where(eq(series.id, id))
        .then((r) => r[0])
    : null;

  const isPrivate =
    privacyField === null ? (existingRow?.isPrivate ?? false) : String(privacyField) === "on";

  const uploaded = await saveUpload(featured, slug);
  const existing = readExistingImageField(formData, "featuredExisting");
  const featuredImage = uploaded || existing || GALLERY_PLACEHOLDER_IMAGE;

  let accessToken = existingRow?.accessToken ?? null;
  if (isPrivate && !accessToken) accessToken = generatePrivateGalleryAccessToken();
  if (!isPrivate) accessToken = null;

  if (id) {
    await db
      .update(series)
      .set({
        slug,
        title,
        excerpt,
        content,
        featuredImage,
        sortOrder,
        isPrivate,
        accessToken,
        updatedAt: now(),
      })
      .where(eq(series.id, id));
  } else {
    const newId = nanoid();
    await db.insert(series).values({
      id: newId,
      slug,
      title,
      excerpt,
      content,
      featuredImage,
      sortOrder,
      isPrivate,
      accessToken,
      createdAt: now(),
      updatedAt: now(),
    });
    revalidatePath("/");
    revalidatePath("/art");
    if (isPrivate) {
      revalidatePath("/admin/series");
      redirect(`/admin/series/${newId}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/art");
  revalidatePath(`/art/${slug}`);
  if (accessToken) revalidatePath(`/private/${accessToken}`);
  redirect(id ? `/admin/series/${id}` : "/admin/series");
}

export async function setSeriesPrivacy(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const privacy = String(formData.get("privacy") ?? "");
  if (!id || (privacy !== "private" && privacy !== "public")) redirect("/admin/series");

  const db = getDb();
  const row = await db
    .select({ slug: series.slug, isPrivate: series.isPrivate, accessToken: series.accessToken })
    .from(series)
    .where(eq(series.id, id))
    .then((r) => r[0]);
  if (!row || isMediumGallerySlug(row.slug)) redirect("/admin/series");

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
  revalidatePath("/art");
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
    .select({ accessToken: series.accessToken })
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
  revalidatePath("/art");
  revalidatePath("/medium");
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
  revalidatePath("/art");
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
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0")) || 0;
  const imageFile = formData.get("image") as File | null;
  const existingImage = readExistingImageField(formData, "imageExisting");
  const mediumSeriesId = await parseMediumSeriesId(String(formData.get("mediumSeriesId") ?? ""));

  let portfolioSeriesIds = await parsePortfolioSeriesIdsFromForm(formData);
  if (contextSeriesId && !portfolioSeriesIds.includes(contextSeriesId)) {
    const context = await getSeriesById(contextSeriesId);
    if (context && !isMediumGallerySlug(context.slug)) {
      portfolioSeriesIds = [...portfolioSeriesIds, contextSeriesId];
    }
  }

  const failRedirect = contextSeriesId
    ? `/admin/series/${contextSeriesId}`
    : id
      ? `/admin/artworks/${id}`
      : `/admin/artworks/new`;
  if (!title) redirect(failRedirect);

  const assignment = await resolveArtworkAssignment(portfolioSeriesIds, mediumSeriesId);
  if (!assignment) redirect(failRedirect);

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
        status,
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
      status,
      sortOrder,
      createdAt: t,
      updatedAt: t,
    });
  }

  await setArtworkPortfolioSeriesIds(artworkId, assignment.portfolioSeriesIds);
  await revalidateArtworkPaths(
    assignment.portfolioSeriesIds,
    assignment.mediumSeriesId,
    previousMediumSeriesId,
    previousPortfolioSeriesIds,
  );

  redirect(`/admin/artworks/${artworkId}`);
}

/** Quick membership edit from a signed-in public gallery card. */
export async function updateArtworkMembershipFromSite(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/art").trim() || "/art";
  if (!id) redirect(returnPath);

  let portfolioSeriesIds = await parsePortfolioSeriesIdsFromForm(formData);
  const mediumSeriesId = await parseMediumSeriesId(String(formData.get("mediumSeriesId") ?? ""));
  const assignment = await resolveArtworkAssignment(portfolioSeriesIds, mediumSeriesId);
  if (!assignment) redirect(returnPath);

  const status = String(formData.get("status") ?? "unknown").trim();

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
      updatedAt: now(),
    })
    .where(eq(artwork.id, id));

  await setArtworkPortfolioSeriesIds(id, assignment.portfolioSeriesIds);
  await revalidateArtworkPaths(
    assignment.portfolioSeriesIds,
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
  const returnPath = String(formData.get("returnPath") ?? "/art").trim() || "/art";
  if (!id) redirect(returnPath);

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
  revalidatePath("/art/all-work");
  redirect(returnPath);
}

export async function deleteArtwork(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const contextSeriesId = String(formData.get("contextSeriesId") ?? "");
  if (!id || !contextSeriesId) redirect("/admin/series");
  const db = getDb();
  const piece = await db
    .select({ mediumSeriesId: artwork.mediumSeriesId })
    .from(artwork)
    .where(eq(artwork.id, id))
    .then((r) => r[0]);
  const portfolioSeriesIds = await getArtworkPortfolioSeriesIds(id);
  await db.delete(artwork).where(eq(artwork.id, id));
  await revalidateArtworkPaths(portfolioSeriesIds, piece?.mediumSeriesId ?? null);
  redirect(`/admin/series/${contextSeriesId}`);
}

export async function reorderArtwork(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const seriesId = String(formData.get("seriesId") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || !seriesId || (dir !== "up" && dir !== "down")) redirect(`/admin/series/${seriesId}`);

  const db = getDb();
  const gallery = await db.select().from(series).where(eq(series.id, seriesId)).then((r) => r[0]);
  if (!gallery) redirect("/admin/series");

  const items = isMediumGallerySlug(gallery.slug)
    ? await listArtworksForMediumGallery(seriesId)
    : await listArtworksForSeries(seriesId);

  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) redirect(`/admin/series/${seriesId}`);
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) redirect(`/admin/series/${seriesId}`);

  const ordered = swapOrderedIds(
    items.map((a) => a.id),
    idx,
    swapWith,
  );
  const t = now();
  for (let i = 0; i < ordered.length; i++) {
    await db.update(artwork).set({ sortOrder: i, updatedAt: t }).where(eq(artwork.id, ordered[i]!));
  }

  const s = gallery;
  const portfolioSeriesIds = isMediumGallerySlug(gallery.slug) ? [] : [seriesId];
  await revalidateArtworkPaths(portfolioSeriesIds, isMediumGallerySlug(gallery.slug) ? seriesId : null);
  redirect(`/admin/series/${seriesId}`);
}

export async function upsertPost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = String(formData.get("category") ?? "News").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "on";
  const featured = formData.get("featured") as File | null;
  const featuredExisting = readExistingImageField(formData, "featuredExisting");

  if (!title || !slug || !excerpt || !content) redirect("/admin/posts?error=1");

  const featuredImage = (await saveUpload(featured)) || (featuredExisting.trim() ? featuredExisting : null);
  const db = getDb();
  const publishedAt = published ? now() : null;

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
        publishedAt,
        featuredImage,
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
      published,
      publishedAt,
      featuredImage,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  revalidatePath("/news");
  revalidatePath(`/news/${slug}`);
  revalidatePath("/");
  redirect("/admin/posts");
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/posts");
  await getDb().delete(post).where(eq(post.id, id));
  revalidatePath("/news");
  revalidatePath("/");
  redirect("/admin/posts");
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
