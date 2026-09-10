import type { Series } from "@/db";

type AdminMediumGalleryFieldProps = {
  galleries: Series[];
  /** Current `medium_series_id` (empty = not assigned). */
  value?: string | null;
  required?: boolean;
};

/** Assigns an artwork to a portfolio gallery (`artwork.medium_series_id`). */
export function AdminMediumGalleryField({ galleries, value, required = true }: AdminMediumGalleryFieldProps) {
  return (
    <label className="block text-sm text-muted">
      Portfolio gallery
      <select
        name="mediumSeriesId"
        defaultValue={value ?? ""}
        required={required}
        className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
      >
        <option value="">{required ? "Choose a gallery…" : "None — series only"}</option>
        {galleries.map((g) => (
          <option key={g.id} value={g.id}>
            {g.title}
          </option>
        ))}
      </select>
      <span className="mt-1.5 block text-xs leading-relaxed text-muted">
        Chooses which gallery under <span className="text-ink/80">Portfolio</span> includes this painting.
      </span>
    </label>
  );
}
