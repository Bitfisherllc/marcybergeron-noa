import { saveWorkshopsVisibilityAction } from "@/app/admin/workshops/actions";
import { AdminSaveTracker } from "@/components/AdminSaveTracker";

export function AdminWorkshopsVisibilityForm({ enabled, saved }: { enabled: boolean; saved?: string }) {
  return (
    <form
      id="workshops-visibility"
      data-admin-section="Show on the website"
      action={saveWorkshopsVisibilityAction}
      className="border border-line bg-white/50 p-6"
    >
      <h2 className="font-serif text-xl tracking-tight">Show on the website</h2>
      <p className="mt-2 max-w-prose text-sm text-muted">
        While this is off, visitors do not see Workshops in the menu and the workshop pages are hidden. You still see
        everything while signed in, so you can get workshops ready. Turn it on when you are ready to go live.
      </p>
      <label className="group mt-5 flex cursor-pointer items-start gap-3 border border-line bg-paper px-4 py-3 text-sm text-ink">
        <input type="checkbox" name="visible" value="on" defaultChecked={enabled} className="peer sr-only" />
        <span
          aria-hidden
          className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full bg-ink/25 transition peer-focus-visible:ring-2 peer-focus-visible:ring-ink/40 peer-focus-visible:ring-offset-2 group-has-[:checked]:bg-green-600 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition group-has-[:checked]:after:translate-x-5"
        />
        <span>
          <span className="font-medium">
            Show Workshops on the website:{" "}
            <span className="text-muted group-has-[:checked]:hidden">Off</span>
            <span className="hidden text-green-700 group-has-[:checked]:inline">On</span>
          </span>
          <span className="block text-xs leading-relaxed text-muted">
            Covers the Workshops menu link, the Workshops page, each workshop page, and the “I’m interested” form.
          </span>
          <span className="mt-1 block text-xs text-ink/80">
            {enabled ? "Currently live for visitors." : "Currently hidden from visitors."}
          </span>
        </span>
      </label>
      {saved === "workshops-on" ? <p className="mt-3 text-sm text-ink">Workshops are now on the website.</p> : null}
      {saved === "workshops-off" ? <p className="mt-3 text-sm text-ink">Workshops are now hidden from visitors.</p> : null}
      <AdminSaveTracker formId="workshops-visibility" />
    </form>
  );
}
