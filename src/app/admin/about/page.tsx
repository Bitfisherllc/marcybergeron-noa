import Image from "next/image";
import Link from "next/link";
import { saveAboutAllAction } from "@/app/admin/about/actions";
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
    hint: "Main statement copy. Body supports Markdown paragraphs.",
    showTitle: true,
    bodyRows: 8,
  },
  biography: {
    heading: "Biography",
    hint: "Biography paragraphs. Body supports Markdown.",
    showTitle: true,
    bodyRows: 8,
  },
  education: {
    heading: "Education, workshops, and classes",
    hint: "Use a Markdown bullet list (one line per item, starting with -).",
    showTitle: true,
    bodyRows: 12,
  },
  exhibitions: {
    heading: "Selected exhibitions",
    hint: "Use a Markdown bullet list (one line per exhibition).",
    showTitle: true,
    bodyRows: 8,
  },
  affiliations: {
    heading: "Affiliations (juried member)",
    hint: "Use a Markdown bullet list of memberships.",
    showTitle: true,
    bodyRows: 6,
  },
  studio: {
    heading: "Studio",
    hint: "Studio address and location. Plain lines or Markdown — shown at the bottom of the page.",
    showTitle: true,
    bodyRows: 5,
  },
};

export default async function AdminAboutPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [sections, portrait] = await Promise.all([listAboutSectionsForAdmin(), getAboutPortraitForAdmin()]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">About page</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Edit the portrait and each section on the public About page. Body fields accept Markdown (paragraphs, bullet
          lists, [links](url)).
        </p>
        {sp.saved ? <p className="mt-3 text-sm text-ink">Saved. Public About page is updated.</p> : null}
        {sp.error === "portrait" ? (
          <p className="mt-3 text-sm text-red-700">Choose an image file to replace the portrait.</p>
        ) : null}
        {sp.error && sp.error !== "portrait" ? (
          <p className="mt-3 text-sm text-red-700">{decodeURIComponent(sp.error)}</p>
        ) : null}
      </div>

      <form action={saveAboutAllAction} className="space-y-10">
        <fieldset className="border border-line bg-white/50 p-6">
          <legend className="px-1 font-serif text-xl tracking-tight">Portrait photo</legend>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Shown beside the text on desktop. Upload a new file to replace the current image, or leave empty to keep it.
          </p>
          <div className="mt-6 flex flex-wrap gap-8">
            <div className="relative h-48 w-36 shrink-0 overflow-hidden border border-line bg-black/[0.04]">
              <Image src={portrait.image} alt="" fill className="object-cover" sizes="144px" />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <label className="block text-sm text-muted">
                Replace image
                <input name="portrait" type="file" accept="image/*" className="mt-2 block w-full max-w-xs text-xs" />
              </label>
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
        </fieldset>

        {ABOUT_SECTION_KEYS.map((key) => {
          const meta = sectionLabels[key];
          const row = sections[key];
          return (
            <fieldset key={key} className="border border-line bg-white/50 p-6">
              <legend className="px-1 font-serif text-xl tracking-tight">{meta.heading}</legend>
              <p className="mt-2 max-w-prose text-sm text-muted">{meta.hint}</p>
              {meta.showEyebrow ? (
                <label className="mt-5 block text-sm text-muted">
                  Eyebrow
                  <input
                    name={`${key}_eyebrow`}
                    defaultValue={row.eyebrow}
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
              ) : (
                <input type="hidden" name={`${key}_eyebrow`} value={row.eyebrow} />
              )}
              {meta.showTitle !== false ? (
                <label className="mt-4 block text-sm text-muted">
                  Section title
                  <input
                    name={`${key}_title`}
                    defaultValue={row.title}
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
              ) : (
                <input type="hidden" name={`${key}_title`} value={row.title} />
              )}
              <label className="mt-4 block text-sm text-muted">
                Body {key === "hero" ? "(intro text)" : "(Markdown)"}
                <textarea
                  name={`${key}_body`}
                  rows={meta.bodyRows}
                  defaultValue={row.body}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 font-mono text-sm leading-relaxed"
                />
              </label>
            </fieldset>
          );
        })}

        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            className="border border-ink bg-ink px-6 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90"
          >
            Save about page
          </button>
          <Link className="self-center text-sm text-muted hover:text-ink" href="/about">
            View public About →
          </Link>
        </div>
      </form>
    </div>
  );
}
