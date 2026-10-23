import type { Series } from "@/db";
import { ARTWORK_PRICE_HINT } from "@/lib/artworkPrice";
import { updateArtworkMembershipFromSite } from "@/app/admin/actions";
import { AdminLink } from "@/components/AdminLink";
import { AdminDeleteArtworkForm } from "@/components/AdminDeleteArtworkForm";
import { AdminSaveTracker } from "@/components/AdminSaveTracker";
import { AdminMediumGalleryField } from "@/components/AdminMediumGalleryField";

type AdminArtworkSiteEditProps = {
  artworkId: string;
  title: string;
  mediumSeriesId: string | null;
  mediumGalleries: Series[];
  status: string;
  /** When set, this painting is on an exhibition page and the price can be edited here. */
  price?: number | null;
  returnPath: string;
  seriesId: string;
};

export function AdminArtworkSiteEdit({
  artworkId,
  title,
  mediumSeriesId,
  mediumGalleries,
  status,
  price,
  returnPath,
  seriesId,
}: AdminArtworkSiteEditProps) {
  const formId = `site-artwork-edit-${artworkId}`;

  return (
    <div className="mt-4 space-y-4 border border-line bg-white/60 p-4">
      <AdminLink variant="secondary" href={`/admin/artworks/${artworkId}`}>
        Edit Text
      </AdminLink>

      <form id={formId} action={updateArtworkMembershipFromSite} className="space-y-4 border-t border-line pt-4">
        <input type="hidden" name="id" value={artworkId} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <AdminMediumGalleryField galleries={mediumGalleries} value={mediumSeriesId} required={false} />
        <label className="block text-sm text-muted">
          Status
          <select
            name="status"
            defaultValue={status}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          >
            <option value="unknown">Unknown</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </label>
        {price !== undefined ? (
          <label className="block text-sm text-muted">
            Price
            <input
              name="price"
              inputMode="decimal"
              defaultValue={price ?? ""}
              placeholder="1200"
              className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
            />
            <span className="mt-1.5 block text-xs leading-relaxed text-muted">{ARTWORK_PRICE_HINT}</span>
          </label>
        ) : null}
        <AdminSaveTracker formId={formId} />
      </form>

      <AdminDeleteArtworkForm artworkId={artworkId} title={title} returnPath={returnPath} seriesId={seriesId} />
    </div>
  );
}
