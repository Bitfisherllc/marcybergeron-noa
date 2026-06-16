"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { artwork, post, series } from "@/db/schema";
import { getDb } from "@/db";
import { createAdminSession, destroyAdminSession, verifyAdminPassword } from "@/lib/auth";
import { saveUpload } from "@/lib/save-upload";

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

export async function upsertSeries(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0")) || 0;
  const featured = formData.get("featured") as File | null;

  if (!slug || !title || !excerpt) redirect("/admin/series?error=1");

  const db = getDb();
  const featuredImage = (await saveUpload(featured, slug)) ?? String(formData.get("featuredExisting") ?? "");

  if (!featuredImage) redirect("/admin/series?error=missing-image");

  if (id) {
    await db
      .update(series)
      .set({ slug, title, excerpt, content, featuredImage, sortOrder, updatedAt: now() })
      .where(eq(series.id, id));
  } else {
    await db.insert(series).values({
      id: nanoid(),
      slug,
      title,
      excerpt,
      content,
      featuredImage,
      sortOrder,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  revalidatePath("/");
  revalidatePath("/art");
  revalidatePath(`/art/${slug}`);
  redirect("/admin/series");
}

export async function deleteSeries(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/series");
  await getDb().delete(series).where(eq(series.id, id));
  revalidatePath("/");
  revalidatePath("/art");
  redirect("/admin/series");
}

export async function upsertArtwork(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const medium = String(formData.get("medium") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const year = String(formData.get("year") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "unknown").trim();
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0")) || 0;
  const imageFile = formData.get("image") as File | null;
  const existingImage = String(formData.get("imageExisting") ?? "");

  if (!seriesId) redirect("/admin/series");
  if (!title) redirect(`/admin/series/${seriesId}`);

  const db = getDb();
  const s = await db.select().from(series).where(eq(series.id, seriesId)).then((r) => r[0]);
  if (!s) redirect("/admin/series");

  const image = (await saveUpload(imageFile, s.slug)) || existingImage;
  if (!image) redirect(`/admin/series/${seriesId}`);

  const alt = String(formData.get("alt") ?? "").trim() || `${title} — ${[medium, size, year].filter(Boolean).join(" · ")}`;

  if (id) {
    await db
      .update(artwork)
      .set({ title, medium, size, year, description, image, alt, status, sortOrder, updatedAt: now() })
      .where(eq(artwork.id, id));
  } else {
    await db.insert(artwork).values({
      id: nanoid(),
      seriesId,
      title,
      medium,
      size,
      year,
      description,
      image,
      alt,
      status,
      sortOrder,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  revalidatePath("/");
  revalidatePath("/art");
  revalidatePath(`/art/${s.slug}`);
  redirect(`/admin/series/${seriesId}`);
}

export async function deleteArtwork(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const seriesId = String(formData.get("seriesId") ?? "");
  if (!id || !seriesId) redirect("/admin/series");
  const s = await getDb().select().from(series).where(eq(series.id, seriesId)).then((r) => r[0]);
  await getDb().delete(artwork).where(eq(artwork.id, id));
  revalidatePath("/art");
  if (s) revalidatePath(`/art/${s.slug}`);
  redirect(`/admin/series/${seriesId}`);
}

export async function reorderArtwork(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const seriesId = String(formData.get("seriesId") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || !seriesId || (dir !== "up" && dir !== "down")) redirect(`/admin/series/${seriesId}`);

  const db = getDb();
  const items = await db
    .select()
    .from(artwork)
    .where(eq(artwork.seriesId, seriesId))
    .orderBy(asc(artwork.sortOrder), asc(artwork.title));

  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) redirect(`/admin/series/${seriesId}`);
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) redirect(`/admin/series/${seriesId}`);

  const a = items[idx]!;
  const b = items[swapWith]!;
  await db.update(artwork).set({ sortOrder: b.sortOrder, updatedAt: now() }).where(eq(artwork.id, a.id));
  await db.update(artwork).set({ sortOrder: a.sortOrder, updatedAt: now() }).where(eq(artwork.id, b.id));

  const s = await db.select().from(series).where(eq(series.id, seriesId)).then((r) => r[0]);
  revalidatePath("/art");
  if (s) revalidatePath(`/art/${s.slug}`);
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
  const featuredExisting = String(formData.get("featuredExisting") ?? "");

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
