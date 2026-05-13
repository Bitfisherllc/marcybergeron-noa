import Link from "next/link";
import { deleteSeries } from "@/app/admin/actions";
import { listSeries } from "@/lib/queries";

export default async function AdminSeriesIndexPage() {
  const rows = await listSeries();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Series</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">
            Each series appears as a card on <span className="text-ink/80">/art</span> with featured image, title,
            excerpt, and link.
          </p>
        </div>
        <Link
          className="inline-flex border border-ink px-4 py-3 text-xs tracking-[0.18em] uppercase hover:bg-black/[0.03]"
          href="/admin/series/new"
        >
          New series
        </Link>
      </div>

      <div className="overflow-hidden border border-line bg-white/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 font-medium">{s.title}</td>
                <td className="px-4 py-3 text-muted">{s.slug}</td>
                <td className="px-4 py-3 text-muted">{s.sortOrder}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link className="text-xs tracking-wide hover:underline" href={`/admin/series/${s.id}`}>
                      Edit
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
    </div>
  );
}
