import { setSeriesPrivacy } from "@/app/admin/actions";
import { AdminCoverThumb } from "@/components/AdminCoverThumb";
import { AdminLink } from "@/components/AdminLink";
import { isMediumGallerySlug, isStudioGallerySlug, MEDIUM_GALLERY_SLUGS } from "@/lib/mediumGalleries";
import type { Artwork, Series } from "@/db";
import { parseFeaturedArtworkMode, resolveStatementArtwork, usesUploadedCover } from "@/lib/featuredArtwork";
import { privateGalleryHref } from "@/lib/privateGalleries";
import {
  listArtworksForSeries,
  listArtworksGroupedForMediumGalleries,
  listSeriesAdminOverview,
} from "@/lib/queries";

type CoverKind = "upload" | "fixed" | "random";
type ResolvedCover = { image: string; title: string; kind: CoverKind };

function isRandomCover(s: { featuredArtworkMode: string | null; featuredArtworkId: string | null }) {
  return parseFeaturedArtworkMode(s.featuredArtworkMode) !== "static" || !s.featuredArtworkId;
}

function resolveCover(s: Series, pieces: Artwork[]): ResolvedCover {
  const cover = resolveStatementArtwork(s, pieces);
  const kind: CoverKind = usesUploadedCover(s)
    ? "upload"
    : parseFeaturedArtworkMode(s.featuredArtworkMode) === "static" && cover.artwork?.id === s.featuredArtworkId
      ? "fixed"
      : "random";
  return { image: cover.image, title: cover.artwork?.title ?? "", kind };
}

function CoverCaption({ cover }: { cover: ResolvedCover }) {
  return (
    <div className="mt-1 text-xs text-muted">
      {cover.kind === "upload"
        ? "Cover: uploaded card image"
        : cover.kind === "fixed"
          ? `Cover: ${cover.title}`
          : cover.title
            ? `Cover: a random painting on each visit (now showing ${cover.title})`
            : "Cover: no paintings yet"}
    </div>
  );
}

