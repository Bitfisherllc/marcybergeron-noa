import Image from "next/image";
import { notFound } from "next/navigation";
import { reorderArtwork, upsertArtwork, upsertSeries } from "@/app/admin/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLightboxProvider, AdminLightboxThumb, AdminLightboxTrigger } from "@/components/AdminImageLightbox";
import { AdminLink } from "@/components/AdminLink";
import { AdminReorderButtons } from "@/components/AdminReorderButtons";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { getSeriesById, listArtworksForSeries } from "@/lib/queries";

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSeriesById(id);
  if (!s) notFound();
  const arts = await listArtworksForSeries(s.id);
  const artworkSlides = arts.map((a) => ({
    src: a.image,
    alt: a.alt || a.title,
    caption: a.title,
  }));

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Edit gallery</h1>
        <p className="mt-3 text-sm text-muted">
          Public page: <span className="text-ink/80">/art/{s.slug}</span> · {arts.length}{" "}
          {arts.length === 1 ? "painting" : "paintings"}
        </p>
      </div>

      <form id="series-edit" action={upsertSeries} className="space-y-6 border border-line bg-white/50 p-6">
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
          <AdminFilePicker name="featured" label="Featured image" buttonLabel="Choose image" />
        </div>
        <input type="hidden" name="featuredExisting" value={s.featuredImage} />
        <div className="flex items-center gap-4">
          <AdminLightboxThumb src={s.featuredImage} alt={s.title} caption={`${s.title} — featured image`}>
            <div className="relative h-24 w-36 cursor-zoom-in overflow-hidden border border-line bg-black/[0.03]">
              <Image src={s.featuredImage} alt="" fill className="object-cover" />
            </div>
          </AdminLightboxThumb>
          <p className="text-xs text-muted">Click image to enlarge. Leave file empty to keep the current featured image.</p>
        </div>
        <AdminDirtySave formId="series-edit" />
      </form>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Paintings in this gallery</h2>
            <p className="mt-2 text-sm text-muted">
              All photos shown on the public gallery page. Use the arrow buttons to change order.
            </p>
          </div>
        </div>

        <AdminLightboxProvider slides={artworkSlides}>
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
                    <AdminLightboxTrigger index={idx} label={`View ${a.title}`}>
                      <div className="relative h-16 w-16 overflow-hidden border border-line bg-black/[0.03]">
                        <Image src={a.image} alt="" fill className="object-cover" />
                      </div>
                    </AdminLightboxTrigger>
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
                    <div className="flex items-center justify-end gap-2">
                      <AdminReorderButtons
                        action={reorderArtwork}
                        fields={{ id: a.id, seriesId: s.id }}
                        disableUp={idx === 0}
                        disableDown={idx === arts.length - 1}
                      />
                      <AdminLink href={`/admin/artworks/${a.id}`}>Edit</AdminLink>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </AdminLightboxProvider>
      </div>

      <div className="border border-line bg-white/50 p-6">
        <h3 className="font-serif text-xl tracking-tight">Add artwork</h3>
        <form id="series-add-artwork" action={upsertArtwork} className="mt-6 space-y-4">
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
            <AdminFilePicker name="image" label="Add image" buttonLabel="Choose image" required />
            <label className="block text-sm text-muted">
              Sort order
              <input name="sortOrder" defaultValue={String((arts[arts.length - 1]?.sortOrder ?? -1) + 1)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
          </div>
          <AdminDirtySave formId="series-add-artwork" />
        </form>
      </div>
    </div>
  );
}
