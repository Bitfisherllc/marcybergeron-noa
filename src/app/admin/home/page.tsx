import Image from "next/image";
import Link from "next/link";
import {
  addHomeSlideshowAction,
  addHomeSlideshowFromArtworkAction,
  deleteHomeSlideshowAction,
  reorderHomeSlideshowAction,
  saveHomeAllAction,
} from "@/app/admin/home/actions";
import { HOME_SECTION_KEYS, type HomeSectionKey } from "@/lib/homeDefaults";
import {
  getHomePickStateForAdmin,
  listHomeSectionsForAdmin,
  listHomeSlideshowForAdmin,
} from "@/lib/homePage";
import { listAllPostsAdmin, listArtworksWithSeriesForPicker, listSeries } from "@/lib/queries";

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

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [sections, slides, picks, allSeries, allPosts, artworkOptions] = await Promise.all([
    listHomeSectionsForAdmin(),
    listHomeSlideshowForAdmin(),
    getHomePickStateForAdmin(),
    listSeries(),
    listAllPostsAdmin(),
    listArtworksWithSeriesForPicker(),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Home page</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Choose homepage slideshow and featured cards. To reorder paintings inside a gallery, use{" "}
          <Link className="text-ink/80 underline-offset-2 hover:underline" href="/admin/series">
            Galleries &amp; artwork
          </Link>
          .
        </p>
        {sp.saved ? <p className="mt-3 text-sm text-ink">Saved. Public home is updated.</p> : null}
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
          painting from your galleries.
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
          <label className="block text-sm text-muted">
            Add image
            <input name="slide" type="file" accept="image/*" className="mt-2 block w-full max-w-xs text-xs" />
          </label>
          <label className="block min-w-[12rem] text-sm text-muted">
            Alt text
            <input name="slide_alt" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <button
            type="submit"
            className="border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90"
          >
            Upload slide
          </button>
        </form>
        {slides.length > 0 ? (
          <ul className="mt-6 space-y-4 border-t border-line pt-6">
            {slides.map((s, i) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-4 border-b border-line/80 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-black/[0.04]">
                  <Image src={s.image} alt="" fill className="object-cover" sizes="96px" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="truncate text-muted">{s.image}</div>
                  <div className="text-ink/80">{s.alt}</div>
                  <div className="text-xs text-muted">Order {i + 1}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={reorderHomeSlideshowAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="dir" value="up" />
                    <button
                      type="submit"
                      className="border border-line px-3 py-1.5 text-xs uppercase hover:bg-black/[0.03]"
                      disabled={i === 0}
                    >
                      Up
                    </button>
                  </form>
                  <form action={reorderHomeSlideshowAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="dir" value="down" />
                    <button
                      type="submit"
                      className="border border-line px-3 py-1.5 text-xs uppercase hover:bg-black/[0.03]"
                      disabled={i === slides.length - 1}
                    >
                      Down
                    </button>
                  </form>
                  <form action={deleteHomeSlideshowAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="border border-red-200 px-3 py-1.5 text-xs text-red-800 uppercase">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No custom slides yet—fallback images are used on the public site.</p>
        )}
      </div>

      <form action={saveHomeAllAction} className="space-y-10">
        {HOME_SECTION_KEYS.map((key) => {
          const meta = sectionLabels[key];
          const row = sections[key];
          return (
            <fieldset key={key} className="border border-line bg-white/50 p-6">
              <legend className="font-serif text-xl tracking-tight px-1">{meta.heading}</legend>
              <p className="mt-2 max-w-prose text-sm text-muted">{meta.hint}</p>
              {key === "hero" ? (
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
              <label className="mt-4 block text-sm text-muted">
                Title
                <input
                  name={`${key}_title`}
                  defaultValue={row.title}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              {key === "artist_words" ? (
                <label className="mt-4 block text-sm text-muted">
                  Pull quote
                  <input
                    name={`${key}_quote`}
                    defaultValue={row.quote}
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
              ) : (
                <input type="hidden" name={`${key}_quote`} value={row.quote} />
              )}
              <label className="mt-4 block text-sm text-muted">
                {key === "artist_words" ? "Body (Markdown)" : "Body / intro text"}
                <textarea
                  name={`${key}_body`}
                  rows={key === "artist_words" ? 8 : 5}
                  defaultValue={row.body}
                  className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm leading-relaxed"
                />
              </label>
            </fieldset>
          );
        })}

        <fieldset className="border border-line bg-white/50 p-6">
          <legend className="font-serif text-xl tracking-tight px-1">Featured series (up to 3)</legend>
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
                  {allSeries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border border-line bg-white/50 p-6">
          <legend className="font-serif text-xl tracking-tight px-1">Journal carousel (up to 3)</legend>
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
        </fieldset>

        <fieldset className="border border-line bg-white/50 p-6">
          <legend className="font-serif text-xl tracking-tight px-1">Selected works (up to 3)</legend>
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
        </fieldset>

        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            className="border border-ink bg-ink px-6 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90"
          >
            Save home text &amp; cards
          </button>
          <Link className="self-center text-sm text-muted hover:text-ink" href="/">
            View public home →
          </Link>
        </div>
      </form>
    </div>
  );
}
