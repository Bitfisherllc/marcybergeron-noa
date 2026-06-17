import Image from "next/image";
import { notFound } from "next/navigation";
import { deleteArtwork, upsertArtwork } from "@/app/admin/actions";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { AdminLightboxThumb } from "@/components/AdminImageLightbox";
import { AdminLink, adminBtnDanger, adminBtnPrimary } from "@/components/AdminLink";
import { getArtwork, getSeriesById } from "@/lib/queries";

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getArtwork(id);
  if (!a) notFound();
  const s = await getSeriesById(a.seriesId);
  if (!s) notFound();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Artwork</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">{a.title}</h1>
        <p className="mt-3 text-sm text-muted">
          Series: <AdminLink href={`/admin/series/${s.id}`}>{s.title}</AdminLink>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AdminLightboxThumb src={a.image} alt={a.alt || a.title} caption={a.title}>
            <div className="relative aspect-[3/4] overflow-hidden border border-line bg-black/[0.03]">
              <Image src={a.image} alt="" fill className="object-cover" />
            </div>
          </AdminLightboxThumb>
        </div>

        <div className="lg:col-span-7">
          <form action={upsertArtwork} className="space-y-5 border border-line bg-white/50 p-6">
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="seriesId" value={a.seriesId} />
            <input type="hidden" name="imageExisting" value={a.image} />

            <label className="block text-sm text-muted">
              Title
              <input name="title" required defaultValue={a.title} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm text-muted">
                Medium
                <input name="medium" defaultValue={a.medium} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm text-muted">
                Size
                <input name="size" defaultValue={a.size} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm text-muted">
                Year
                <input name="year" defaultValue={a.year} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
              </label>
            </div>
            <label className="block text-sm text-muted">
              Description
              <textarea name="description" rows={4} defaultValue={a.description} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Alt text
              <input name="alt" defaultValue={a.alt} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm text-muted">
              Status
              <select name="status" defaultValue={a.status} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm">
                <option value="unknown">Unknown</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
            <label className="block text-sm text-muted">
              Sort order
              <input name="sortOrder" defaultValue={String(a.sortOrder)} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
            </label>
            <AdminFilePicker name="image" label="Add image" buttonLabel="Choose image" />

            <div className="flex flex-wrap gap-3">
              <button className={adminBtnPrimary} type="submit">
                Save artwork
              </button>
              <AdminLink variant="back" href={`/admin/series/${s.id}`}>
                Back
              </AdminLink>
            </div>
          </form>

          <form action={deleteArtwork} className="mt-6 border border-red-200 bg-red-50/40 p-4">
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="seriesId" value={a.seriesId} />
            <button className={adminBtnDanger} type="submit">
              Delete artwork
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
