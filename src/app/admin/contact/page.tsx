import { AdminExternalLink } from "@/components/AdminLink";
import { AdminContactMessageActions } from "@/components/AdminContactMessageActions";
import { listContactMessages } from "@/lib/contactMessages";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminContactPage() {
  const rows = await listContactMessages();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Contact messages</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Messages from the public contact form. Each submission is saved here and triggers a Gmail notification when
          SMTP is configured.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="border border-line bg-white/50 p-6 text-sm text-muted">No messages yet.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white/50">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-white/80 text-xs tracking-[0.18em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const read = r.readAt != null;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-line align-top last:border-b-0 ${read ? "bg-white/30" : "bg-white/70"}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      {read ? (
                        <span className="text-xs tracking-wide text-muted uppercase">Read</span>
                      ) : (
                        <span className="text-xs font-medium tracking-wide text-ink uppercase">New</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${read ? "text-muted" : "font-medium"}`}>{r.name}</td>
                    <td className="px-4 py-3">
                      <AdminExternalLink href={`mailto:${r.email}`}>{r.email}</AdminExternalLink>
                    </td>
                    <td className="max-w-md px-4 py-3 whitespace-pre-wrap text-muted">{r.message}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <AdminExternalLink
                          href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: your message to Marcy Bergeron-Noa`)}`}
                        >
                          Reply
                        </AdminExternalLink>
                        <AdminContactMessageActions id={r.id} name={r.name} read={read} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
