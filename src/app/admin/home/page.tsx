import Image from "next/image";
import {
  addHomeSlideshowAction,
  addHomeSlideshowFromArtworkAction,
  deleteHomeSlideshowAction,
  reorderHomeSlideshowAction,
  saveHomeFeaturedSeriesAction,
  saveHomeJournalAction,
  saveHomeSelectedWorksAction,
  saveHomeSlideshowSlideAction,
  saveHomeTextSectionAction,
} from "@/app/admin/home/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLightboxProvider, AdminLightboxTrigger } from "@/components/AdminImageLightbox";
import { AdminExternalLink, AdminLink, adminBtnDanger } from "@/components/AdminLink";
import { AdminReorderButtons } from "@/components/AdminReorderButtons";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { HOME_SECTION_KEYS, type HomeSectionKey } from "@/lib/homeDefaults";
import {
  getHomePickStateForAdmin,
  listHomeSectionsForAdmin,
  listHomeSlideshowForAdmin,
} from "@/lib/homePage";
import { listMediumGalleries, listAllPostsAdmin, listArtworksWithSeriesForPicker } from "@/lib/queries";

const sectionLabels: Record<HomeSectionKey, { heading: string; hint: string }> = {
  hero: {
    heading: "Opening (hero)",
    hint: "Eyebrow line, main headline, and opening paragraph beside the slideshow.",
  },
  featured_series: {
    heading: "Featured series",
    hint: "Title and intro above the three series cards.",
  },
  journal: {
    heading: "Journal",
    hint: "Title and intro above the journal carousel.",
  },
  artist_words: {
    heading: "In the artist’s words",
    hint: "Section title, pull quote (single line), then body as Markdown (paragraphs, [links](/path)).",
  },
  selected_works: {
    heading: "Selected works",
    hint: "Title and intro above the three artwork cards.",
  },
};

