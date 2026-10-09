import { notFound } from "next/navigation";
import { upsertArtwork, upsertSeries, deleteSeries } from "@/app/admin/actions";
import { AdminChildSeriesList } from "@/components/AdminChildSeriesList";
import { hasCoverImage } from "@/components/AdminCoverThumb";
import { AdminDeleteSeriesForm } from "@/components/AdminDeleteSeriesForm";
import { AdminFeaturedArtworkField } from "@/components/AdminFeaturedArtworkField";
import { AdminHeroSlideshowField } from "@/components/AdminHeroSlideshowField";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminGalleryPrivacyPanel } from "@/components/AdminGalleryPrivacyPanel";
import { AdminGalleryArtworkTable } from "@/components/AdminGalleryArtworkTable";
import { AdminLink, adminBtnDanger } from "@/components/AdminLink";
import { AdminMediumGalleryField } from "@/components/AdminMediumGalleryField";
import { AdminRichTextEditor } from "@/components/AdminRichTextEditor";
import { AdminSaveTracker } from "@/components/AdminSaveTracker";
import { AdminSeriesMediumField } from "@/components/AdminSeriesMediumField";
import { AdminWhereShown, type WhereShownPlace } from "@/components/AdminWhereShown";
import { resolveInteriorHeroSlides } from "@/lib/featuredArtwork";
import { isPlaceholderGalleryStatement } from "@/lib/galleryCopy";
import { mediumGalleryAbout } from "@/lib/mediumGalleryCopy";
import { isMediumGallerySlug, isStudioGallerySlug, publicPortfolioGalleries } from "@/lib/mediumGalleries";
import { artSeriesHref } from "@/lib/routeSlug";
import { getSeriesDeleteImpact } from "@/lib/seriesDelete";
import {
  getSeriesById,
  listAdminSeriesMembershipOptions,
  listArtworksForHeroPicks,
  listArtworksForPublicGallery,
  listChildSeries,
  listHeroSlideshowSlots,
  listMediumGalleries,
} from "@/lib/queries";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Title and slug are required.",
  slug: "That URL slug is already used by another gallery. Choose a different one.",
  medium: "Choose which medium this series belongs to.",
};

