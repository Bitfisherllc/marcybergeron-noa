import Image from "next/image";
import { reorderSeries, setSeriesPrivacy } from "@/app/admin/actions";
import { AdminLightboxProvider, AdminLightboxTrigger } from "@/components/AdminImageLightbox";
import { AdminLink } from "@/components/AdminLink";
import { AdminReorderButtons } from "@/components/AdminReorderButtons";
import { isMediumGallerySlug } from "@/lib/mediumGalleries";
import { privateGalleryHref } from "@/lib/privateGalleries";
import { listSeriesAdminOverview } from "@/lib/queries";

export default async function AdminSeriesIndexPage() {
  const rows = await listSeriesAdminOverview();
  const publicRows = rows.filter((s) => !s.isPrivate && !isMediumGallerySlug(s.slug));
  const privateRows = rows.filter((s) => s.isPrivate);
  const mediumRows = rows.filter((s) => isMediumGallerySlug(s.slug));
  const totalArtworks = rows.reduce((n, s) => n + s.artworkCount, 0);

  const coverSlides = rows.map((s) => ({
    src: s.featuredImage,
    alt: s.title,
    caption: s.title,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Galleries &amp; artwork</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">
            Each row is a gallery on <span className="text-ink/80">/art</span>. Click{" "}
            <span className="text-ink/80">Manage paintings</span> to see every photo, reorder with the arrow buttons, or edit
            captions. Use the arrows here to change gallery order on the Portfolio page.
          </p>
          <p className="mt-2 text-sm text-ink/80">
            {rows.length} {rows.length === 1 ? "gallery" : "galleries"} · {totalArtworks}{" "}
            {totalArtworks === 1 ? "painting" : "paintings"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminLink variant="primary" href="/admin/series/new">
            New gallery
          </AdminLink>
          <AdminLink variant="secondary" href="/admin/series/new?private=1">
            New private gallery
          </AdminLink>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="border border-line bg-white/50 p-6 text-sm text-muted">
          No galleries yet. If the public site shows art but this list is empty, the admin may be connected to a
          different database — check <span className="text-ink/80">DATABASE_URL</span> matches production.
        </p>
      ) : (
        <div className="space-y-10">
          {publicRows.length > 0 ? (
            <AdminLightboxProvider slides={coverSlides}>
              <div className="overflow-hidden border border-line bg-white/50">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3">Cover</th>
                      <th className="px-4 py-3">Gallery</th>
                      <th className="px-4 py-3">Paintings</th>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicRows.map((s, idx) => (
                      <tr key={s.id} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-3">
                          <AdminLightboxTrigger
                            index={rows.findIndex((row) => row.id === s.id)}
                            label={`View ${s.title} cover`}
                          >
                            <div className="relative h-16 w-24 overflow-hidden border border-line bg-black/[0.03]">
                              <Image src={s.featuredImage} alt="" fill className="object-cover" sizes="96px" />
                            </div>
                          </AdminLightboxTrigger>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-muted">/art/{s.slug}</div>
                        </td>
                        <td className="px-4 py-3 text-muted">{s.artworkCount}</td>
                        <td className="px-4 py-3 text-muted">{idx + 1}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <AdminReorderButtons
                              action={reorderSeries}
                              fields={{ id: s.id }}
                              disableUp={idx === 0}
                              disableDown={idx === publicRows.length - 1}
                            />
                            <AdminLink href={`/admin/series/${s.id}`}>Manage paintings</AdminLink>
                            <form action={setSeriesPrivacy}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="privacy" value="private" />
                              <button className="text-xs tracking-[0.16em] text-muted uppercase hover:text-ink" type="submit">
                                Make private
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminLightboxProvider>
          ) : null}

          {privateRows.length > 0 ? (
            <div className="space-y-4">
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
                          <div className="relative h-16 w-24 overflow-hidden border border-line bg-black/[0.03]">
                            <Image src={s.featuredImage} alt="" fill className="object-cover" sizes="96px" />
                          </div>
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

          {mediumRows.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl tracking-tight">Medium galleries</h2>
                <p className="mt-2 max-w-prose text-sm text-muted">
                  Fixed categories under <span className="text-ink/80">Medium</span>—manage paintings inside each, but
                  categories cannot be deleted.
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
                    {mediumRows.map((s) => (
                      <tr key={s.id} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="relative h-16 w-24 overflow-hidden border border-line bg-black/[0.03]">
                            <Image src={s.featuredImage} alt="" fill className="object-cover" sizes="96px" />
                          </div>
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
        </div>
      )}
    </div>
  );
}
