import type { PostCategory } from "@/db";

export function AdminPostCategorySelect({
  categories,
  defaultValue,
}: {
  categories: PostCategory[];
  defaultValue?: string;
}) {
  const names = new Set(categories.map((c) => c.name));
  const extra = defaultValue && !names.has(defaultValue) ? defaultValue : null;

  return (
    <label className="block text-sm text-muted">
      Category
      <select
        name="category"
        required
        defaultValue={defaultValue && (names.has(defaultValue) || extra) ? defaultValue : categories[0]?.name ?? ""}
        className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
      >
        {extra ? <option value={extra}>{extra}</option> : null}
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
