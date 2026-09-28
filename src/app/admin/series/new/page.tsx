import { upsertSeries } from "@/app/admin/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLink, adminBtnPrimary } from "@/components/AdminLink";
import { AdminSeriesMediumField } from "@/components/AdminSeriesMediumField";
import { publicPortfolioGalleries } from "@/lib/mediumGalleries";
import { listMediumGalleries } from "@/lib/queries";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Add a title for the series.",
  slug: "That URL slug is already used by another gallery. Choose a different one.",
  medium: "Choose which medium this series belongs to.",
};

export default async function NewSeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; medium?: string }>;
}) {
  const sp = await searchParams;
  const mediums = publicPortfolioGalleries(await listMediumGalleries());
  const error = sp.error ? (ERROR_MESSAGES[sp.error] ?? "Something went wrong. Try again.") : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Add a series</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          A series is a distinct body of work within a medium. It is listed on the medium’s page, under that
          medium’s gallery—the same way the series appear on Oil and Cold Wax.
        </p>
      </div>
      {error ? (
        <p className="border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-900">{error}</p>
      ) : null}
      <form action={upsertSeries} className="space-y-6 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value="" />
        <AdminSeriesMediumField mediums={mediums} value={sp.medium} />
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Title
            <input name="title" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            URL slug (optional)
            <input
              name="slug"
              placeholder="Created from the title if left empty"
              className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm text-muted">
          Listing excerpt
          <textarea name="excerpt" rows={3} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          <span className="mt-2 block text-xs">Shown on the series card on the medium’s page.</span>
        </label>
        <label className="block text-sm text-muted">
          About (Markdown)
          <textarea name="content" rows={8} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          <span className="mt-2 block text-xs">Shown under the title on the series page.</span>
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Sort order
            <input name="sortOrder" defaultValue="0" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            <span className="mt-2 block text-xs">Lower numbers appear first among this medium’s series.</span>
          </label>
          <AdminFilePicker name="featured" label="Series card image (optional)" buttonLabel="Upload image" />
        </div>
        <p className="text-xs text-muted">
          After creating the series you can add paintings to it. Until then, the card uses a placeholder image.
        </p>
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
