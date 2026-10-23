"use client";

import { deleteArtworkFromSite } from "@/app/admin/actions";
import { adminBtnDanger } from "@/components/AdminLink";

export function AdminDeleteArtworkForm({
  artworkId,
  title,
  returnPath,
  seriesId,
}: {
  artworkId: string;
  title: string;
  returnPath: string;
  seriesId: string;
}) {
  return (
    <form action={deleteArtworkFromSite} className="border-t border-red-200/80 pt-4">
      <input type="hidden" name="id" value={artworkId} />
      <input type="hidden" name="seriesId" value={seriesId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <button
        type="submit"
        className={adminBtnDanger}
        onClick={(e) => {
          if (!confirm(`Remove “${title}” from this gallery? It stays in any other gallery.`)) e.preventDefault();
        }}
      >
        Remove from this gallery
      </button>
    </form>
  );
}
