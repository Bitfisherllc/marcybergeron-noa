import { saveFaviconAction, saveHomeSlideshowAction, saveHomeTextSectionAction } from "@/app/admin/home/actions";
import { AdminArtworkSelect } from "@/components/AdminArtworkSelect";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminHeroSlideshowField } from "@/components/AdminHeroSlideshowField";
import { AdminExternalLink, AdminLink } from "@/components/AdminLink";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { HOME_SLIDESHOW_MAX } from "@/lib/featuredArtwork";
import { HOME_SECTION_KEYS, isHomeToggleableSection, type HomeSectionKey } from "@/lib/homeDefaults";
import {
  getHomePickStateForAdmin,
  listHomeSectionsForAdmin,
  listHomeSlideshowForAdmin,
} from "@/lib/homePage";
import { listHomeSlideLinkGroups } from "@/lib/homeSlideLinks";
import { getFaviconForAdmin } from "@/lib/siteFavicon";
import { heroHomeSlides, listOilColdWaxChildSeries, listAllPostsAdmin, listArtworksWithSeriesForPicker } from "@/lib/queries";

const sectionLabels: Record<HomeSectionKey, { heading: string; hint: string }> = {
  hero: {
    heading: "Opening (hero)",
    hint: "Eyebrow line, main headline, and opening paragraph beside the slideshow.",
  },
  featured_series: {
    heading: "Featured series",
    hint: "Turn the section on or off, edit the title and intro, and choose the three series cards in this same box.",
  },
  journal: {
    heading: "Journal",
    hint: "Turn the section on or off, edit the title and intro, and pin up to three posts in this same box.",
  },
  artist_words: {
    heading: "In the artist’s words",
    hint: "Section title, pull quote (single line), then body as Markdown (paragraphs, [links](/path)).",
  },
  selected_works: {
    heading: "Selected works",
    hint: "Turn the section on or off, edit the title and intro, and choose three paintings in this same box.",
  },
};

