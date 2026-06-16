import Image from "next/image";
import Link from "next/link";
import { deleteSeries, reorderSeries } from "@/app/admin/actions";
import { listSeriesAdminOverview } from "@/lib/queries";

export default async function AdminSeriesIndexPage() {
  const rows = await listSeriesAdminOverview();
  const totalArtworks = rows.reduce((n, s) => n + s.artworkCount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Galleries &amp; artwork</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">
            Each row is a gallery on <span className="text-ink/80">/art</span>. Click{" "}
            <span className="text-ink/80">Manage paintings</span> to see every photo, reorder with Up/Down, or edit
            captions. Use Up/Down here to change gallery order on the Art page.
          </p>
          <p className="mt-2 text-sm text-ink/80">
            {rows.length} {rows.length === 1 ? "gallery" : "galleries"} · {totalArtworks}{" "}
            {totalArtworks === 1 ? "painting" : "paintings"}
          </p>
        </div>
        <Link
          className="inline-flex border border-ink px-4 py-3 text-xs tracking-[0.18em] uppercase hover:bg-black/[0.03]"
          href="/admin/series/new"
        >
          New gallery
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="border border-line bg-white/50 p-6 text-sm text-muted">
          No galleries yet. If the public site shows art but this list is empty, the admin may be connected to a
          different database — check <span className="text-ink/80">DATABASE_URL</span> matches production.
        </p>
      ) : (
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
                    <div className="relative h-16 w-24 overflow-hidden border border-line bg-black/[0.03]">
                      <Image src={s.featuredImage} alt="" fill className="object-cover" sizes="96px" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-muted">/art/{s.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.artworkCount}</td>
                  <td className="px-4 py-3 text-muted">{idx + 1}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={reorderSeries}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button className="text-xs hover:underline" type="submit" disabled={idx === 0}>
                          Up
                        </button>
                      </form>
                      <form action={reorderSeries}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button className="text-xs hover:underline" type="submit" disabled={idx === rows.length - 1}>
                          Down
                        </button>
                      </form>
                      <Link className="text-xs font-medium tracking-wide text-ink hover:underline" href={`/admin/series/${s.id}`}>
                        Manage paintings
                      </Link>
                      <form action={deleteSeries}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-xs tracking-wide text-red-700 hover:underline" type="submit">
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
      )}
    </div>
  );
}
