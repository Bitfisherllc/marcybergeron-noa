"use client";

import { deleteArtworkFromSite } from "@/app/admin/actions";
import { adminBtnDanger } from "@/components/AdminLink";

export function AdminDeleteArtworkForm({
  artworkId,
  title,
  returnPath,
}: {
  artworkId: string;
  title: string;
  returnPath: string;
}) {
  return (
    <form action={deleteArtworkFromSite} className="border-t border-red-200/80 pt-4">
      <input type="hidden" name="id" value={artworkId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <button
        type="submit"
        className={adminBtnDanger}
        onClick={(e) => {
          if (!confirm(`Delete “${title}”? This cannot be undone.`)) e.preventDefault();
        }}
      >
        Delete artwork
      </button>
    </form>
  );
}
