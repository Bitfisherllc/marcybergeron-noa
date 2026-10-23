"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { deleteArtwork, saveGalleryArtworkOrder } from "@/app/admin/actions";
import { AdminHideArtworkForm } from "@/components/AdminHideArtworkForm";
import { AdminLightboxProvider, AdminLightboxTrigger } from "@/components/AdminImageLightbox";
import { OrderArrows, OrderStatus, useInstantOrder } from "@/components/AdminInstantOrder";
import { adminBtnDanger, adminLinkVariants } from "@/components/AdminLink";
import { formatArtworkPrice } from "@/lib/artworkPrice";

export type AdminGalleryPlace = {
  kind: string;
  title: string;
};

export type AdminGalleryArtworkRow = {
  id: string;
  title: string;
  medium: string;
  size: string;
  description: string;
  status: string;
  price: number | null;
  places: AdminGalleryPlace[];
  image: string;
  alt: string;
  hidden: boolean;
  /** This painting also appears in another gallery. */
  alsoElsewhere?: boolean;
};

function statusLabel(status: string) {
  if (status === "sold") return "Sold";
  if (status === "available") return "Available";
  return "Unknown";
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-x-3">
      <dt className="text-[0.68rem] tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="min-w-0 text-sm leading-snug text-ink">{children}</dd>
    </div>
  );
}

/** Paintings list whose arrow buttons reorder instantly; the order is saved in the background. */
export function AdminGalleryArtworkTable({
  seriesId,
  returnPath,
  rows: initialRows,
}: {
  seriesId: string;
  returnPath: string;
  rows: AdminGalleryArtworkRow[];
}) {
  const save = useCallback((ids: string[]) => saveGalleryArtworkOrder(seriesId, ids), [seriesId]);
  const { rows, status, move } = useInstantOrder(initialRows, save);
  const slides = rows.map((a) => ({ src: a.image, alt: a.alt || a.title, caption: a.title }));

  return (
    <>
      <OrderStatus status={status} />
      <AdminLightboxProvider slides={slides}>
        <div className="overflow-hidden border border-line bg-white/50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Painting</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, idx) => (
                <tr key={a.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-4 align-top">
                    <AdminLightboxTrigger index={idx} label={`View ${a.title}`}>
                      <div className="relative h-16 w-16 overflow-hidden border border-line bg-black/[0.03]">
                        <Image src={a.image} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                    </AdminLightboxTrigger>
                  </td>
                  <td className="max-w-xl px-4 py-4 align-top">
                    <div className="font-medium">{a.title}</div>
                    {a.hidden ? <div className="mt-1 text-xs text-muted">Hidden from the public site</div> : null}
                    <dl className="mt-3 space-y-1.5">
                      <Detail label="Galleries">
                        {a.places.length > 0 ? (
                          <ul>
                            {a.places.map((place) => (
                              <li key={`${place.kind}:${place.title}`}>
                                {place.kind}: {place.title}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Detail>
                      <Detail label="Material">{a.medium || <span className="text-muted">—</span>}</Detail>
                      <Detail label="Size">{a.size || <span className="text-muted">—</span>}</Detail>
                      <Detail label="Description">
                        {a.description ? (
                          <span className="whitespace-pre-wrap">{a.description}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Detail>
                      <Detail label="Status">{statusLabel(a.status)}</Detail>
                      <Detail label="Price">
                        {a.price == null ? <span className="text-muted">—</span> : formatArtworkPrice(a.price)}
                      </Detail>
                    </dl>
                  </td>
                  <td className="px-4 py-4 align-top text-muted">{idx + 1}</td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <OrderArrows label={a.title} index={idx} count={rows.length} onMove={move} />
                      <Link href={`/admin/artworks/${a.id}`} className={adminLinkVariants.secondary}>
                        Edit
                      </Link>
                      <AdminHideArtworkForm
                        artworkId={a.id}
                        hidden={a.hidden}
                        returnPath={returnPath}
                        seriesId={seriesId}
                      />
                      <form action={deleteArtwork}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="contextSeriesId" value={seriesId} />
                        <button
                          type="submit"
                          className={adminBtnDanger}
                          onClick={(e) => {
                            const message = a.alsoElsewhere
                              ? `Remove “${a.title}” from this gallery? It stays in the other galleries.`
                              : `Delete “${a.title}”? This is its only gallery, so it will be removed from the site.`;
                            if (!confirm(message)) e.preventDefault();
                          }}
                        >
                          {a.alsoElsewhere ? "Remove" : "Delete"}
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
    </>
  );
}
