"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { saveGalleryArtworkOrder } from "@/app/admin/actions";
import { AdminLightboxProvider, AdminLightboxTrigger } from "@/components/AdminImageLightbox";
import { OrderArrows, OrderStatus, useInstantOrder } from "@/components/AdminInstantOrder";
import { adminLinkVariants } from "@/components/AdminLink";

export type AdminGalleryArtworkRow = {
  id: string;
  title: string;
  medium: string;
  size: string;
  image: string;
  alt: string;
};

/** Paintings list whose arrow buttons reorder instantly; the order is saved in the background. */
export function AdminGalleryArtworkTable({ seriesId, rows: initialRows }: { seriesId: string; rows: AdminGalleryArtworkRow[] }) {
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
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, idx) => (
                <tr key={a.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <AdminLightboxTrigger index={idx} label={`View ${a.title}`}>
                      <div className="relative h-16 w-16 overflow-hidden border border-line bg-black/[0.03]">
                        <Image src={a.image} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                    </AdminLightboxTrigger>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted">
                      {a.medium}
                      {a.size ? ` · ${a.size}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{idx + 1}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <OrderArrows label={a.title} index={idx} count={rows.length} onMove={move} />
                      <Link href={`/admin/artworks/${a.id}`} className={adminLinkVariants.secondary}>
                        Edit
                      </Link>
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
