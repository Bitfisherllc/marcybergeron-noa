import { upsertSeries } from "@/app/admin/actions";
import { AdminChildSeriesList } from "@/components/AdminChildSeriesList";
import { AdminHeroSlideshowField } from "@/components/AdminHeroSlideshowField";
import { AdminLink } from "@/components/AdminLink";
import { AdminRichTextEditor } from "@/components/AdminRichTextEditor";
import { AdminSaveTracker } from "@/components/AdminSaveTracker";
import { AdminWhereShown } from "@/components/AdminWhereShown";
import { ensureExhibitionsParent } from "@/lib/exhibitions";
import { resolveInteriorHeroSlides } from "@/lib/featuredArtwork";
import { isPlaceholderGalleryStatement } from "@/lib/galleryCopy";
import {
  listArtworksForSeries,
  listExhibitions,
  listHeroSlideshowSlots,
} from "@/lib/queries";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Add a title for the exhibitions page.",
  slug: "That URL slug is already used. Choose a different one.",
};

export default async function AdminExhibitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const parent = await ensureExhibitionsParent();
  const [exhibitions, heroSlots] = await Promise.all([
    listExhibitions(),
    listHeroSlideshowSlots(parent.id),
  ]);
  const pieceGroups = await Promise.all(exhibitions.map((row) => listArtworksForSeries(row.id)));
  const pieces = pieceGroups.flat().map((piece) => ({
    id: piece.id,
    title: piece.title,
    image: piece.image,
  }));
  const error = sp.error ? (ERROR_MESSAGES[sp.error] ?? "Something went wrong. Try again.") : null;
  const usingRandomSlideshow = heroSlots.every((slot) => !slot.image && !slot.artworkId);
  const liveSlideshow = resolveInteriorHeroSlides(parent, pieceGroups.flat(), heroSlots).map((hero) => ({
    src: hero.image,
    title: hero.artwork?.title ?? hero.title,
  }));
  const aboutValue = isPlaceholderGalleryStatement(parent.content) ? "" : parent.content;

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Exhibitions</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">
            The public page at <span className="text-ink/80">/exhibitions</span> lists exhibition cards only.
            Paintings are added inside each exhibition, the same way a series gallery works.
          </p>
        </div>
        <AdminLink variant="primary" href="/admin/exhibitions/new">
          Add an exhibition
        </AdminLink>
      </div>

      {error ? (
        <p className="border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-900">{error}</p>
      ) : null}

      <form
        id="exhibitions-index"
        data-admin-section="Exhibitions page"
        action={upsertSeries}
        className="space-y-6 border border-line bg-white/50 p-6"
      >
        <input type="hidden" name="id" value={parent.id} />
        <input type="hidden" name="exhibitionsIndex" value="1" />
        <label className="block text-sm text-muted">
          Title
          <input
            name="title"
            required
            defaultValue={parent.title}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
        <div className="block text-sm text-muted">
          Intro
          <AdminRichTextEditor name="excerpt" defaultValue={parent.excerpt} size="sm" ariaLabel="Intro" />
          <AdminWhereShown
            places={[
              {
                where: "Exhibitions page",
                detail: "the introduction under the title. It stays hidden when About is filled in.",
                href: "/exhibitions",
              },
              {
                where: "Search results and link previews",
                detail: "the short description Google and social media show for this page.",
              },
            ]}
            note="Keep it to a sentence or two."
          />
        </div>
        <div className="block text-sm text-muted">
          About
          <AdminRichTextEditor name="content" defaultValue={aboutValue} size="lg" headings ariaLabel="About" />
          <AdminWhereShown
            places={[
              {
                where: "Exhibitions page",
                detail: "the About section under the title.",
                href: "/exhibitions",
              },
            ]}
          />
        </div>
        <AdminHeroSlideshowField
          pieces={pieces}
          slots={heroSlots}
          liveSlides={liveSlideshow}
          usingRandom={usingRandomSlideshow}
          showOnPage={parent.showHeroSlideshow}
        />
        <AdminSaveTracker formId="exhibitions-index" />
      </form>

      <div data-admin-section="Exhibitions" className="border border-line bg-white/50 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Exhibitions</h2>
            <p className="mt-2 max-w-prose text-sm text-muted">
              Each card on the public page opens that exhibition. Use the arrow buttons to change the order.
            </p>
          </div>
          <AdminLink variant="primary" href="/admin/exhibitions/new">
            Add an exhibition
          </AdminLink>
        </div>
        {exhibitions.length > 0 ? (
          <AdminChildSeriesList
            mediumId={parent.id}
            rows={exhibitions.map((row) => ({ id: row.id, title: row.title }))}
            manageBase="/admin/exhibitions"
            manageLabel="Manage exhibition"
          />
        ) : (
          <p className="mt-6 text-sm text-muted">No exhibitions yet.</p>
        )}
      </div>
    </div>
  );
}
