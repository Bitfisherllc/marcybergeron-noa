import {
  addPostCategory,
  deletePost,
  deletePostCategory,
  reorderPostCategory,
  savePostCategory,
} from "@/app/admin/actions";
import { AdminLink, adminBtnDanger, adminBtnPrimary } from "@/components/AdminLink";
import { AdminReorderButtons } from "@/components/AdminReorderButtons";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { listAllPostsAdmin, listPostCategories } from "@/lib/queries";

const errorCopy: Record<string, string> = {
  "category-name": "Enter a category name.",
  "category-exists": "That category already exists.",
  "category-in-use": "Move posts out of this category before deleting it.",
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [rows, categories] = await Promise.all([listAllPostsAdmin(), listPostCategories()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Posts</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">Drafts stay private until published.</p>
          {sp.saved === "category" ? <p className="mt-3 text-sm text-ink">Saved categories.</p> : null}
          {sp.error && errorCopy[sp.error] ? <p className="mt-3 text-sm text-red-700">{errorCopy[sp.error]}</p> : null}
        </div>
        <AdminLink variant="primary" href="/admin/posts/new">
          New post
        </AdminLink>
      </div>

      <div className="overflow-hidden border border-line bg-white/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-muted">{p.category}</td>
                <td className="px-4 py-3 text-muted">{p.published ? "Published" : "Draft"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AdminLink href={`/admin/posts/${p.id}`}>Edit</AdminLink>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={adminBtnDanger} type="submit">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-line bg-white/50 p-6">
        <h2 className="font-serif text-xl tracking-tight">Categories</h2>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Choose a category on each post. Add more names here whenever you need them.
        </p>
        <form action={addPostCategory} className="mt-6 flex flex-wrap items-end gap-4 border-t border-line pt-6">
          <label className="block min-w-[16rem] flex-1 text-sm text-muted">
            New category
            <input
              name="name"
              required
              placeholder="e.g. Press"
              className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <button className={adminBtnPrimary} type="submit">
            Add category
          </button>
        </form>
        {categories.length > 0 ? (
          <ul className="mt-6 space-y-4 border-t border-line pt-6">
            {categories.map((cat, i) => (
              <li
                key={cat.id}
                className="flex flex-wrap items-start gap-4 border-b border-line/80 pb-6 last:border-b-0 last:pb-0"
              >
                <form id={`post-category-${cat.id}`} action={savePostCategory} className="min-w-0 flex-1">
                  <input type="hidden" name="id" value={cat.id} />
                  <label className="block text-sm text-muted">
                    Name
                    <input
                      name="name"
                      required
                      defaultValue={cat.name}
                      className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
                    />
                  </label>
                  <AdminDirtySave formId={`post-category-${cat.id}`} />
                </form>
                <div className="flex shrink-0 flex-wrap items-center gap-2 self-start pt-6">
                  <AdminReorderButtons
                    action={reorderPostCategory}
                    fields={{ id: cat.id }}
                    disableUp={i === 0}
                    disableDown={i === categories.length - 1}
                  />
                  <form action={deletePostCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <button type="submit" className={adminBtnDanger}>
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
