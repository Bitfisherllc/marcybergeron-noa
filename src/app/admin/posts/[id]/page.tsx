import Image from "next/image";
import { notFound } from "next/navigation";
import {
  addPostGalleryImage,
  deletePostGalleryImage,
  reorderPostGalleryImage,
  savePostGalleryImage,
  upsertPost,
} from "@/app/admin/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLightboxProvider, AdminLightboxThumb, AdminLightboxTrigger } from "@/components/AdminImageLightbox";
import { AdminLink, adminBtnDanger, adminBtnPrimary } from "@/components/AdminLink";
import { AdminReorderButtons } from "@/components/AdminReorderButtons";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { getDb } from "@/db";
import { post } from "@/db/schema";
import { AdminPostCategorySelect } from "@/components/AdminPostCategorySelect";
import { listPostCategories, listPostGalleryImages } from "@/lib/queries";
import { eq } from "drizzle-orm";

async function getPostById(id: string) {
  const rows = await getDb().select().from(post).where(eq(post.id, id));
  return rows[0] ?? null;
}

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await getPostById(id);
  if (!p) notFound();
  const [gallery, categories] = await Promise.all([listPostGalleryImages(p.id), listPostCategories()]);
  const gallerySlides = gallery.map((img, i) => ({
    src: img.image,
    alt: img.alt || img.caption || `Gallery image ${i + 1}`,
    caption: img.caption || undefined,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Edit post</h1>
        <p className="mt-3 text-sm text-muted">
          Public URL: <span className="text-ink/80">/news/{p.slug}</span>
        </p>
        {sp.error === "gallery" ? (
          <p className="mt-3 text-sm text-red-700">Choose an image to add to the gallery.</p>
        ) : null}
        {sp.error === "category" ? (
          <p className="mt-3 text-sm text-red-700">Choose a category from the list.</p>
        ) : null}
      </div>

      <form action={upsertPost} className="space-y-6 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value={p.id} />
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Title
            <input name="title" required defaultValue={p.title} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Slug
            <input name="slug" required defaultValue={p.slug} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="block text-sm text-muted">
          Excerpt
          <textarea name="excerpt" required rows={3} defaultValue={p.excerpt} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm text-muted">
          Content (Markdown)
          <textarea name="content" required rows={14} defaultValue={p.content} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <AdminPostCategorySelect categories={categories} defaultValue={p.category} />
          <label className="block text-sm text-muted">
            Tags
            <input name="tags" defaultValue={p.tags} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          <input name="published" type="checkbox" defaultChecked={p.published} className="h-4 w-4" />
          Published
        </label>
        <label className="flex items-center gap-3 text-sm text-muted">
          <input name="showDate" type="checkbox" defaultChecked={p.showDate} className="h-4 w-4" />
          Show publish date on site
        </label>
        <AdminFilePicker
          name="featured"
          label="Add image"
          buttonLabel="Upload image"
          existingValue={p.featuredImage ?? ""}
        />
        {p.featuredImage ? (
          <AdminLightboxThumb src={p.featuredImage} alt={p.title} caption={`${p.title} — featured image`}>
            <div className="relative h-28 w-44 overflow-hidden border border-line bg-black/[0.03]">
              <Image src={p.featuredImage} alt="" fill className="object-cover" />
            </div>
          </AdminLightboxThumb>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button className={adminBtnPrimary} type="submit">
            Save post
          </button>
          <AdminLink variant="back" href="/admin/posts">
            Back
          </AdminLink>
        </div>
      </form>

      <div className="border border-line bg-white/50 p-6">
        <h2 className="font-serif text-xl tracking-tight">Lightbox gallery</h2>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Images here appear under the article, above the next-article slider. Visitors can click any image to view it
          larger and browse with arrows.
        </p>
        <form action={addPostGalleryImage} className="mt-6 space-y-4 border-t border-line pt-6">
          <input type="hidden" name="postId" value={p.id} />
          <AdminFilePicker name="image" label="Add gallery image" buttonLabel="Upload image" />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-muted">
              Caption (optional)
              <input name="caption" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Alt text (optional)
              <input name="alt" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <button className={adminBtnPrimary} type="submit">
            Add to gallery
          </button>
        </form>
        {gallery.length > 0 ? (
          <AdminLightboxProvider slides={gallerySlides}>
            <ul className="mt-6 space-y-4 border-t border-line pt-6">
              {gallery.map((img, i) => (
                <li
                  key={img.id}
                  className="flex flex-wrap items-start gap-4 border-b border-line/80 pb-6 last:border-b-0 last:pb-0"
                >
                  <AdminLightboxTrigger index={i} label={`View gallery image ${i + 1}`}>
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-black/[0.04]">
                      <Image src={img.image} alt="" fill className="object-cover" sizes="96px" />
                    </div>
                  </AdminLightboxTrigger>
                  <form id={`post-gallery-${img.id}`} action={savePostGalleryImage} className="min-w-0 flex-1 space-y-3">
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="postId" value={p.id} />
                    <div className="text-xs text-muted">Image {i + 1}</div>
                    <label className="block text-sm text-muted">
                      Caption
                      <input
                        name="caption"
                        defaultValue={img.caption}
                        className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
                      />
                    </label>
                    <label className="block text-sm text-muted">
                      Alt text
                      <input
                        name="alt"
                        defaultValue={img.alt}
                        className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
                      />
                    </label>
                    <AdminDirtySave formId={`post-gallery-${img.id}`} />
                  </form>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 self-start pt-6">
                    <AdminReorderButtons
                      action={reorderPostGalleryImage}
                      fields={{ id: img.id, postId: p.id }}
                      disableUp={i === 0}
                      disableDown={i === gallery.length - 1}
                    />
                    <form action={deletePostGalleryImage}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="postId" value={p.id} />
                      <button type="submit" className={adminBtnDanger}>
                        Remove
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </AdminLightboxProvider>
        ) : (
          <p className="mt-6 text-sm text-muted">No gallery images yet.</p>
        )}
      </div>
    </div>
  );
}
