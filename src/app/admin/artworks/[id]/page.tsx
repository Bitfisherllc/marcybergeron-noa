import Image from "next/image";
import { notFound } from "next/navigation";
import { deleteArtwork, upsertArtwork } from "@/app/admin/actions";
import { ArtCaption, captionSubtitle } from "@/components/ArtCaption";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLightboxThumb } from "@/components/AdminImageLightbox";
import { AdminLink, adminBtnDanger } from "@/components/AdminLink";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { AdminMediumGalleryField } from "@/components/AdminMediumGalleryField";
import { AdminPortfolioSeriesField } from "@/components/AdminPortfolioSeriesField";
import { getArtworkPortfolioOnlySeriesIds, getArtworkPortfolioSeriesIds } from "@/lib/artworkMembership";
import { resolveMediumSeriesId, isMediumGallerySlug } from "@/lib/mediumGalleries";
import { getArtwork, getSeriesById, listMediumGalleries, listPortfolioSeries } from "@/lib/queries";

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getArtwork(id);
  if (!a) notFound();
  const [portfolioSeries, mediumGalleries, selectedSeriesIds, storageSeries] = await Promise.all([
    listPortfolioSeries(),
    listMediumGalleries(),
    getArtworkPortfolioOnlySeriesIds(a.id),
    getSeriesById(a.seriesId),
  ]);
  if (!storageSeries) notFound();

  const mediumAssignment = resolveMediumSeriesId(a, isMediumGallerySlug(storageSeries.slug) ? null : storageSeries);
  const contextSeriesId = selectedSeriesIds[0] ?? mediumAssignment ?? a.seriesId;
  const backHref = selectedSeriesIds[0]
    ? `/admin/series/${selectedSeriesIds[0]}`
    : mediumAssignment
      ? `/admin/series/${mediumAssignment}`
      : `/admin/series/${a.seriesId}`;

  const liveSubtitle = captionSubtitle({ medium: a.medium, size: a.size });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Artwork</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">{a.title}</h1>
        <p className="mt-3 text-sm text-muted">
          Portfolio series:{" "}
          {selectedSeriesIds.length > 0 ? (
            selectedSeriesIds.map((id, i) => {
              const ser = portfolioSeries.find((s) => s.id === id);
              if (!ser) return null;
              return (
                <span key={id}>
                  {i > 0 ? ", " : null}
                  <AdminLink href={`/admin/series/${ser.id}`}>{ser.title}</AdminLink>
                </span>
              );
            })
          ) : mediumAssignment ? (
            <span className="text-muted">None — listed under medium only</span>
          ) : (
            <span className="text-muted">None</span>
          )}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AdminLightboxThumb src={a.image} alt={a.alt || a.title} caption={a.title}>
            <div className="relative aspect-[3/4] overflow-hidden border border-line bg-black/[0.03]">
              <Image src={a.image} alt="" fill className="object-cover" />
            </div>
          </AdminLightboxThumb>
            <div className="mt-4 border border-line bg-white/35 p-4">
              <p className="text-[0.65rem] tracking-[0.2em] text-muted uppercase">Live site preview</p>
              <ArtCaption as="div" title={a.title} subtitle={liveSubtitle || "—"} status={a.status} />
              {a.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted">{a.description}</p>
              ) : null}
            </div>
        </div>

        <div className="lg:col-span-7">
          <form id="artwork-edit" action={upsertArtwork} className="space-y-5 border border-line bg-white/50 p-6">
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="contextSeriesId" value={contextSeriesId} />

            <label className="block text-sm text-muted">
              Title
              <input name="title" required defaultValue={a.title} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <AdminPortfolioSeriesField series={portfolioSeries} selectedIds={selectedSeriesIds} />
            <AdminMediumGalleryField galleries={mediumGalleries} value={mediumAssignment} />
            <fieldset className="space-y-3">
              <legend className="text-sm text-muted">Material and size</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-muted">
                  Material
                  <input name="medium" defaultValue={a.medium} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-muted">
                  Size
                  <input name="size" defaultValue={a.size} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
                </label>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Shown under the title on the public gallery page (e.g. Oil &amp; cold wax on board · 20&quot; × 20&quot;).
              </p>
            </fieldset>
            <label className="block text-sm text-muted">
              Alt text
              <span className="font-normal text-muted/80"> (optional — screen readers only, not shown on the site)</span>
              <input name="alt" defaultValue={a.alt} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
              <span className="mt-1.5 block text-xs leading-relaxed text-muted">
                Leave blank to auto-generate from title and material/size.
              </span>
            </label>
            <label className="block text-sm text-muted">
              Description
              <span className="font-normal text-muted/80"> (optional)</span>
              <textarea name="description" rows={4} defaultValue={a.description} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
              <span className="mt-1.5 block text-xs leading-relaxed text-muted">
                Extra text below the caption on the live gallery page.
              </span>
            </label>
            <label className="block text-sm text-muted">
              Status
              <select name="status" defaultValue={a.status} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm">
                <option value="unknown">Unknown</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
            <label className="block text-sm text-muted">
              Sort order
              <input name="sortOrder" defaultValue={String(a.sortOrder)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <AdminFilePicker name="image" label="Add image" buttonLabel="Upload image" existingValue={a.image} />

            <AdminDirtySave formId="artwork-edit" />
            <div className="flex flex-wrap gap-3">
              <AdminLink variant="back" href={backHref}>
                Back
              </AdminLink>
            </div>
          </form>

          <form action={deleteArtwork} className="mt-6 border border-red-200 bg-red-50/40 p-4">
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="contextSeriesId" value={contextSeriesId} />
            <button className={adminBtnDanger} type="submit">
              Delete artwork
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
