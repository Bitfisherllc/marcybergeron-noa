import { AdminLink, adminBtnDanger } from "@/components/AdminLink";
import { deletePost } from "@/app/admin/actions";
import { listAllPostsAdmin } from "@/lib/queries";

export default async function AdminPostsPage() {
  const rows = await listAllPostsAdmin();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Posts</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">Drafts stay private until published.</p>
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
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-muted">{p.slug}</td>
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
    </div>
  );
}
