import type { ReactNode } from "react";

export type WhereShownPlace = { where: ReactNode; detail: ReactNode; href?: string };

/** Tells the admin where a field's text shows up on the public site. */
export function AdminWhereShown({ places, note }: { places: WhereShownPlace[]; note?: ReactNode }) {
  return (
    <div className="mt-2 border-l-2 border-line pl-3 text-xs leading-relaxed text-muted">
      <p className="font-medium text-ink/80">Where this appears on the website</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {places.map((place, i) => (
          <li key={i}>
            <span className="text-ink/80">{place.where}</span> — {place.detail}
            {place.href ? (
              <>
                {" "}
                <a href={place.href} target="_blank" rel="noreferrer" className="link-quiet whitespace-nowrap">
                  View ↗
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      {note ? <p className="mt-1">{note}</p> : null}
    </div>
  );
}
