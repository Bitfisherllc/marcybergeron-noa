import { upsertSeries } from "@/app/admin/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLink, adminBtnPrimary } from "@/components/AdminLink";

export default async function NewSeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ private?: string }>;
}) {
  const sp = await searchParams;
  const isPrivate = sp.private === "1";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">
          {isPrivate ? "New private gallery" : "New series"}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {isPrivate
            ? "Private galleries are shared by link only—ideal for exhibition submissions. They do not appear on the public portfolio."
            : "Slug becomes the public URL under /art/[slug]."}
        </p>
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
            <input
              name="slug"
              required
              placeholder={isPrivate ? "e.g. porter-mill-2026-submission" : undefined}
              className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm text-muted">
          Excerpt (shown at the top of the gallery)
          <textarea
            name="excerpt"
            rows={4}
            placeholder="Optional — add a short note for jurors or curators."
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
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
          <AdminFilePicker name="featured" label="Featured image (optional)" buttonLabel="Upload image" />
        </div>
        <p className="text-xs text-muted">
          If you skip the image for now, a placeholder cover is used until you upload one on the edit screen.
        </p>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="isPrivate" value="on" className="mt-1 border border-line" defaultChecked={isPrivate} />
          <span>
            <span className="font-medium text-ink">Private gallery</span> — share only via a private link. You can also
            change this later on the edit screen.
          </span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button className={adminBtnPrimary} type="submit">
            {isPrivate ? "Create private gallery" : "Create series"}
          </button>
          <AdminLink variant="back" href="/admin/series">
            Back
          </AdminLink>
        </div>
      </form>
    </div>
  );
}
