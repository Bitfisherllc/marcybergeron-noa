import Link from "next/link";
import { saveContactPageAction } from "@/app/admin/contact-page/actions";
import { AdminExternalLink } from "@/components/AdminLink";
import { AdminRichTextEditor } from "@/components/AdminRichTextEditor";
import { AdminSaveTracker } from "@/components/AdminSaveTracker";
import { AdminSocialLinksField } from "@/components/AdminSocialLinksField";
import { getSiteContactForAdmin } from "@/lib/contactPage";

export const dynamic = "force-dynamic";

const savedLabels: Record<string, string> = {
  heading: "Page title and text",
  details: "Phone and studio address",
  social: "Social links",
  directions: "Directions page",
};

const errorLabels: Record<string, string> = {
  title: "The page title cannot be empty.",
  directions_title: "The Directions page title cannot be empty.",
  social: "One of the social links is not a web address. Fix the box outlined in red, then save again.",
};

const inputClass = "mt-2 block w-full border border-line bg-paper px-3 py-2 text-sm";
const boxClass = "border border-line bg-white/50 p-6";

export default async function AdminContactPageEditor({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const contact = await getSiteContactForAdmin();
  const savedLabel = sp.saved ? savedLabels[sp.saved] ?? null : null;
  const errorLabel = sp.error ? errorLabels[sp.error] ?? "Something went wrong. Please try again." : null;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Contact page</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Edit the text, phone, studio address, and social links. The phone, address, and social links also appear in
          the footer and menu on every page. When you change something, a red{" "}
          <strong className="font-medium text-ink">SAVE</strong> button flashes in the top bar.
        </p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          The message form is not editable here. To read messages people send, open{" "}
          <Link href="/admin/contact" className="link-quiet text-ink/90 underline">
            Contact messages
          </Link>
          .
        </p>
        {savedLabel ? <p className="mt-3 text-sm text-ink">Saved: {savedLabel}.</p> : null}
        {errorLabel ? <p className="mt-3 text-sm text-red-700">{errorLabel}</p> : null}
      </div>

      <div className="space-y-10">
        <form id="contact-heading" data-admin-section="Page title and text" action={saveContactPageAction} className={boxClass}>
          <input type="hidden" name="part" value="heading" />
          <h2 className="font-serif text-xl tracking-tight">Page title and text</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">The top of the Contact page.</p>
          <label className="mt-5 block text-sm text-muted">
            Eyebrow (small line above the title)
            <input name="eyebrow" defaultValue={contact.eyebrow} className={inputClass} />
          </label>
          <label className="mt-4 block text-sm text-muted">
            Title
            <input name="title" defaultValue={contact.title} required className={inputClass} />
          </label>
          <div className="mt-4 block text-sm text-muted">
            Text under the title
            <AdminRichTextEditor name="intro" defaultValue={contact.intro} size="md" ariaLabel="Text under the title" />
          </div>
          <AdminSaveTracker formId="contact-heading" />
        </form>

        <form id="contact-details" data-admin-section="Phone and studio address" action={saveContactPageAction} className={boxClass}>
          <input type="hidden" name="part" value="details" />
          <h2 className="font-serif text-xl tracking-tight">Phone and studio address</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Shown on the Contact page, the Directions page, the footer of every page, and the thank-you email visitors
            receive.
          </p>
          <div className="mt-5 text-sm text-muted">
            Email
            <p className="mt-2 text-ink">{contact.email}</p>
            <p className="mt-1 text-xs">
              The message form sends to this address, so it cannot be changed here.
            </p>
          </div>
          <label className="mt-5 block text-sm text-muted">
            Phone
            <input name="phone" defaultValue={contact.phone} inputMode="tel" className={`${inputClass} max-w-xs`} />
            <span className="mt-1 block text-xs">Leave empty to hide the phone number.</span>
          </label>
          <label className="mt-5 block text-sm text-muted">
            Studio address (one line per row)
            <textarea
              name="studio_lines"
              defaultValue={contact.studioLines.join("\n")}
              rows={5}
              className={`${inputClass} max-w-md`}
            />
            <span className="mt-1 block text-xs">
              The map on the Directions page stays pinned to Porter Mill. Let your web developer know if the studio moves.
            </span>
          </label>
          <AdminSaveTracker formId="contact-details" />
        </form>

        <form id="contact-social" data-admin-section="Social links" action={saveContactPageAction} className={boxClass}>
          <input type="hidden" name="part" value="social" />
          <h2 className="font-serif text-xl tracking-tight">Social links</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Paste the full web address of each profile. The icon is picked automatically for Instagram, Facebook,
            LinkedIn, YouTube, X, Pinterest, TikTok, Threads, and Vimeo; other sites get a globe. Use the arrows to
            change the order.
          </p>
          <AdminSocialLinksField key={JSON.stringify(contact.socialLinks)} defaultLinks={contact.socialLinks} />
          <AdminSaveTracker formId="contact-social" />
        </form>

        <form id="contact-directions" data-admin-section="Directions page" action={saveContactPageAction} className={boxClass}>
          <input type="hidden" name="part" value="directions" />
          <h2 className="font-serif text-xl tracking-tight">Directions page</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            The top of the Directions page, linked from the Contact page. The studio address above is shown under the
            title.
          </p>
          <label className="mt-5 block text-sm text-muted">
            Eyebrow (small line above the title)
            <input name="directions_eyebrow" defaultValue={contact.directionsEyebrow} className={inputClass} />
          </label>
          <label className="mt-4 block text-sm text-muted">
            Title
            <input name="directions_title" defaultValue={contact.directionsTitle} required className={inputClass} />
          </label>
          <div className="mt-4 block text-sm text-muted">
            Text under the address
            <AdminRichTextEditor
              name="directions_intro"
              defaultValue={contact.directionsIntro}
              size="sm"
              ariaLabel="Text under the address"
            />
          </div>
          <AdminSaveTracker formId="contact-directions" />
        </form>

        <div className="flex flex-wrap gap-4">
          <AdminExternalLink variant="secondary" href="/contact">
            View public Contact page →
          </AdminExternalLink>
          <AdminExternalLink variant="secondary" href="/directions">
            View public Directions page →
          </AdminExternalLink>
        </div>
      </div>
    </div>
  );
}
