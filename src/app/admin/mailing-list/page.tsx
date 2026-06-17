import { AdminExternalLink } from "@/components/AdminLink";
import { listMailingListSignups } from "@/lib/queries";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminMailingListPage() {
  const rows = await listMailingListSignups();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Mailing list</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Signups from the public site. Export or sync to Mailchimp (or another provider) when you are ready—nothing is
          sent to third parties from this form yet.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No signups yet.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white/50">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-white/80 text-xs tracking-[0.18em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdminExternalLink href={`mailto:${r.email}`}>{r.email}</AdminExternalLink>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
