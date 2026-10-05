"use client";

import Link from "next/link";
import { useCallback } from "react";
import { saveChildSeriesOrder } from "@/app/admin/actions";
import { OrderArrows, OrderStatus, useInstantOrder } from "@/components/AdminInstantOrder";
import { adminLinkVariants } from "@/components/AdminLink";

export type AdminChildSeriesRow = { id: string; title: string };

/** Series under a medium; arrow buttons set the order they appear on the public page. */
export function AdminChildSeriesList({ mediumId, rows: initialRows }: { mediumId: string; rows: AdminChildSeriesRow[] }) {
  const save = useCallback((ids: string[]) => saveChildSeriesOrder(mediumId, ids), [mediumId]);
  const { rows, status, move } = useInstantOrder(initialRows, save);

  return (
    <div className="mt-6">
      <OrderStatus status={status} />
      <ul className="divide-y divide-line border-t border-line text-sm">
        {rows.map((c, idx) => (
          <li key={c.id} className="flex items-center justify-between gap-4 py-3">
            <span className="flex items-center gap-4">
              <span className="w-5 text-right text-muted">{idx + 1}</span>
              <span>{c.title}</span>
            </span>
            <span className="flex items-center gap-2">
              {rows.length > 1 ? <OrderArrows label={c.title} index={idx} count={rows.length} onMove={move} /> : null}
              <Link href={`/admin/series/${c.id}`} className={adminLinkVariants.secondary}>
                Manage series
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