const savedLabels: Record<string, string> = {
  hero: "Opening (hero)",
  featured_series: "Featured series",
  journal: "Journal",
  artist_words: "In the artist’s words",
  selected_works: "Selected works",
  featured_series_picks: "Featured series cards",
  journal_picks: "Journal carousel",
  selected_works_picks: "Selected works cards",
  slideshow: "Slideshow slide",
};

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [sections, slides, picks, portfolioGalleries, allPosts, artworkOptions] = await Promise.all([
    listHomeSectionsForAdmin(),
    listHomeSlideshowForAdmin(),
    getHomePickStateForAdmin(),
    listMediumGalleries(),
    listAllPostsAdmin(),
    listArtworksWithSeriesForPicker(),
  ]);

  const featuredSeriesOptions = portfolioGalleries;
  const savedLabel = sp.saved ? savedLabels[sp.saved] ?? sp.saved : null;
  const slideshowLightbox = slides.map((s, i) => ({
    src: s.image,
    alt: s.title || `Slide ${i + 1}`,
    caption: [s.title, s.subtitle].filter(Boolean).join(" · ") || `Slide ${i + 1}`,
  }));

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Home page</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Each section shows a red <strong className="font-medium text-ink">SAVE</strong> button only after you
          change something in that section. To reorder paintings inside a gallery, open{" "}
          <AdminLink href="/admin/series">Galleries &amp; artwork</AdminLink>.
        </p>
        {savedLabel ? <p className="mt-3 text-sm text-ink">Saved: {savedLabel}.</p> : null}
        {sp.error === "slide" ? (
          <p className="mt-3 text-sm text-red-700">Choose an image file to add a slide.</p>
        ) : null}
        {sp.error && sp.error !== "slide" ? (
          <p className="mt-3 text-sm text-red-700">{decodeURIComponent(sp.error)}</p>
        ) : null}
      </div>

      <div className="border border-line bg-white/50 p-6">
        <h2 className="font-serif text-xl tracking-tight">Slideshow</h2>
        <p className="mt-2 max-w-prose text-sm text-muted">
          When at least one image is saved here, the home hero uses only these images (in order). If none are added,
          the site falls back to the automatic mix of series and artwork images. Upload a new file or pick an existing
          painting from your galleries. Add a <strong className="font-medium text-ink">title</strong> and{" "}
          <strong className="font-medium text-ink">details</strong> for each slide — shown under the image on the home
          page. For faster page loads, we recommend using{" "}
          <strong className="font-medium text-ink">no more than 3 slides</strong>.
        </p>
        <form action={addHomeSlideshowFromArtworkAction} className="mt-6 flex flex-wrap items-end gap-4 border-t border-line pt-6">
          <label className="block min-w-[16rem] flex-1 text-sm text-muted">
            Add from gallery
            <select name="artwork_id" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm">
              <option value="">Choose a painting…</option>
              {artworkOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90"
          >
            Add to slideshow
          </button>
        </form>
        <form action={addHomeSlideshowAction} className="mt-6 flex flex-wrap items-end gap-4 border-t border-line pt-6">
          <AdminFilePicker name="slide" label="Add image" buttonLabel="Upload image" />
          <button
            type="submit"
            className="border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90"
          >
            Upload slide
          </button>
        </form>
        {slides.length > 0 ? (
          <AdminLightboxProvider slides={slideshowLightbox}>
            <ul className="mt-6 space-y-4 border-t border-line pt-6">
              {slides.map((s, i) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-start gap-4 border-b border-line/80 pb-6 last:border-b-0 last:pb-0"
                >
                  <AdminLightboxTrigger index={i} label={`View slide ${i + 1}`}>
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-black/[0.04]">
                      <Image src={s.image} alt="" fill className="object-cover" sizes="96px" />
                    </div>
                  </AdminLightboxTrigger>
                  <form
                    id={`home-slide-${s.id}`}
                    action={saveHomeSlideshowSlideAction}
                    className="min-w-0 flex-1 space-y-3"
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <div className="text-xs text-muted">Slide {i + 1}</div>
                    <label className="block text-sm text-muted">
                      Title
                      <input
                        name="title"
                        defaultValue={s.title}
                        placeholder="Painting title"
                        className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
                      />
                    </label>
                    <label className="block text-sm text-muted">
                      Details
                      <input
                        name="subtitle"
                        defaultValue={s.subtitle}
                        placeholder="Medium · size"
                        className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
                      />
                    </label>
                    <AdminDirtySave formId={`home-slide-${s.id}`} />
                  </form>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 self-start pt-6">
                  <AdminReorderButtons
                    action={reorderHomeSlideshowAction}
                    fields={{ id: s.id }}
                    disableUp={i === 0}
                    disableDown={i === slides.length - 1}
                  />
                  <form action={deleteHomeSlideshowAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className={adminBtnDanger}>
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
            </ul>
          </AdminLightboxProvider>
        ) : (
          <p className="mt-4 text-sm text-muted">No custom slides yet—fallback images are used on the public site.</p>
        )}
      </div>

      <div className="space-y-10">
        {HOME_SECTION_KEYS.map((key) => {
          const meta = sectionLabels[key];
          const row = sections[key];
          return (
            <form key={key} id={`home-section-${key}`} action={saveHomeTextSectionAction} className="border border-line bg-white/50 p-6">
              <input type="hidden" name="section" value={key} />
              <h2 className="font-serif text-xl tracking-tight">{meta.heading}</h2>
              <p className="mt-2 max-w-prose text-sm text-muted">{meta.hint}</p>
              {key === "hero" ? (
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
              <label className="mt-4 block text-sm text-muted">
                Title
                <input
                  name="title"
                  defaultValue={row.title}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              {key === "artist_words" ? (
                <label className="mt-4 block text-sm text-muted">
                  Pull quote
                  <input
                    name="quote"
                    defaultValue={row.quote}
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
              ) : (
                <input type="hidden" name="quote" value={row.quote} />
              )}
              <label className="mt-4 block text-sm text-muted">
                {key === "artist_words" ? "Body (Markdown)" : "Body / intro text"}
                <textarea
                  name="body"
                  rows={key === "artist_words" ? 8 : 5}
                  defaultValue={row.body}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm leading-relaxed"
                />
              </label>
              <AdminDirtySave formId={`home-section-${key}`} />
            </form>
          );
        })}

        <form id="home-featured-series" action={saveHomeFeaturedSeriesAction} className="border border-line bg-white/50 p-6">
          <h2 className="font-serif text-xl tracking-tight">Featured series (up to 3)</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Leave a slot empty to fall back to the first series by Admin → Series sort order.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((slot) => (
              <label key={slot} className="block text-sm text-muted">
                Card {slot + 1}
                <select
                  name={`series_slot_${slot}`}
                  defaultValue={picks.seriesBySlot[slot] ?? ""}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                >
                  <option value="">— Auto —</option>
                  {featuredSeriesOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <AdminDirtySave formId="home-featured-series" />
        </form>

        <form id="home-journal" action={saveHomeJournalAction} className="border border-line bg-white/50 p-6">
          <h2 className="font-serif text-xl tracking-tight">Journal carousel (up to 3)</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Only published posts appear on the public site. Leave empty to use the three newest published posts.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((slot) => (
              <label key={slot} className="block text-sm text-muted">
                Card {slot + 1}
                <select
                  name={`post_slot_${slot}`}
                  defaultValue={picks.postBySlot[slot] ?? ""}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                >
                  <option value="">— Auto —</option>
                  {allPosts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                      {p.published ? "" : " (draft)"}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <AdminDirtySave formId="home-journal" />
        </form>

        <form id="home-selected-works" action={saveHomeSelectedWorksAction} className="border border-line bg-white/50 p-6">
          <h2 className="font-serif text-xl tracking-tight">Selected works (up to 3)</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Leave empty to use the first artwork in each of the three featured series (by series order).
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((slot) => (
              <label key={slot} className="block text-sm text-muted">
                Card {slot + 1}
                <select
                  name={`artwork_slot_${slot}`}
                  defaultValue={picks.artBySlot[slot] ?? ""}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                >
                  <option value="">— Auto —</option>
                  {artworkOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <AdminDirtySave formId="home-selected-works" />
        </form>

        <AdminExternalLink variant="secondary" href="/">
          View public home →
        </AdminExternalLink>
      </div>
    </div>
  );
}