export default async function AdminSeriesIndexPage() {
  const rows = await listSeriesAdminOverview();
  const studioRows = rows.filter((s) => isStudioGallerySlug(s.slug));
  const portfolioRows = rows.filter((s) => isMediumGallerySlug(s.slug) && !isStudioGallerySlug(s.slug));
  const mediumOrder = new Map(
    portfolioRows.map((m) => [m.id, MEDIUM_GALLERY_SLUGS.indexOf(m.slug as (typeof MEDIUM_GALLERY_SLUGS)[number])]),
  );
  const mediumTitle = new Map(portfolioRows.map((m) => [m.id, m.title]));
  const seriesRows = rows
    .filter((s) => s.parentSeriesId && mediumOrder.has(s.parentSeriesId))
    .sort((a, b) => mediumOrder.get(a.parentSeriesId!)! - mediumOrder.get(b.parentSeriesId!)!);
  const privateRows = rows.filter((s) => s.isPrivate);
  const [portfolioPieces, seriesPieces] = await Promise.all([
    listArtworksGroupedForMediumGalleries(portfolioRows),
    Promise.all(seriesRows.map((s) => listArtworksForSeries(s.id))),
  ]);
  const covers = new Map<string, ResolvedCover>([
    ...portfolioRows.map((s) => [s.id, resolveCover(s, portfolioPieces.get(s.id) ?? [])] as const),
    ...seriesRows.map((s, i) => [s.id, resolveCover(s, seriesPieces[i] ?? [])] as const),
  ]);
  const totalArtworks = rows.reduce((n, s) => n + s.artworkCount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Galleries &amp; artwork</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">
            Portfolio galleries appear on <span className="text-ink/80">/medium</span> and in the Portfolio menu.
            The Studio appears under <span className="text-ink/80">About</span>. Series are listed on their
            medium’s page. Click{" "}
            <span className="text-ink/80">Manage paintings</span> to reorder artwork, edit captions, or add new pieces.
          </p>
          <p className="mt-2 text-sm text-ink/80">
            {portfolioRows.length + seriesRows.length + studioRows.length + privateRows.length}{" "}
            {portfolioRows.length + seriesRows.length + studioRows.length + privateRows.length === 1
              ? "gallery"
              : "galleries"} · {totalArtworks}{" "}
            {totalArtworks === 1 ? "painting" : "paintings"}
          </p>
        </div>
      </div>

      {portfolioRows.length === 0 && seriesRows.length === 0 && studioRows.length === 0 && privateRows.length === 0 ? (
        <p className="border border-line bg-white/50 p-6 text-sm text-muted">
          No galleries yet. If the public site shows art but this list is empty, the admin may be connected to a
          different database — check <span className="text-ink/80">DATABASE_URL</span> matches production.
        </p>
      ) : (
        <div className="space-y-10">
          {portfolioRows.length > 0 ? (
            <div data-admin-section="Portfolio galleries" className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl tracking-tight">Portfolio galleries</h2>
                <p className="mt-2 max-w-prose text-sm text-muted">
                  Fixed categories under <span className="text-ink/80">Portfolio</span>—manage paintings inside each,
                  but categories cannot be deleted.
                </p>
              </div>
              <div className="overflow-hidden border border-line bg-white/50">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3">Cover</th>
                      <th className="px-4 py-3">Gallery</th>
                      <th className="px-4 py-3">Paintings</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioRows.map((s) => {
                      const cover = covers.get(s.id)!;
                      return (
                      <tr key={s.id} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-3">
                          <AdminCoverThumb image={cover.image} random={cover.kind === "random"} randomBadge />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-muted">/art/{s.slug}</div>
                          <CoverCaption cover={cover} />
                        </td>
                        <td className="px-4 py-3 text-muted">{s.artworkCount}</td>
                        <td className="px-4 py-3 text-right">
                          <AdminLink href={`/admin/series/${s.id}`}>Manage paintings</AdminLink>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {studioRows.length > 0 ? (
            <div data-admin-section="The Studio (About)" className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl tracking-tight">About</h2>
                <p className="mt-2 max-w-prose text-sm text-muted">
                  The Studio gallery appears under <span className="text-ink/80">About</span> on the public site—not
                  on the Portfolio page.
                </p>
              </div>
              <div className="overflow-hidden border border-line bg-white/50">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3">Cover</th>
                      <th className="px-4 py-3">Gallery</th>
                      <th className="px-4 py-3">Paintings</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studioRows.map((s) => (
                      <tr key={s.id} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-3">
                          <AdminCoverThumb image={s.featuredImage} random={isRandomCover(s)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-muted">/art/{s.slug}</div>
                        </td>
                        <td className="px-4 py-3 text-muted">{s.artworkCount}</td>
                        <td className="px-4 py-3 text-right">
                          <AdminLink href={`/admin/series/${s.id}`}>Manage paintings</AdminLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {seriesRows.length > 0 ? (
            <div data-admin-section="Series" className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl tracking-tight">Series</h2>
                <p className="mt-2 max-w-prose text-sm text-muted">
                  Each series is listed on its medium’s page, under the medium’s gallery.
                </p>
              </div>
              <div className="overflow-hidden border border-line bg-white/50">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3">Cover</th>
                      <th className="px-4 py-3">Series</th>
                      <th className="px-4 py-3">Medium</th>
                      <th className="px-4 py-3">Paintings</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesRows.map((s) => {
                      const cover = covers.get(s.id)!;
                      return (
                      <tr key={s.id} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-3">
                          <AdminCoverThumb image={cover.image} random={cover.kind === "random"} randomBadge />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-muted">/art/{s.slug}</div>
                          <CoverCaption cover={cover} />
                        </td>
                        <td className="px-4 py-3 text-muted">{mediumTitle.get(s.parentSeriesId!)}</td>
                        <td className="px-4 py-3 text-muted">{s.artworkCount}</td>
                        <td className="px-4 py-3 text-right">
                          <AdminLink href={`/admin/series/${s.id}`}>Manage series</AdminLink>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {privateRows.length > 0 ? (
            <div data-admin-section="Private galleries" className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl tracking-tight">Private galleries</h2>
                <p className="mt-2 max-w-prose text-sm text-muted">
                  Share by link only—for exhibition submissions. Not listed on the public portfolio.
                </p>
              </div>
              <div className="overflow-hidden border border-line bg-white/50">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3">Cover</th>
                      <th className="px-4 py-3">Gallery</th>
                      <th className="px-4 py-3">Paintings</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {privateRows.map((s) => (
                      <tr key={s.id} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-3">
                          <AdminCoverThumb image={s.featuredImage} random={isRandomCover(s)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-muted">
                            {s.accessToken ? privateGalleryHref(s.accessToken) : "Link pending"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{s.artworkCount}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <AdminLink href={`/admin/series/${s.id}`}>Manage paintings</AdminLink>
                            <form action={setSeriesPrivacy}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="privacy" value="public" />
                              <button className="text-xs tracking-[0.16em] text-muted uppercase hover:text-ink" type="submit">
                                Make public
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
