import { notFound } from "next/navigation";
import type { Series } from "@/db";
import { inArray } from "drizzle-orm";
import { upsertArtwork, upsertSeries, deleteSeries } from "@/app/admin/actions";
import { getDb } from "@/db";
import { artworkSeries } from "@/db/schema";
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
import { ARTWORK_PRICE_HINT } from "@/lib/artworkPrice";
import { exhibitionPublicHref, isExhibitionsParentSlug } from "@/lib/exhibitions";
import { richTextToPlain } from "@/lib/richText";
import { getSeriesDeleteImpact } from "@/lib/seriesDelete";
import {
  getSeriesById,
  listAdminSeriesMembershipOptions,
  listArtworksForHeroPicks,
  listArtworksForPublicGallery,
  listChildSeries,
  listHeroSlideshowSlots,
  listMediumGalleries,
  listSeries,
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
  const parentRow = s.parentSeriesId ? await getSeriesById(s.parentSeriesId) : null;
  const isExhibition = Boolean(parentRow && isExhibitionsParentSlug(parentRow.slug));
  const isChildSeries = Boolean(s.parentSeriesId) && !isExhibition;
  const [arts, mediumGalleries, membershipOptions, deleteImpact, statementPieceOptions, heroSlots, childSeries, allSeries] =
    await Promise.all([
      listArtworksForPublicGallery(s),
      listMediumGalleries(),
      listAdminSeriesMembershipOptions(),
      isMediumGallery ? Promise.resolve(null) : getSeriesDeleteImpact(s.id),
      listArtworksForHeroPicks(s),
      listHeroSlideshowSlots(s.id),
      isMediumGallery && !isStudioGallery ? listChildSeries(s.id) : Promise.resolve([]),
      listSeries(),
    ]);
  const artIds = arts.map((piece) => piece.id);
  const membershipRows =
    artIds.length === 0
      ? []
      : await getDb()
          .select({ artworkId: artworkSeries.artworkId, seriesId: artworkSeries.seriesId })
          .from(artworkSeries)
          .where(inArray(artworkSeries.artworkId, artIds));
  const homesByArtwork = new Map<string, Set<string>>();
  for (const piece of arts) {
    const homes = new Set<string>();
    if (piece.seriesId) homes.add(piece.seriesId);
    if (piece.mediumSeriesId) homes.add(piece.mediumSeriesId);
    homesByArtwork.set(piece.id, homes);
  }
  for (const row of membershipRows) homesByArtwork.get(row.artworkId)?.add(row.seriesId);
  const seriesById = new Map(allSeries.map((row) => [row.id, row]));
  const exhibitionParentIds = new Set(allSeries.filter((row) => isExhibitionsParentSlug(row.slug)).map((row) => row.id));
  const placeRank: Record<string, number> = {
    Portfolio: 0,
    Series: 1,
    Exhibition: 2,
    "Private gallery": 3,
    Gallery: 4,
  };
  const placesFor = (artworkId: string) =>
    [...(homesByArtwork.get(artworkId) ?? [])]
      .map((homeId) => seriesById.get(homeId))
      .filter((row): row is Series => Boolean(row && !isExhibitionsParentSlug(row.slug)))
      .map((row) => {
        const kind = isMediumGallerySlug(row.slug)
          ? "Portfolio"
          : row.parentSeriesId && exhibitionParentIds.has(row.parentSeriesId)
            ? "Exhibition"
            : row.isPrivate
              ? "Private gallery"
              : row.parentSeriesId
                ? "Series"
                : "Gallery";
        return { kind, title: row.title };
      })
      .sort((a, b) => placeRank[a.kind]! - placeRank[b.kind]! || a.title.localeCompare(b.title));
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

  const isPrivateGallery = !isMediumGallery && !isChildSeries && !isExhibition && s.isPrivate;
  const pageHref = isExhibition
    ? exhibitionPublicHref(s.slug)
    : isPrivateGallery
      ? s.accessToken
        ? `/private/${s.accessToken}`
        : undefined
      : artSeriesHref(s.slug);
  const pageName = isExhibition
    ? "This exhibition’s page"
    : isStudioGallery
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
    : isExhibition
      ? [
          {
            where: "Exhibitions page",
            detail: "the text on this exhibition’s card.",
            href: "/exhibitions",
          },
          searchPreview,
        ]
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
        <h1 className="font-serif text-3xl tracking-tight">
          {isExhibition ? "Edit exhibition" : isChildSeries ? "Edit series" : "Edit gallery"}
        </h1>
        {!isMediumGallery ? (
          <a href="#delete" className={`${adminBtnDanger} mt-4`}>
            {isExhibition ? "Delete exhibition" : isChildSeries ? "Delete series" : "Delete gallery"}
          </a>
        ) : null}
        <p className="mt-3 text-sm text-muted">
          {isExhibition ? (
            <>
              Exhibition · <span className="text-ink/80">/exhibitions/{s.slug}</span> · {arts.length}{" "}
              {arts.length === 1 ? "painting" : "paintings"}
            </>
          ) : s.isPrivate ? (
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

      {!isMediumGallery && !isChildSeries && !isExhibition ? (
        <AdminGalleryPrivacyPanel seriesId={s.id} isPrivate={s.isPrivate} accessToken={s.accessToken} />
      ) : null}

      <form
        id="series-edit"
        data-admin-section={isExhibition ? "Exhibition details" : isChildSeries ? "Series details" : "Gallery details"}
        action={upsertSeries}
        className="space-y-6 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value={s.id} />
        {isExhibition ? <input type="hidden" name="exhibitionParent" value="1" /> : null}
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
          listingSurface={isExhibition ? "exhibition" : isChildSeries ? "series" : "portfolio"}
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
            <h2 className="font-serif text-2xl tracking-tight">
              {isExhibition ? "Paintings in this exhibition" : "Paintings in this gallery"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Edit changes the title, size, material, description, and price everywhere that painting appears. Remove
              takes it out of this {isExhibition ? "exhibition" : "gallery"} and leaves it in any other gallery.
            </p>
          </div>
        </div>

        <AdminGalleryArtworkTable
          seriesId={s.id}
          returnPath={isExhibition ? `/admin/exhibitions/${s.id}` : `/admin/series/${s.id}`}
          rows={arts.map((a) => ({
            id: a.id,
            title: a.title,
            medium: a.medium,
            size: a.size,
            description: richTextToPlain(a.description),
            status: a.status,
            price: a.price,
            places: placesFor(a.id),
            image: a.image,
            alt: a.alt,
            hidden: a.hidden,
            alsoElsewhere: [...(homesByArtwork.get(a.id) ?? [])].some((homeId) => homeId !== s.id),
          }))}
        />
      </div>

      <div id="add-artwork" data-admin-section="Add artwork" className="border border-line bg-white/50 p-6">
        <h3 className="font-serif text-xl tracking-tight">Add artwork</h3>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Choose a painting to add one that is already on the site. It keeps its title, size, material, description,
          and price. Changing those later updates every place that painting appears. Upload an image to create a new
          painting.
        </p>
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
            <label className="block text-sm text-muted md:col-span-2">
              Price
              <input
                name="price"
                inputMode="decimal"
                placeholder="1200"
                className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
              />
              <span className="mt-1.5 block text-xs leading-relaxed text-muted">{ARTWORK_PRICE_HINT}</span>
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
            <AdminFilePicker
              name="image"
              label="Add image"
              buttonLabel="Upload image"
              required
              linkSeriesId={s.id}
            />
            <label className="block text-sm text-muted">
              Sort order
              <input name="sortOrder" defaultValue={String((arts[arts.length - 1]?.sortOrder ?? -1) + 1)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <AdminSaveTracker formId="series-add-artwork" />
        </form>
      </div>

      {!isMediumGallery ? (
        <div id="delete" data-admin-section={isExhibition ? "Delete exhibition" : isChildSeries ? "Delete series" : "Delete gallery"} className="border border-line bg-white/50 p-6">
          <h3 className="font-serif text-xl tracking-tight text-ink">
            {isExhibition ? "Delete exhibition" : isChildSeries ? "Delete series" : "Delete gallery"}
          </h3>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Remove this {isExhibition ? "exhibition" : isChildSeries ? "series" : "gallery"} from the site. Paintings
            that also appear in other galleries will stay there.
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
                returnTo={isExhibition ? `/admin/exhibitions/${s.id}` : `/admin/series/${s.id}`}
                redirectAfter={isExhibition ? "/admin/exhibitions" : "/admin/series"}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
