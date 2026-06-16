import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reorderArtwork, upsertArtwork, upsertSeries } from "@/app/admin/actions";
import { getSeriesById, listArtworksForSeries } from "@/lib/queries";

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSeriesById(id);
  if (!s) notFound();
  const arts = await listArtworksForSeries(s.id);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Edit gallery</h1>
        <p className="mt-3 text-sm text-muted">
          Public page: <span className="text-ink/80">/art/{s.slug}</span> · {arts.length}{" "}
          {arts.length === 1 ? "painting" : "paintings"}
        </p>
      </div>

      <form action={upsertSeries} className="space-y-6 border border-line bg-white/50 p-6">
        <input type="hidden" name="id" value={s.id} />
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
        <label className="block text-sm text-muted">
          Excerpt
          <textarea name="excerpt" required rows={4} defaultValue={s.excerpt} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm text-muted">
          Full statement (Markdown)
          <textarea name="content" rows={10} defaultValue={s.content} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-muted">
            Sort order
            <input name="sortOrder" defaultValue={String(s.sortOrder)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Replace featured image
            <input name="featured" type="file" accept="image/*" className="mt-2 w-full text-sm" />
          </label>
        </div>
        <input type="hidden" name="featuredExisting" value={s.featuredImage} />
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-36 overflow-hidden border border-line bg-black/[0.03]">
            <Image src={s.featuredImage} alt="" fill className="object-cover" />
          </div>
          <p className="text-xs text-muted">Leave file empty to keep the current featured image.</p>
        </div>
        <button className="border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase" type="submit">
          Save series
        </button>
      </form>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Paintings in this gallery</h2>
            <p className="mt-2 text-sm text-muted">
              All photos shown on the public gallery page. Use Up/Down to change order.
            </p>
          </div>
        </div>

        <div className="overflow-hidden border border-line bg-white/50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {arts.map((a, idx) => (
                <tr key={a.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="relative h-16 w-16 overflow-hidden border border-line bg-black/[0.03]">
                      <Image src={a.image} alt="" fill className="object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted">
                      {a.medium} · {a.size}
                      {a.year ? ` · ${a.year}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{a.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <form action={reorderArtwork}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="seriesId" value={s.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button className="text-xs hover:underline" type="submit" disabled={idx === 0}>
                          Up
                        </button>
                      </form>
                      <form action={reorderArtwork}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="seriesId" value={s.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button className="text-xs hover:underline" type="submit" disabled={idx === arts.length - 1}>
                          Down
                        </button>
                      </form>
                      <Link className="text-xs hover:underline" href={`/admin/artworks/${a.id}`}>
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-line bg-white/50 p-6">
        <h3 className="font-serif text-xl tracking-tight">Add artwork</h3>
        <form action={upsertArtwork} className="mt-6 space-y-4">
          <input type="hidden" name="id" value="" />
          <input type="hidden" name="seriesId" value={s.id} />
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
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm text-muted">
              Medium
              <input name="medium" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Size
              <input name="size" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Year
              <input name="year" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="block text-sm text-muted">
            Description (optional)
            <textarea name="description" rows={3} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm text-muted">
            Alt text (optional)
            <input name="alt" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-muted">
              Image (required)
              <input name="image" type="file" accept="image/*" required className="mt-2 w-full text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Sort order
              <input name="sortOrder" defaultValue={String((arts[arts.length - 1]?.sortOrder ?? -1) + 1)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <button className="border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase" type="submit">
            Add artwork
          </button>
        </form>
      </div>
    </div>
  );
}
