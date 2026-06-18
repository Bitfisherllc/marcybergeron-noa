import { regeneratePrivateGalleryToken, setSeriesPrivacy } from "@/app/admin/actions";
import { adminBtnPrimary, adminBtnDanger, adminLinkVariants } from "@/components/AdminLink";
import { AdminPrivateGalleryLink } from "@/components/AdminPrivateGalleryLink";

type AdminGalleryPrivacyPanelProps = {
  seriesId: string;
  isPrivate: boolean;
  accessToken: string | null;
};

export function AdminGalleryPrivacyPanel({ seriesId, isPrivate, accessToken }: AdminGalleryPrivacyPanelProps) {
  return (
    <div className="border border-line bg-white/50 p-6">
      <h2 className="font-serif text-xl tracking-tight">Privacy</h2>
      <p className="mt-2 max-w-prose text-sm text-muted">
        {isPrivate
          ? "This gallery is private—only people with the link below can view it. It is hidden from the public portfolio."
          : "This gallery is public—it appears on the portfolio page and in site navigation."}
      </p>

      <form action={setSeriesPrivacy} className="mt-4 flex flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={seriesId} />
        {isPrivate ? (
          <>
            <input type="hidden" name="privacy" value="public" />
            <button className={adminLinkVariants.secondary} type="submit">
              Make public
            </button>
          </>
        ) : (
          <>
            <input type="hidden" name="privacy" value="private" />
            <button className={adminBtnPrimary} type="submit">
              Make private
            </button>
          </>
        )}
      </form>

      {isPrivate && accessToken ? (
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="text-sm font-medium tracking-wide text-ink uppercase">Private link</h3>
          <div className="mt-3">
            <AdminPrivateGalleryLink accessToken={accessToken} />
          </div>
          <form action={regeneratePrivateGalleryToken} className="mt-4">
            <input type="hidden" name="id" value={seriesId} />
            <button className={adminBtnDanger} type="submit">
              Generate new link
            </button>
            <p className="mt-2 max-w-prose text-xs text-muted">
              Use if a link was shared too widely—the old URL will stop working.
            </p>
          </form>
        </div>
      ) : null}
    </div>
  );
}
