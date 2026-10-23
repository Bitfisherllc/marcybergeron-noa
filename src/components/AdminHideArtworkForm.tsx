import { setArtworkHidden } from "@/app/admin/actions";
import { adminLinkVariants } from "@/components/AdminLink";

export function AdminHideArtworkForm({
  artworkId,
  hidden,
  returnPath,
  seriesId,
}: {
  artworkId: string;
  hidden: boolean;
  returnPath: string;
  seriesId?: string;
}) {
  return (
    <form action={setArtworkHidden}>
      <input type="hidden" name="id" value={artworkId} />
      <input type="hidden" name="hidden" value={hidden ? "0" : "1"} />
      <input type="hidden" name="returnPath" value={returnPath} />
      {seriesId ? <input type="hidden" name="seriesId" value={seriesId} /> : null}
      <button type="submit" className={adminLinkVariants.secondary}>
        {hidden ? "Show" : "Hide"}
      </button>
    </form>
  );
}
