import Image from "next/image";
import { saveAboutPortraitAction, saveAboutSectionAction } from "@/app/admin/about/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLightboxThumb } from "@/components/AdminImageLightbox";
import { AdminExternalLink } from "@/components/AdminLink";
import { AdminRichTextEditor } from "@/components/AdminRichTextEditor";
import { AdminSaveTracker } from "@/components/AdminSaveTracker";
import { ABOUT_SECTION_KEYS, type AboutSectionKey } from "@/lib/aboutDefaults";
import { getAboutPortraitForAdmin, listAboutSectionsForAdmin } from "@/lib/aboutPage";

const sectionLabels: Record<
  AboutSectionKey,
  { heading: string; hint: string; showEyebrow?: boolean; showTitle?: boolean; bodyRows: number }
> = {
  hero: {
    heading: "About",
    hint: "Top of the page — eyebrow, name, and short intro under the headline.",
    showEyebrow: true,
    showTitle: true,
    bodyRows: 3,
  },
  artist_statement: {
    heading: "Artist statement",
    hint: "Main statement copy.",
    showTitle: true,
    bodyRows: 8,
  },
  biography: {
    heading: "Biography",
    hint: "Biography paragraphs.",
    showTitle: true,
    bodyRows: 8,
  },
  education: {
    heading: "Education, workshops, and classes",
    hint: "Use the bulleted list button, one item per line.",
    showTitle: true,
    bodyRows: 12,
  },
  exhibitions: {
    heading: "Selected exhibitions",
    hint: "Use the bulleted list button, one exhibition per line.",
    showTitle: true,
    bodyRows: 8,
  },
  affiliations: {
    heading: "Affiliations (juried member)",
    hint: "Use the bulleted list button for memberships.",
    showTitle: true,
    bodyRows: 6,
  },
  studio: {
    heading: "Studio",
    hint: "Studio address and location. Shown at the bottom of the page.",
    showTitle: true,
    bodyRows: 5,
  },
};

const savedLabels: Record<string, string> = {
  portrait: "Portrait photo",
  hero: "About",
  artist_statement: "Artist statement",
  biography: "Biography",
  education: "Education, workshops, and classes",
  exhibitions: "Selected exhibitions",
  affiliations: "Affiliations",
  studio: "Studio",
};

export default async function AdminAboutPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [sections, portrait] = await Promise.all([listAboutSectionsForAdmin(), getAboutPortraitForAdmin()]);
  const savedLabel = sp.saved ? savedLabels[sp.saved] ?? sp.saved : null;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">About page</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          When you change something, a red <strong className="font-medium text-ink">SAVE</strong> button flashes in
          the top bar. Use the toolbar above each body field for bold, lists, links, and more.
        </p>
        {savedLabel ? <p className="mt-3 text-sm text-ink">Saved: {savedLabel}.</p> : null}
        {sp.error === "portrait" ? (
          <p className="mt-3 text-sm text-red-700">Choose an image file to replace the portrait.</p>
        ) : null}
        {sp.error && sp.error !== "portrait" ? (
          <p className="mt-3 text-sm text-red-700">{decodeURIComponent(sp.error)}</p>
        ) : null}
      </div>

      <div className="space-y-10">
        <form id="about-portrait" data-admin-section="Portrait photo" action={saveAboutPortraitAction} className="border border-line bg-white/50 p-6">
          <h2 className="font-serif text-xl tracking-tight">Portrait photo</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Shown beside the text on desktop. Upload a new file to replace the current image, or leave empty to keep it.
          </p>
          <div className="mt-6 flex flex-wrap gap-8">
            <AdminLightboxThumb src={portrait.image} alt={portrait.alt} caption="Portrait photo">
              <div className="relative h-48 w-36 shrink-0 overflow-hidden border border-line bg-black/[0.04]">
                <Image src={portrait.image} alt="" fill className="object-cover" sizes="144px" />
              </div>
            </AdminLightboxThumb>
            <div className="min-w-0 flex-1 space-y-4">
              <AdminFilePicker
                name="portrait"
                label="Add image"
                buttonLabel="Upload image"
                existingValue={portrait.image}
              />
              <label className="block text-sm text-muted">
                Alt text (accessibility)
                <input
                  name="portrait_alt"
                  defaultValue={portrait.alt}
                  className="mt-2 w-full max-w-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
          <AdminSaveTracker formId="about-portrait" />
        </form>

        {ABOUT_SECTION_KEYS.map((key) => {
          const meta = sectionLabels[key];
          const row = sections[key];
          return (
            <form key={key} id={`about-section-${key}`} data-admin-section={meta.heading} action={saveAboutSectionAction} className="border border-line bg-white/50 p-6">
              <input type="hidden" name="section" value={key} />
              <h2 className="font-serif text-xl tracking-tight">{meta.heading}</h2>
              <p className="mt-2 max-w-prose text-sm text-muted">{meta.hint}</p>
              {meta.showEyebrow ? (
                <label className="mt-5 block text-sm text-muted">
                  Eyebrow
                  <input
                    name="eyebrow"
                    defaultValue={row.eyebrow}
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
              ) : (
                <input type="hidden" name="eyebrow" value={row.eyebrow} />
              )}
              {meta.showTitle !== false ? (
                <label className="mt-4 block text-sm text-muted">
                  Section title
                  <input
                    name="title"
                    defaultValue={row.title}
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
              ) : (
                <input type="hidden" name="title" value={row.title} />
              )}
              <div className="mt-4 block text-sm text-muted">
                Body{key === "hero" ? " (intro text)" : ""}
                <AdminRichTextEditor
                  name="body"
                  defaultValue={row.body}
                  size={meta.bodyRows > 8 ? "lg" : meta.bodyRows > 4 ? "md" : "sm"}
                  headings={key !== "hero"}
                  ariaLabel="Body"
                />
              </div>
              <AdminSaveTracker formId={`about-section-${key}`} />
            </form>
          );
        })}

        <AdminExternalLink variant="secondary" href="/about">
          View public About →
        </AdminExternalLink>
      </div>
    </div>
  );
}
