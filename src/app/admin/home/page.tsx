import {
  saveHomeFeaturedSeriesAction,
  saveHomeJournalAction,
  saveHomeSelectedWorksAction,
  saveHomeSlideshowAction,
  saveHomeTextSectionAction,
} from "@/app/admin/home/actions";
import { AdminHeroSlideshowField } from "@/components/AdminHeroSlideshowField";
import { AdminExternalLink, AdminLink } from "@/components/AdminLink";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { HERO_SLIDESHOW_MAX } from "@/lib/featuredArtwork";
import { HOME_SECTION_KEYS, type HomeSectionKey } from "@/lib/homeDefaults";
import {
  getHomePickStateForAdmin,
  listHomeSectionsForAdmin,
  listHomeSlideshowForAdmin,
} from "@/lib/homePage";
import { heroHomeSlides, listMediumGalleries, listAllPostsAdmin, listArtworksWithSeriesForPicker } from "@/lib/queries";

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
  slideshow: "Home page slideshow",
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
    listAllPostsAdmin("news"),
    listArtworksWithSeriesForPicker(),
  ]);

  const featuredSeriesOptions = portfolioGalleries;
  const savedLabel = sp.saved ? savedLabels[sp.saved] ?? sp.saved : null;
  const usingRandomSlideshow = slides.length === 0;
  const fallbackSlides = usingRandomSlideshow ? (await heroHomeSlides()).slice(0, HERO_SLIDESHOW_MAX) : [];
  const byImage = new Map(artworkOptions.map((piece) => [piece.image, piece.id]));
  const slideshowSlots = slides.slice(0, HERO_SLIDESHOW_MAX).map((slide) => ({
    artworkId: byImage.get(slide.image) ?? null,
    image: slide.image,
  }));
  const liveSlideshow = usingRandomSlideshow
    ? fallbackSlides.map((slide) => ({ src: slide.src, title: slide.title }))
    : slides.slice(0, HERO_SLIDESHOW_MAX).map((slide) => ({
        src: slide.image,
        title: slide.title || artworkOptions.find((piece) => piece.image === slide.image)?.title || "",
      }));
  const slideshowPieces = artworkOptions.map((piece) => ({
    id: piece.id,
    title: piece.title,
    image: piece.image,
    label: piece.label,
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
        {sp.error ? (
          <p className="mt-3 text-sm text-red-700">{decodeURIComponent(sp.error)}</p>
        ) : null}
      </div>

      <form id="home-slideshow" action={saveHomeSlideshowAction} className="border border-line bg-white/50 p-6">
        <AdminHeroSlideshowField
          variant="home"
          fieldPrefix="homeSlide"
          pieces={slideshowPieces}
          slots={slideshowSlots}
          liveSlides={liveSlideshow}
          usingRandom={usingRandomSlideshow}
        />
        <AdminDirtySave formId="home-slideshow" />
      </form>

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
          <h2 className="font-serif text-xl tracking-tight">Journal carousel</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            All published posts appear in the home carousel. Optionally pin up to three posts to show first; the rest follow in date order.
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
            Choose three paintings from your galleries. Change them anytime — each card on the home page uses the
            painting you pick here.
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
