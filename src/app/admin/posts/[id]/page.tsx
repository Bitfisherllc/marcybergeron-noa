import Image from "next/image";
import { notFound } from "next/navigation";
import { upsertPost } from "@/app/admin/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLightboxThumb } from "@/components/AdminImageLightbox";
import { AdminLink, adminBtnPrimary } from "@/components/AdminLink";
import { getDb } from "@/db";
import { post } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getPostById(id: string) {
  const rows = await getDb().select().from(post).where(eq(post.id, id));
  return rows[0] ?? null;
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPostById(id);
  if (!p) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Edit post</h1>
        <p className="mt-3 text-sm text-muted">
          Public URL: <span className="text-ink/80">/news/{p.slug}</span>
        </p>
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
          <label className="block text-sm text-muted">
            Category
            <input name="category" defaultValue={p.category} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Tags
            <input name="tags" defaultValue={p.tags} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          <input name="published" type="checkbox" defaultChecked={p.published} className="h-4 w-4" />
          Published
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
    </div>
  );
}
