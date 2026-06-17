import { upsertSeries } from "@/app/admin/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLink, adminBtnPrimary } from "@/components/AdminLink";

export default function NewSeriesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">New series</h1>
        <p className="mt-3 text-sm text-muted">Slug becomes the public URL under /art/[slug].</p>
      </div>
      <form action={upsertSeries} className="space-y-6 border border-line bg-white/50 p-6">
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
          Excerpt (shown on Art page cards)
          <textarea name="excerpt" required rows={4} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm text-muted">
          Full statement (Markdown supported)
          <textarea name="content" rows={10} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Sort order
            <input name="sortOrder" defaultValue="0" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <AdminFilePicker name="featured" label="Add image" buttonLabel="Choose image" required />
        </div>
        <div className="flex flex-wrap gap-3">
          <button className={adminBtnPrimary} type="submit">
            Create series
          </button>
          <AdminLink variant="back" href="/admin/series">
            Back
          </AdminLink>
        </div>
      </form>
    </div>
  );
}
