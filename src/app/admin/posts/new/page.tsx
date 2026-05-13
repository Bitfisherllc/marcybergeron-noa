import { upsertPost } from "@/app/admin/actions";

export default function NewPostPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">New post</h1>
        <p className="mt-3 text-sm text-muted">Public URL becomes /news/[slug].</p>
      </div>

      <form action={upsertPost} className="space-y-6 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value="" />
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Title
            <input name="title" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Slug
            <input name="slug" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="block text-sm text-muted">
          Excerpt
          <textarea name="excerpt" required rows={3} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm text-muted">
          Content (Markdown)
          <textarea name="content" required rows={14} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Category
            <input name="category" defaultValue="News" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Tags (comma-separated)
            <input name="tags" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          <input name="published" type="checkbox" className="h-4 w-4" />
          Published
        </label>
        <label className="block text-sm text-muted">
          Featured image (optional)
          <input name="featured" type="file" accept="image/*" className="mt-2 w-full text-sm" />
        </label>
        <button className="border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase" type="submit">
          Save post
        </button>
      </form>
    </div>
  );
}
