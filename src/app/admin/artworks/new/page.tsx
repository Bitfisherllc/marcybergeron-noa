import { upsertArtwork } from "@/app/admin/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLink, adminBtnPrimary } from "@/components/AdminLink";
import { AdminMediumGalleryField } from "@/components/AdminMediumGalleryField";
import { AdminPortfolioSeriesField } from "@/components/AdminPortfolioSeriesField";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { getSeriesById, listMediumGalleries, listPortfolioSeries } from "@/lib/queries";

export default async function NewArtworkPage({
  searchParams,
}: {
  searchParams: Promise<{ gallery?: string }>;
}) {
  const { gallery: contextSeriesId } = await searchParams;
  const [portfolioSeries, mediumGalleries, contextSeries] = await Promise.all([
    listPortfolioSeries(),
    listMediumGalleries(),
    contextSeriesId ? getSeriesById(contextSeriesId) : Promise.resolve(null),
  ]);

  const isMediumContext = contextSeries ? isMediumGallerySlug(contextSeries.slug) : false;
  const defaultMediumId = isMediumContext ? contextSeries!.id : null;
  const defaultPortfolioIds = contextSeries && !isMediumContext ? [contextSeries.id] : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Artwork</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Add artwork</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          {contextSeries ? (
            <>
              Adding to{" "}
              <AdminLink href={`/admin/series/${contextSeries.id}`}>{contextSeries.title}</AdminLink>. Choose a
              portfolio series, a medium gallery, or both.
            </>
          ) : (
            <>Upload a new painting and assign it to a portfolio series, a medium gallery, or both.</>
          )}
        </p>
      </div>

      <form action={upsertArtwork} className="max-w-3xl space-y-5 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value="" />
        {contextSeries ? <input type="hidden" name="contextSeriesId" value={contextSeries.id} /> : null}

        <label className="block text-sm text-muted">
          Title
          <input name="title" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>

        <AdminPortfolioSeriesField series={portfolioSeries} selectedIds={defaultPortfolioIds} />
        <AdminMediumGalleryField galleries={mediumGalleries} value={defaultMediumId} />

        <fieldset className="space-y-3">
          <legend className="text-sm text-muted">Material and size</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-muted">
              Material
              <input name="medium" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Size
              <input name="size" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Shown under the title on the public gallery page (e.g. Oil &amp; cold wax on board · 20&quot; × 20&quot;).
          </p>
        </fieldset>

        <label className="block text-sm text-muted">
          Alt text
          <span className="font-normal text-muted/80"> (optional — screen readers only)</span>
          <input name="alt" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>

        <label className="block text-sm text-muted">
          Description
          <span className="font-normal text-muted/80"> (optional)</span>
          <textarea name="description" rows={4} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Status
            <select name="status" defaultValue="unknown" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm">
              <option value="unknown">Unknown</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
          </label>
          <label className="block text-sm text-muted">
            Sort order
            <input name="sortOrder" defaultValue="0" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>

        <AdminFilePicker name="image" label="Image" buttonLabel="Upload image" required />

        <div className="flex flex-wrap gap-3 border-t border-line pt-6">
          <button className={adminBtnPrimary} type="submit">
            Save artwork
          </button>
          <AdminLink variant="back" href={contextSeries ? `/admin/series/${contextSeries.id}` : "/admin/series"}>
            Back
          </AdminLink>
        </div>
      </form>
    </div>
  );
}
