import { AdminExternalLink, AdminLink } from "@/components/AdminLink";
import { AdminWorkshopInquiryActions } from "@/components/AdminWorkshopInquiryActions";
import { listWorkshopInquiries } from "@/lib/workshopInquiries";
import { workshopFormatLabel } from "@/lib/workshopCopy";
import { postPublicHref } from "@/lib/postKind";
import { CONTACT } from "@/lib/site";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatLines(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(", ");
}

export default async function AdminWorkshopInquiriesPage() {
  const rows = await listWorkshopInquiries();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Workshop interest</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Notes from the public interest form on each workshop. Each submission is saved here and emailed to{" "}
          {CONTACT.email} when Microsoft 365 SMTP is configured.
        </p>
        <p className="mt-3">
          <AdminLink href="/admin/workshops">← Workshops</AdminLink>
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="border border-line bg-white/50 p-6 text-sm text-muted">No interest notes yet.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white/50">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-white/80 text-xs tracking-[0.18em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Workshop</th>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const read = r.readAt != null;
                const other = formatLines(r.otherWorkshops);
                const groupDates = formatLines(r.groupDates);
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
                    <td className={`px-4 py-3 ${read ? "text-muted" : "font-medium"}`}>
                      {r.workshopTitle}
                      {r.workshopSlug ? (
                        <div className="mt-1">
                          <AdminLink href={postPublicHref("workshop", r.workshopSlug)}>View</AdminLink>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className={read ? "text-muted" : "font-medium"}>{r.name}</div>
                      <div className="mt-1">
                        <AdminExternalLink href={`mailto:${r.email}`}>{r.email}</AdminExternalLink>
                      </div>
                      {r.phone ? <div className="mt-1 text-muted">{r.phone}</div> : null}
                    </td>
                    <td className="max-w-md px-4 py-3 whitespace-pre-wrap text-muted">
                      <p>{workshopFormatLabel(r.format)}</p>
                      {other ? <p className="mt-2">Also interested in: {other}</p> : null}
                      {r.format === "group" && groupDates ? <p className="mt-2">Group dates: {groupDates}</p> : null}
                      {r.format === "solo" && r.soloDate ? <p className="mt-2">Solo date: {r.soloDate}</p> : null}
                      {r.notes ? <p className="mt-2">{r.notes}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <AdminExternalLink
                          href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.workshopTitle}`)}`}
                        >
                          Reply
                        </AdminExternalLink>
                        <AdminWorkshopInquiryActions id={r.id} name={r.name} read={read} />
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
