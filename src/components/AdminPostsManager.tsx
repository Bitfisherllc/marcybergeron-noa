import {
  addPostCategory,
  deletePost,
  deletePostCategory,
  reorderPostCategory,
  savePostCategory,
  savePostIndexCopy,
} from "@/app/admin/actions";
import { AdminLink, adminBtnDanger, adminBtnPrimary } from "@/components/AdminLink";
import { AdminReorderButtons } from "@/components/AdminReorderButtons";
import { AdminDirtySave } from "@/components/AdminSectionSave";
import { listAllPostsAdmin, listPostCategories } from "@/lib/queries";
import { getResolvedPostIndexCopy } from "@/lib/postIndexCopy";
import { postAdminBasePath, postKindCopy, type PostKind } from "@/lib/postKind";
import { formatWorkshopPrice } from "@/lib/workshopPrice";
import { workshopDatesLabel } from "@/lib/workshopCopy";

const errorCopy: Record<string, string> = {
  "category-name": "Enter a category name.",
  "category-exists": "That category already exists.",
  "category-in-use": "Move posts out of this category before deleting it.",
};

export async function AdminPostsManager({
  kind,
  searchParams,
}: {
  kind: PostKind;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const copy = postKindCopy(kind);
  const adminBase = postAdminBasePath(kind);
  const [rows, categories, header] = await Promise.all([
    listAllPostsAdmin(kind),
    listPostCategories(kind),
    getResolvedPostIndexCopy(kind),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">{copy.adminTitle}</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">{copy.adminIntro}</p>
          {kind === "workshop" ? (
            <p className="mt-3 text-sm">
              <AdminLink href="/admin/workshop-inquiries">Workshop interest notes →</AdminLink>
            </p>
          ) : null}
          {sp.saved === "category" ? <p className="mt-3 text-sm text-ink">Saved categories.</p> : null}
          {sp.saved === "page" ? <p className="mt-3 text-sm text-ink">Saved page intro.</p> : null}
          {sp.error && errorCopy[sp.error] ? <p className="mt-3 text-sm text-red-700">{errorCopy[sp.error]}</p> : null}
        </div>
        <AdminLink variant="primary" href={`${adminBase}/new`}>
          {copy.adminNew}
        </AdminLink>
      </div>

      <form id="post-index-copy" action={savePostIndexCopy} className="border border-line bg-white/50 p-6">
        <input type="hidden" name="kind" value={kind} />
        <h2 className="font-serif text-xl tracking-tight">Page intro</h2>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Shown at the top of the public {kind === "workshop" ? "Workshops" : "News"} page. A red{" "}
          <strong className="font-medium text-ink">SAVE</strong> button appears after you change something.
        </p>
        <label className="mt-6 block text-sm text-muted">
          Eyebrow
          <input
            name="eyebrow"
            defaultValue={header.eyebrow}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Heading
          <input
            name="title"
            defaultValue={header.heading}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Intro
          <textarea
            name="intro"
            rows={4}
            defaultValue={header.intro}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm leading-relaxed"
          />
        </label>
        <AdminDirtySave formId="post-index-copy" />
      </form>

      <div className="overflow-hidden border border-line bg-white/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-white/70 text-xs tracking-[0.18em] text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              {kind === "workshop" ? <th className="px-4 py-3">Cost</th> : null}
              {kind === "workshop" ? <th className="px-4 py-3">Dates</th> : null}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-muted">{p.category}</td>
                {kind === "workshop" ? (
                  <td className="px-4 py-3 text-muted">{formatWorkshopPrice(p.price)}</td>
                ) : null}
                {kind === "workshop" ? (
                  <td className="px-4 py-3 text-muted">{workshopDatesLabel(p.sessionDates)}</td>
                ) : null}
                <td className="px-4 py-3 text-muted">{p.published ? "Published" : "Draft"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AdminLink href={`${adminBase}/${p.id}`}>Edit</AdminLink>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="kind" value={kind} />
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
        <p className="mt-2 max-w-prose text-sm text-muted">{copy.categorySectionHint}</p>
        <form action={addPostCategory} className="mt-6 flex flex-wrap items-end gap-4 border-t border-line pt-6">
          <input type="hidden" name="kind" value={kind} />
          <label className="block min-w-[16rem] flex-1 text-sm text-muted">
            New category
            <input
              name="name"
              required
              placeholder={kind === "workshop" ? "e.g. Encaustic" : "e.g. Press"}
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
                  <input type="hidden" name="kind" value={kind} />
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
                    fields={{ id: cat.id, kind }}
                    disableUp={i === 0}
                    disableDown={i === categories.length - 1}
                  />
                  <form action={deletePostCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <input type="hidden" name="kind" value={kind} />
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