export default async function EditSeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const s = await getSeriesById(id);
  if (!s) notFound();
  const isMediumGallery = isMediumGallerySlug(s.slug);
  const isStudioGallery = isStudioGallerySlug(s.slug);
  const isChildSeries = Boolean(s.parentSeriesId);
  const [arts, mediumGalleries, membershipOptions, deleteImpact, statementPieceOptions, heroSlots, childSeries] =
    await Promise.all([
      listArtworksForPublicGallery(s),
      listMediumGalleries(),
      listAdminSeriesMembershipOptions(),
      isMediumGallery ? Promise.resolve(null) : getSeriesDeleteImpact(s.id),
      listArtworksForHeroPicks(s),
      listHeroSlideshowSlots(s.id),
      isMediumGallery && !isStudioGallery ? listChildSeries(s.id) : Promise.resolve([]),
    ]);
  const seriesMediums = publicPortfolioGalleries(mediumGalleries);
  const parentMedium = isChildSeries ? mediumGalleries.find((m) => m.id === s.parentSeriesId) : undefined;
  const error = sp.error ? (ERROR_MESSAGES[sp.error] ?? "Something went wrong. Try again.") : null;
  const usingRandomSlideshow = heroSlots.every((slot) => !slot.image && !slot.artworkId);
  const liveSlideshow = resolveInteriorHeroSlides(s, statementPieceOptions, heroSlots).map((hero) => ({
    src: hero.image,
    title: hero.artwork?.title ?? hero.title,
  }));
  const aboutValue = isPlaceholderGalleryStatement(s.content)
    ? (mediumGalleryAbout(s.slug) ?? s.content)
    : s.content;

  const isPrivateGallery = !isMediumGallery && !isChildSeries && s.isPrivate;
  const pageHref = isPrivateGallery ? (s.accessToken ? `/private/${s.accessToken}` : undefined) : artSeriesHref(s.slug);
  const pageName = isStudioGallery
    ? "The Studio page"
    : isPrivateGallery
      ? "The private gallery page"
      : isChildSeries
        ? "This series’ page"
        : "This gallery’s page";
  const searchPreview: WhereShownPlace = isPrivateGallery
    ? { where: "Link previews", detail: "the short description shown when the private link is shared in an email or message." }
    : {
        where: "Search results and link previews",
        detail: "the short description Google and social media show for this page.",
      };
  const excerptPlaces: WhereShownPlace[] = isStudioGallery || isPrivateGallery
    ? [searchPreview]
    : isChildSeries
      ? [
          {
            where: parentMedium ? `${parentMedium.title} page` : "The medium’s page",
            detail: "the text on this series’ card in the Series list.",
            href: parentMedium ? artSeriesHref(parentMedium.slug) : undefined,
          },
          {
            where: "Home page",
            detail: "the text on this series’ card in the featured series section, when this series is picked there.",
            href: "/",
          },
          searchPreview,
        ]
      : [
          { where: "Portfolio page", detail: "the text on this gallery’s card.", href: "/medium" },
          searchPreview,
        ];
  const excerptNote = isMediumGallery && !isStudioGallery
    ? "Keep it to a sentence or two. It is not shown on the gallery page itself."
    : "Keep it to a sentence or two. It only shows on the page itself if the About box below is empty.";
  const aboutPlaces: WhereShownPlace[] = [
    {
      where: pageName,
      detail: isStudioGallery
        ? "the About text beside the studio slideshow, under the title."
        : "the About section directly under the title, at the top of the page.",
      href: pageHref,
    },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">{isChildSeries ? "Edit series" : "Edit gallery"}</h1>
        {!isMediumGallery ? (
          <a href="#delete" className={`${adminBtnDanger} mt-4`}>
            {isChildSeries ? "Delete series" : "Delete gallery"}
          </a>
        ) : null}
        <p className="mt-3 text-sm text-muted">
          {s.isPrivate ? (
            <>
              Private gallery · {arts.length} {arts.length === 1 ? "painting" : "paintings"} · not listed on the
              public portfolio
            </>
          ) : isChildSeries ? (
            <>
              Series{parentMedium ? ` in ${parentMedium.title}` : ""} ·{" "}
              <span className="text-ink/80">/art/{s.slug}</span> · {arts.length}{" "}
              {arts.length === 1 ? "painting" : "paintings"}
            </>
          ) : isMediumGallery ? (
            <>
              Portfolio gallery · <span className="text-ink/80">/art/{s.slug}</span> · {arts.length}{" "}
              {arts.length === 1 ? "painting" : "paintings"}
            </>
          ) : (
            <>
              Public page: <span className="text-ink/80">/art/{s.slug}</span> · {arts.length}{" "}
              {arts.length === 1 ? "painting" : "paintings"}
            </>
          )}
        </p>
      </div>

      {error ? (
        <p className="border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-900">{error}</p>
      ) : null}

      {!isMediumGallery && !isChildSeries ? (
        <AdminGalleryPrivacyPanel seriesId={s.id} isPrivate={s.isPrivate} accessToken={s.accessToken} />
      ) : null}

      <form
        id="series-edit"
        data-admin-section={isChildSeries ? "Series details" : "Gallery details"}
        action={upsertSeries}
        className="space-y-6 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value={s.id} />
        {isChildSeries ? <AdminSeriesMediumField mediums={seriesMediums} value={s.parentSeriesId} /> : null}
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Title
            <input name="title" required defaultValue={s.title} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Slug
            <input name="slug" required defaultValue={s.slug} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="block text-sm text-muted">
          Listing excerpt
          <AdminRichTextEditor name="excerpt" defaultValue={s.excerpt} size="sm" ariaLabel="Listing excerpt" />
          <AdminWhereShown places={excerptPlaces} note={excerptNote} />
        </div>
        <div className="block text-sm text-muted">
          About
          <AdminRichTextEditor name="content" defaultValue={aboutValue} size="lg" headings ariaLabel="About" />
          <AdminWhereShown places={aboutPlaces} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Sort order
            <input name="sortOrder" defaultValue={String(s.sortOrder)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
        </div>
        <AdminFeaturedArtworkField
          mode={s.featuredArtworkMode}
          artworkId={s.featuredArtworkId}
          pieces={statementPieceOptions}
          listingSurface={isChildSeries ? "series" : "portfolio"}
          cardImage={hasCoverImage(s.featuredImage) ? s.featuredImage : ""}
        />
        <AdminHeroSlideshowField
          pieces={statementPieceOptions}
          slots={heroSlots}
          liveSlides={liveSlideshow}
          usingRandom={usingRandomSlideshow}
          showOnPage={isStudioGallery || s.showHeroSlideshow}
          lockDisplayOn={isStudioGallery}
        />
        <AdminSaveTracker formId="series-edit" />
      </form>

      {isMediumGallery && !isStudioGallery ? (
        <div data-admin-section="Series in this medium" className="border border-line bg-white/50 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl tracking-tight">Series in this medium</h2>
              <p className="mt-2 max-w-prose text-sm text-muted">
                Listed on the public page under this medium’s gallery, in this order. Use the arrow buttons to change
                the order.
              </p>
            </div>
            <AdminLink variant="primary" href={`/admin/series/new?medium=${encodeURIComponent(s.id)}`}>
              Add a series
            </AdminLink>
          </div>
          {childSeries.length > 0 ? (
            <AdminChildSeriesList mediumId={s.id} rows={childSeries.map((c) => ({ id: c.id, title: c.title }))} />
          ) : (
            <p className="mt-6 text-sm text-muted">No series yet.</p>
          )}
        </div>
      ) : null}

      <div data-admin-section="Paintings in this gallery" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Paintings in this gallery</h2>
            <p className="mt-2 text-sm text-muted">
              All photos shown on the public gallery page. Use the arrow buttons to change order.
            </p>
          </div>
        </div>

        <AdminGalleryArtworkTable
          seriesId={s.id}
          rows={arts.map((a) => ({
            id: a.id,
            title: a.title,
            medium: a.medium,
            size: a.size,
            image: a.image,
            alt: a.alt,
          }))}
        />
      </div>

      <div id="add-artwork" data-admin-section="Add artwork" className="border border-line bg-white/50 p-6">
        <h3 className="font-serif text-xl tracking-tight">Add artwork</h3>
        <form id="series-add-artwork" action={upsertArtwork} className="mt-6 space-y-4">
          <input type="hidden" name="id" value="" />
          <input type="hidden" name="contextSeriesId" value={s.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-muted">
              Title
              <input name="title" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Status
              <select name="status" defaultValue="unknown" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm">
                <option value="unknown">Unknown</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-muted">
              Material
              <input name="medium" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Size
              <input name="size" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <AdminMediumGalleryField
            galleries={mediumGalleries}
            value={isMediumGallery ? s.id : null}
            required={isMediumGallery}
          />
          <div className="block text-sm text-muted">
            Description (optional)
            <AdminRichTextEditor name="description" size="sm" ariaLabel="Description" />
          </div>
          <label className="block text-sm text-muted">
            Alt text (optional)
            <input name="alt" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminFilePicker name="image" label="Add image" buttonLabel="Upload image" required />
            <label className="block text-sm text-muted">
              Sort order
              <input name="sortOrder" defaultValue={String((arts[arts.length - 1]?.sortOrder ?? -1) + 1)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <AdminSaveTracker formId="series-add-artwork" />
        </form>
      </div>

      {!isMediumGallery ? (
        <div id="delete" data-admin-section={isChildSeries ? "Delete series" : "Delete gallery"} className="border border-line bg-white/50 p-6">
          <h3 className="font-serif text-xl tracking-tight text-ink">
            {isChildSeries ? "Delete series" : "Delete gallery"}
          </h3>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Remove this {isChildSeries ? "series" : "gallery"} from the site. Paintings that also appear in other
            galleries will stay there.
          </p>
          <div className="mt-4">
            {deleteImpact ? (
              <AdminDeleteSeriesForm
                action={deleteSeries}
                impact={deleteImpact}
                portfolioOptions={membershipOptions
                  .filter((row) => row.id !== s.id)
                  .map((row) => ({ id: row.id, title: row.title }))}
                mediumOptions={mediumGalleries
                  .filter((row) => row.id !== s.id)
                  .map((row) => ({ id: row.id, title: row.title }))}
                returnTo={`/admin/series/${s.id}`}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