const savedLabels: Record<string, string> = {
  hero: "Opening (hero)",
  featured_series: "Featured series",
  journal: "Journal",
  artist_words: "In the artist’s words",
  selected_works: "Selected works",
  featured_series_picks: "Featured series",
  journal_picks: "Journal",
  selected_works_picks: "Selected works",
  slideshow: "Home page slideshow",
  favicon: "Browser tab icon",
};

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [sections, slides, picks, featuredSeriesOptions, allPosts, artworkOptions, favicon, slideLinkGroups] =
    await Promise.all([
      listHomeSectionsForAdmin(),
      listHomeSlideshowForAdmin(),
      getHomePickStateForAdmin(),
      listOilColdWaxChildSeries(),
      listAllPostsAdmin("news"),
      listArtworksWithSeriesForPicker(),
      getFaviconForAdmin(),
      listHomeSlideLinkGroups(),
    ]);
  const savedLabel = sp.saved ? savedLabels[sp.saved] ?? sp.saved : null;
  const usingRandomSlideshow = slides.length === 0;
  const fallbackSlides = usingRandomSlideshow ? (await heroHomeSlides()).slice(0, HOME_SLIDESHOW_MAX) : [];
  const byImage = new Map(artworkOptions.map((piece) => [piece.image, piece.id]));
  const slideshowSlots = slides.slice(0, HOME_SLIDESHOW_MAX).map((slide) => ({
    artworkId: byImage.get(slide.image) ?? null,
    image: slide.image,
    href: slide.href ?? "",
  }));
  const liveSlideshow = usingRandomSlideshow
    ? fallbackSlides.map((slide) => ({ src: slide.src, title: slide.title }))
    : slides.slice(0, HOME_SLIDESHOW_MAX).map((slide) => ({
        src: slide.image,
        title: slide.title || artworkOptions.find((piece) => piece.image === slide.image)?.title || "",
      }));
  const slideshowPieces = artworkOptions.map((piece) => ({
    id: piece.id,
    title: piece.title,
    image: piece.image,
    label: piece.label,
    href: piece.href,
    gallery: piece.gallery,
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

      <form id="home-favicon" action={saveFaviconAction} className="border border-line bg-white/50 p-6">
        <h2 className="font-serif text-xl tracking-tight">Browser tab icon</h2>
        <p className="mt-2 max-w-prose text-sm text-muted">
          The small image in the browser tab. A square PNG works best (32–512 pixels). You can also use ICO, SVG, or
          WebP. Clear the field to return to the original site icon.
        </p>
        <div className="mt-6 flex flex-wrap items-start gap-6">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- ico/svg favicons */}
            <img src={favicon.src} alt="" className="h-full w-full object-contain p-1" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-xs text-muted">
              {favicon.isCustom
                ? "Custom icon is live on the public site."
                : "Using the original site icon until you upload a new one."}
            </p>
            <AdminFilePicker
              name="favicon"
              label="Add icon"
              buttonLabel="Upload icon"
              accept=".ico,.png,.svg,.webp,.jpg,.jpeg,image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp"
              existingValue={favicon.isCustom ? favicon.src : ""}
              preview="none"
              allowClear
            />
          </div>
        </div>
        <AdminDirtySave formId="home-favicon" />
      </form>

      <form id="home-slideshow" action={saveHomeSlideshowAction} className="border border-line bg-white/50 p-6">
        <AdminHeroSlideshowField
          variant="home"
          fieldPrefix="homeSlide"
          maxSlots={HOME_SLIDESHOW_MAX}
          pieces={slideshowPieces}
          slots={slideshowSlots}
          liveSlides={liveSlideshow}
          usingRandom={usingRandomSlideshow}
          linkGroups={slideLinkGroups}
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
              {isHomeToggleableSection(key) ? (
                <HomeSectionVisibilityField
                  defaultOn={row.visible}
                  hint={
                    key === "journal"
                      ? "When on, the journal carousel appears on the home page."
                      : key === "selected_works"
                        ? "When on, the three selected paintings appear on the home page."
                        : "When on, the three featured series cards appear on the home page."
                  }
                />
              ) : null}
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
              {key === "featured_series" ? (
                <div className="mt-8 border-t border-line pt-6">
                  <p className="text-sm text-ink">Series cards</p>
                  <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
                    Choose from Series (Standing Tall As Trees, Born in France, Mexico as Muse)—not Portfolio
                    galleries. Leave every slot on Auto to use those three in menu order.
                  </p>
                  <div className="mt-4 grid gap-6 sm:grid-cols-3">
                    {[0, 1, 2].map((slot) => (
                      <label key={slot} className="block text-sm text-muted">
                        Card {slot + 1}
                        <select
                          name={`series_slot_${slot}`}
                          defaultValue={
                            featuredSeriesOptions.some((s) => s.id === picks.seriesBySlot[slot])
                              ? (picks.seriesBySlot[slot] ?? "")
                              : ""
                          }
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
                </div>
              ) : null}
              {key === "journal" ? (
                <div className="mt-8 border-t border-line pt-6">
                  <p className="text-sm text-ink">Pinned posts</p>
                  <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
                    All published posts appear in the carousel. Pin up to three to show first; the rest follow in date
                    order.
                  </p>
                  <div className="mt-4 grid gap-6 sm:grid-cols-3">
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
                </div>
              ) : null}
              {key === "selected_works" ? (
                <div className="mt-8 border-t border-line pt-6">
                  <p className="text-sm text-ink">Paintings</p>
                  <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
                    Choose three paintings from your galleries. Each card on the home page uses the painting you pick
                    here.
                  </p>
                  <div className="mt-4 grid gap-6 sm:grid-cols-3">
                    {[0, 1, 2].map((slot) => (
                      <div key={slot} className="space-y-2 text-sm text-muted">
                        <p>Card {slot + 1}</p>
                        <AdminArtworkSelect
                          visual
                          name={`artwork_slot_${slot}`}
                          defaultValue={picks.artBySlot[slot] ?? ""}
                          emptyLabel="— Auto —"
                          options={artworkOptions.map((o) => ({
                            id: o.id,
                            label: o.label,
                            image: o.image,
                            gallery: o.gallery,
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <AdminDirtySave formId={`home-section-${key}`} />
            </form>
          );
        })}

        <AdminExternalLink variant="secondary" href="/">
          View public home →
        </AdminExternalLink>
      </div>
    </div>
  );
}

function HomeSectionVisibilityField({ defaultOn, hint }: { defaultOn: boolean; hint: string }) {
  return (
    <label className="mt-5 flex items-start gap-3 text-sm text-ink">
      <input type="checkbox" name="visible" value="on" defaultChecked={defaultOn} className="mt-1 border border-line" />
      <span>
        <span className="font-medium">Show on the home page</span>
        <span className="block text-xs leading-relaxed text-muted">{hint}</span>
        {!defaultOn ? (
          <span className="mt-1 block text-xs text-ink/80">Currently hidden on the public home page.</span>
        ) : null}
      </span>
    </label>
  );
}
