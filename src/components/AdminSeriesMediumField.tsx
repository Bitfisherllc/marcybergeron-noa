import type { Series } from "@/db";

type AdminSeriesMediumFieldProps = {
  mediums: Pick<Series, "id" | "title">[];
  /** Current `parent_series_id` (empty = not chosen yet). */
  value?: string | null;
};

/** Chooses which medium page lists this series (`series.parent_series_id`). */
export function AdminSeriesMediumField({ mediums, value }: AdminSeriesMediumFieldProps) {
  return (
    <label className="block text-sm text-muted">
      Medium
      <select
        name="parentSeriesId"
        defaultValue={value ?? ""}
        required
        className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Choose a medium…
        </option>
        {mediums.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
      <span className="mt-1.5 block text-xs leading-relaxed text-muted">
        The series is listed on this medium’s page, under its gallery.
      </span>
    </label>
  );
}
