import type { Series } from "@/db";

type AdminPortfolioSeriesFieldProps = {
  series: Series[];
  selectedIds: string[];
};

/** Portfolio series checkboxes (`artwork_series` rows). Medium uses a separate dropdown. */
export function AdminPortfolioSeriesField({ series, selectedIds }: AdminPortfolioSeriesFieldProps) {
  const selected = new Set(selectedIds);

  return (
    <fieldset className="space-y-3 border border-line bg-white/35 p-4">
      <legend className="px-1 text-sm text-muted">Portfolio series</legend>
      <p className="text-xs leading-relaxed text-muted">
        Optional when a medium gallery is selected below. Check every portfolio series where this painting should
        appear. A piece can belong to more than one series.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {series.map((s) => (
          <label key={s.id} className="flex items-start gap-2.5 text-sm text-ink/90">
            <input
              type="checkbox"
              name="seriesIds"
              value={s.id}
              defaultChecked={selected.has(s.id)}
              className="mt-1 h-4 w-4 shrink-0 border-line"
            />
            <span>{s.title}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
