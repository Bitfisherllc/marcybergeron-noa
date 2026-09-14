import Image from "next/image";
import { notFound, redirect } from "next/navigation";
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
import { AdminPostCategorySelect } from "@/components/AdminPostCategorySelect";
import { getDb } from "@/db";
import { post } from "@/db/schema";
import { listPostCategories, listPostGalleryImages } from "@/lib/queries";
import { parsePostKind, postAdminBasePath, postKindCopy, postPublicHref, type PostKind } from "@/lib/postKind";
import { DEFAULT_WORKSHOP_PRICE } from "@/lib/workshopPrice";
import { eq } from "drizzle-orm";

async function getPostById(id: string) {
  const rows = await getDb().select().from(post).where(eq(post.id, id));
  return rows[0] ?? null;
}

export async function AdminPostNew({
  kind,
  searchParams,
}: {
  kind: PostKind;
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const copy = postKindCopy(kind);
  const adminBase = postAdminBasePath(kind);
  const categories = await listPostCategories(kind);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">{copy.adminNew}</h1>
        <p className="mt-3 text-sm text-muted">{copy.adminUrlHint}</p>
        {sp.error === "category" ? (
          <p className="mt-3 text-sm text-red-700">Choose a category from the list.</p>
        ) : null}
      </div>

      <form action={upsertPost} className="space-y-6 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value="" />
        <input type="hidden" name="kind" value={kind} />
        <AdminPostFields categories={categories} kind={kind} />
        <p className="text-sm text-muted">
          After you save, open the {kind === "workshop" ? "workshop" : "post"} again to add a lightbox gallery under
          the article.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className={adminBtnPrimary} type="submit">
            {copy.adminSave}
          </button>
          <AdminLink variant="back" href={adminBase}>
            Back
          </AdminLink>
        </div>
      </form>
    </div>
  );
}

export async function AdminPostEdit({
  kind,
  id,
  searchParams,
}: {
  kind: PostKind;
  id: string;
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const p = await getPostById(id);
  if (!p) notFound();
  const postKind = parsePostKind(p.kind);
  if (postKind !== kind) {
    redirect(`${postAdminBasePath(postKind)}/${p.id}`);
  }

  const copy = postKindCopy(kind);
  const adminBase = postAdminBasePath(kind);
  const [gallery, categories] = await Promise.all([listPostGalleryImages(p.id), listPostCategories(kind)]);
  const gallerySlides = gallery.map((img, i) => ({
    src: img.image,
    alt: img.alt || img.caption || `Gallery image ${i + 1}`,
    caption: img.caption || undefined,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">{copy.adminEdit}</h1>
        <p className="mt-3 text-sm text-muted">
          Public URL: <span className="text-ink/80">{postPublicHref(kind, p.slug)}</span>
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
        <input type="hidden" name="kind" value={kind} />
        <AdminPostFields
          categories={categories}
          kind={kind}
          defaults={{
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            content: p.content,
            category: p.category,
            tags: p.tags,
            published: p.published,
            showDate: p.showDate,
            featuredImage: p.featuredImage,
            price: p.price,
            sessionDates: p.sessionDates,
            materialsNote: p.materialsNote,
          }}
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
            {copy.adminSave}
          </button>
          <AdminLink variant="back" href={adminBase}>
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

function AdminPostFields({
  categories,
  kind,
  defaults,
}: {
  categories: Awaited<ReturnType<typeof listPostCategories>>;
  kind: PostKind;
  defaults?: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string;
    published: boolean;
    showDate: boolean;
    featuredImage: string | null;
    price: number | null;
    sessionDates: string;
    materialsNote: string;
  };
}) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block text-sm text-muted">
          Title
          <input
            name="title"
            required
            defaultValue={defaults?.title}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-muted">
          Slug
          <input
            name="slug"
            required
            defaultValue={defaults?.slug}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block text-sm text-muted">
        Excerpt
        <textarea
          name="excerpt"
          required
          rows={3}
          defaultValue={defaults?.excerpt}
          className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm text-muted">
        Content (Markdown)
        <textarea
          name="content"
          required
          rows={14}
          defaultValue={defaults?.content}
          className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
        />
      </label>
      <div className="grid gap-6 md:grid-cols-2">
        <AdminPostCategorySelect categories={categories} defaultValue={defaults?.category} />
        <label className="block text-sm text-muted">
          Tags{defaults ? "" : " (comma-separated)"}
          <input
            name="tags"
            defaultValue={defaults?.tags}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
      </div>
      {kind === "workshop" ? (
        <>
          <label className="block text-sm text-muted">
            Cost (USD)
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={defaults?.price ?? DEFAULT_WORKSHOP_PRICE}
              className="mt-2 w-full max-w-xs border border-line bg-paper px-3 py-2 text-sm"
            />
            <span className="mt-2 block text-xs leading-relaxed text-muted">
              Defaults to ${DEFAULT_WORKSHOP_PRICE}. Change it for this workshop only. Use 0 for free.
            </span>
          </label>
          <label className="block text-sm text-muted">
            Offering dates
            <textarea
              name="sessionDates"
              rows={4}
              defaultValue={defaults?.sessionDates}
              placeholder="One date per line. Leave blank for TBA."
              className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
            />
            <span className="mt-2 block text-xs leading-relaxed text-muted">
              If this is empty, the site shows Dates TBA.
            </span>
          </label>
          <label className="block text-sm text-muted">
            Materials note (optional)
            <input
              name="materialsNote"
              defaultValue={defaults?.materialsNote}
              placeholder="Leave blank if all materials are included."
              className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
            />
            <span className="mt-2 block text-xs leading-relaxed text-muted">
              Leave blank to use “Workshops include all materials unless otherwise noted.”
            </span>
          </label>
        </>
      ) : null}
      <label className="flex items-center gap-3 text-sm text-muted">
        <input name="published" type="checkbox" defaultChecked={defaults?.published} className="h-4 w-4" />
        Published
      </label>
      <label className="flex items-center gap-3 text-sm text-muted">
        <input name="showDate" type="checkbox" defaultChecked={defaults?.showDate} className="h-4 w-4" />
        Show publish date on site
      </label>
      <AdminFilePicker
        name="featured"
        label="Add image"
        buttonLabel="Upload image"
        existingValue={defaults?.featuredImage ?? ""}
      />
    </>
  );
}
