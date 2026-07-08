import type { Series } from "@/db";
import { updateArtworkMembershipFromSite } from "@/app/admin/actions";
import { AdminLink } from "@/components/AdminLink";
import { AdminDeleteArtworkForm } from "@/components/AdminDeleteArtworkForm";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { AdminMediumGalleryField } from "@/components/AdminMediumGalleryField";

type AdminArtworkSiteEditProps = {
  artworkId: string;
  title: string;
  mediumSeriesId: string | null;
  mediumGalleries: Series[];
  status: string;
  returnPath: string;
};

export function AdminArtworkSiteEdit({
  artworkId,
  title,
  mediumSeriesId,
  mediumGalleries,
  status,
  returnPath,
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
        <AdminMediumGalleryField galleries={mediumGalleries} value={mediumSeriesId} />
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
        <AdminDirtySave formId={formId} />
      </form>

      <AdminDeleteArtworkForm artworkId={artworkId} title={title} returnPath={returnPath} />
    </div>
  );
}
