import Image from "next/image";
import { deleteSeries, reorderSeries } from "@/app/admin/actions";
import { AdminLightboxProvider, AdminLightboxTrigger } from "@/components/AdminImageLightbox";
import { AdminLink, adminBtnDanger } from "@/components/AdminLink";
import { AdminReorderButtons } from "@/components/AdminReorderButtons";
import { listSeriesAdminOverview } from "@/lib/queries";

export default async function AdminSeriesIndexPage() {
  const rows = await listSeriesAdminOverview();
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
            captions. Use the arrows here to change gallery order on the Art page.
          </p>
          <p className="mt-2 text-sm text-ink/80">
            {rows.length} {rows.length === 1 ? "gallery" : "galleries"} · {totalArtworks}{" "}
            {totalArtworks === 1 ? "painting" : "paintings"}
          </p>
        </div>
        <AdminLink variant="primary" href="/admin/series/new">
          New gallery
        </AdminLink>
      </div>

      {rows.length === 0 ? (
        <p className="border border-line bg-white/50 p-6 text-sm text-muted">
          No galleries yet. If the public site shows art but this list is empty, the admin may be connected to a
          different database — check <span className="text-ink/80">DATABASE_URL</span> matches production.
        </p>
      ) : (
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
                {rows.map((s, idx) => (
                  <tr key={s.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <AdminLightboxTrigger index={idx} label={`View ${s.title} cover`}>
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
                        disableDown={idx === rows.length - 1}
                      />
                      <AdminLink href={`/admin/series/${s.id}`}>Manage paintings</AdminLink>
                      <form action={deleteSeries}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className={adminBtnDanger} type="submit">
                          Delete
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
      )}
    </div>
  );
}
