import Image from "next/image";
import { notFound } from "next/navigation";
import { reorderArtwork, upsertArtwork, upsertSeries, deleteSeries } from "@/app/admin/actions";
import { AdminDeleteSeriesForm } from "@/components/AdminDeleteSeriesForm";
import { AdminFeaturedArtworkField } from "@/components/AdminFeaturedArtworkField";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminGalleryPrivacyPanel } from "@/components/AdminGalleryPrivacyPanel";
import { AdminLightboxProvider, AdminLightboxThumb, AdminLightboxTrigger } from "@/components/AdminImageLightbox";
import { AdminLink, adminBtnDanger } from "@/components/AdminLink";
import { AdminMediumGalleryField } from "@/components/AdminMediumGalleryField";
import { AdminReorderButtons } from "@/components/AdminReorderButtons";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { isOilColdWaxChildSlug, isOilColdWaxParentSlug, OIL_COLD_WAX_PARENT_SLUG } from "@/lib/oilColdWaxSeries";
import { getSeriesDeleteImpact } from "@/lib/seriesDelete";
import { getSeriesById, listAdminSeriesMembershipOptions, listArtworksForMediumGallery, listArtworksForPublicGallery, listMediumGalleries } from "@/lib/queries";

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSeriesById(id);
  if (!s) notFound();
  const isMediumGallery = isMediumGallerySlug(s.slug);
  const isOilColdWaxChild = isOilColdWaxChildSlug(s.slug);
  const isOilColdWaxHub = isOilColdWaxParentSlug(s.slug);
  const [arts, mediumGalleries, membershipOptions, deleteImpact, statementPieceOptions] = await Promise.all([
    listArtworksForPublicGallery(s),
    listMediumGalleries(),
    listAdminSeriesMembershipOptions(),
    isMediumGallery || isOilColdWaxChild ? Promise.resolve(null) : getSeriesDeleteImpact(s.id),
    isOilColdWaxHub ? listArtworksForMediumGallery(s.id) : listArtworksForPublicGallery(s),
  ]);
  const oilColdWaxParent = mediumGalleries.find((g) => g.slug === OIL_COLD_WAX_PARENT_SLUG) ?? null;
  const artworkSlides = arts.map((a) => ({
    src: a.image,
    alt: a.alt || a.title,
    caption: a.title,
  }));

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Edit gallery</h1>
        {!isMediumGallery && !isOilColdWaxChild ? (
          <a href="#delete" className={`${adminBtnDanger} mt-4`}>
            Delete gallery
          </a>
        ) : null}
        <p className="mt-3 text-sm text-muted">
          {s.isPrivate ? (
            <>
              Private gallery · {arts.length} {arts.length === 1 ? "painting" : "paintings"} · not listed on the
              public portfolio
            </>
          ) : isOilColdWaxHub ? (
            <>
              Oil and Cold Wax hub · <span className="text-ink/80">/art/{s.slug}</span> · paintings are managed in each
              series below
            </>
          ) : isOilColdWaxChild ? (
            <>
              Oil and Cold Wax series · <span className="text-ink/80">/art/{s.slug}</span> · {arts.length}{" "}
              {arts.length === 1 ? "painting" : "paintings"}
            </>
          ) : isMediumGallery ? (
            <>
              Portfolio gallery · <span className="text-ink/80">/art/{s.slug}</span> · {arts.length}{" "}
              {arts.length === 1 ? "painting" : "paintings"}
            </>
          ) : (
            <>
              Public page: <span className="text-ink/80">/art/{s.slug}</span> · {arts.length}{" "}
              {arts.length === 1 ? "painting" : "paintings"}
            </>
          )}
        </p>
      </div>

      {!isMediumGallery && !isOilColdWaxChild ? (
        <AdminGalleryPrivacyPanel seriesId={s.id} isPrivate={s.isPrivate} accessToken={s.accessToken} />
      ) : null}

      <form id="series-edit" action={upsertSeries} className="space-y-6 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value={s.id} />
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Title
            <input name="title" required defaultValue={s.title} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Slug
            <input name="slug" required defaultValue={s.slug} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="block text-sm text-muted">
          Excerpt
          <textarea name="excerpt" rows={4} defaultValue={s.excerpt} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm text-muted">
          Full statement (Markdown)
          <textarea name="content" rows={10} defaultValue={s.content} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Sort order
            <input name="sortOrder" defaultValue={String(s.sortOrder)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <AdminFilePicker
            name="featured"
            label="Portfolio card image"
            buttonLabel="Upload image"
            existingValue={s.featuredImage}
          />
        </div>
        <AdminFeaturedArtworkField
          mode={s.featuredArtworkMode}
          artworkId={s.featuredArtworkId}
          pieces={statementPieceOptions}
        />
        <div className="flex items-center gap-4">
          <AdminLightboxThumb src={s.featuredImage} alt={s.title} caption={`${s.title} — portfolio card image`}>
            <div className="relative h-24 w-36 cursor-zoom-in overflow-hidden border border-line bg-black/[0.03]">
              <Image src={s.featuredImage} alt="" fill className="object-cover" />
            </div>
          </AdminLightboxThumb>
          <p className="text-xs text-muted">Used on the portfolio overview page. Leave empty to keep the current image.</p>
        </div>
        <AdminDirtySave formId="series-edit" />
      </form>

      {!isOilColdWaxHub ? (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Paintings in this gallery</h2>
            <p className="mt-2 text-sm text-muted">
              All photos shown on the public gallery page. Use the arrow buttons to change order.
            </p>
          </div>
        </div>

        <AdminLightboxProvider slides={artworkSlides}>
        <div className="overflow-hidden border border-line bg-white/50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {arts.map((a, idx) => (
                <tr key={a.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <AdminLightboxTrigger index={idx} label={`View ${a.title}`}>
                      <div className="relative h-16 w-16 overflow-hidden border border-line bg-black/[0.03]">
                        <Image src={a.image} alt="" fill className="object-cover" />
                      </div>
                    </AdminLightboxTrigger>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted">
                      {a.medium}
                      {a.size ? ` · ${a.size}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{a.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <AdminReorderButtons
                        action={reorderArtwork}
                        fields={{ id: a.id, seriesId: s.id }}
                        disableUp={idx === 0}
                        disableDown={idx === arts.length - 1}
                      />
                      <AdminLink href={`/admin/artworks/${a.id}`}>Edit</AdminLink>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </AdminLightboxProvider>
      </div>
      ) : (
        <p className="border border-line bg-white/50 p-6 text-sm text-muted">
          This portfolio is organized into series. Edit the portfolio statement above, then manage paintings in each
          series from the Galleries list.
        </p>
      )}

      {!isOilColdWaxHub ? (
      <div id="add-artwork" className="border border-line bg-white/50 p-6">
        <h3 className="font-serif text-xl tracking-tight">Add artwork</h3>
        <form id="series-add-artwork" action={upsertArtwork} className="mt-6 space-y-4">
          <input type="hidden" name="id" value="" />
          <input type="hidden" name="contextSeriesId" value={s.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-muted">
              Title
              <input name="title" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Status
              <select name="status" defaultValue="unknown" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm">
                <option value="unknown">Unknown</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
          </div>
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
          <AdminMediumGalleryField
            galleries={mediumGalleries}
            value={isMediumGallery ? s.id : isOilColdWaxChild ? oilColdWaxParent?.id ?? null : null}
          />
          <label className="block text-sm text-muted">
            Description (optional)
            <textarea name="description" rows={3} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Alt text (optional)
            <input name="alt" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminFilePicker name="image" label="Add image" buttonLabel="Upload image" required />
            <label className="block text-sm text-muted">
              Sort order
              <input name="sortOrder" defaultValue={String((arts[arts.length - 1]?.sortOrder ?? -1) + 1)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <AdminDirtySave formId="series-add-artwork" />
        </form>
      </div>
      ) : null}

      {!isMediumGallery && !isOilColdWaxChild ? (
        <div id="delete" className="border border-line bg-white/50 p-6">
          <h3 className="font-serif text-xl tracking-tight text-ink">Delete gallery</h3>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Remove this gallery from the site. Paintings that only appear here via portfolio checkboxes will stay in their
            other galleries.
          </p>
          <div className="mt-4">
            {deleteImpact ? (
              <AdminDeleteSeriesForm
                action={deleteSeries}
                impact={deleteImpact}
                portfolioOptions={membershipOptions
                  .filter((row) => row.id !== s.id)
                  .map((row) => ({ id: row.id, title: row.title }))}
                mediumOptions={mediumGalleries
                  .filter((row) => row.id !== s.id)
                  .map((row) => ({ id: row.id, title: row.title }))}
                returnTo={`/admin/series/${s.id}`}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
